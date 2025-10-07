import { NextResponse } from "next/server";
import { getAuthSession } from "../../../../auth";
import { getSupabaseAdminClient } from "../../../../lib/supabaseAdmin";
import type { SupabaseClient } from "@supabase/supabase-js";

const VALID_PLANS = new Set([
  "trial",
  "pay_per_use",
  "bundle",
  "subscription",
]);

async function fetchUserState(
  supabase: SupabaseClient<any>,
  userId: string
) {
  const profilePromise = supabase
    .from("billing_profiles")
    .select("plan_type, subscription_status")
    .eq("user_id", userId)
    .maybeSingle();

  const creditPromise = supabase
    .from("credit_balances")
    .select("remaining, plan_type")
    .eq("user_id", userId)
    .maybeSingle();

  const usagePromise = supabase
    .from("usage_events")
    .select("id, created_at, provider, approach, credits_consumed")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(10);

  const [profileResult, creditResult, usageResult] = await Promise.all([
    profilePromise,
    creditPromise,
    usagePromise,
  ]);

  return {
    billing: profileResult.error ? null : profileResult.data,
    credits: creditResult.error ? null : creditResult.data,
    usage: usageResult.error ? [] : usageResult.data ?? [],
  };
}

export async function POST(request: Request) {
  const session = await getAuthSession();
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json(
      { error: "Supabase is not configured for admin actions." },
      { status: 503 }
    );
  }

  const supabaseClient = supabase as SupabaseClient<any>;

  let payload: any;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
  }

  const action: string | undefined = payload?.action;
  const rawEmail: string | undefined = payload?.email;
  const email = rawEmail?.trim().toLowerCase();

  if (!action) {
    return NextResponse.json({ error: "Missing action." }, { status: 400 });
  }

  const nextAuth = supabaseClient.schema("next_auth");

  async function locateUser() {
    if (!email) {
      return { error: NextResponse.json({ error: "Email is required." }, { status: 400 }) };
    }

    const { data: user, error } = await nextAuth
      .from("users")
      .select("id, email, name")
      .eq("email", email)
      .maybeSingle();

    if (error) {
      console.error("Admin lookup failed", error);
      return {
        error: NextResponse.json({ error: "Failed to load user." }, { status: 500 }),
      };
    }

    if (!user) {
      return { error: NextResponse.json({ error: "User not found." }, { status: 404 }) };
    }

    return { user };
  }

  if (action === "lookup") {
    const { user, error } = await locateUser();
    if (!user) return error!;

    const state = await fetchUserState(supabaseClient, user.id);

    return NextResponse.json({
      user,
      billing: state.billing,
      credits: state.credits,
      usage: state.usage,
    });
  }

  if (action === "grant_credits") {
    const amount = Number(payload?.credits);
    if (!Number.isFinite(amount) || amount === 0) {
      return NextResponse.json(
        { error: "Provide a non-zero numeric amount for credits." },
        { status: 400 }
      );
    }

    const { user, error } = await locateUser();
    if (!user) return error!;

    const planType = typeof payload?.planType === "string" ? payload.planType : null;
    const creditPlan = VALID_PLANS.has(planType ?? "") ? planType : null;

    const rpc = await supabaseClient.rpc("increment_credit_balance", {
      p_user_id: user.id,
      p_amount: amount,
      p_plan_type: creditPlan ?? "bundle",
    });

    if (rpc.error) {
      console.warn("increment_credit_balance RPC failed, falling back", rpc.error);
      const { data: existingBalance, error: balanceError } = await supabaseClient
        .from("credit_balances")
        .select("remaining, plan_type")
        .eq("user_id", user.id)
        .maybeSingle();

      if (balanceError) {
        console.error("Credit balance fetch failed", balanceError);
        return NextResponse.json(
          { error: "Unable to adjust credits." },
          { status: 500 }
        );
      }

      const current = existingBalance?.remaining ?? 0;
      const nextRemaining = Math.max(0, current + amount);
      const upsert = await supabaseClient.from("credit_balances").upsert({
        user_id: user.id,
        remaining: nextRemaining,
        plan_type: existingBalance?.plan_type ?? creditPlan ?? "bundle",
      });

      if (upsert.error) {
        console.error("Credit balance upsert failed", upsert.error);
        return NextResponse.json(
          { error: "Unable to adjust credits." },
          { status: 500 }
        );
      }
    }

    const state = await fetchUserState(supabaseClient, user.id);
    return NextResponse.json({
      success: true,
      user,
      billing: state.billing,
      credits: state.credits,
      usage: state.usage,
    });
  }

  if (action === "set_plan") {
    const { plan, subscriptionStatus } = payload ?? {};
    if (typeof plan !== "string" || !VALID_PLANS.has(plan)) {
      return NextResponse.json({ error: "Invalid plan type." }, { status: 400 });
    }

    const { user, error } = await locateUser();
    if (!user) return error!;

    const updates: Record<string, any> = {
      user_id: user.id,
      plan_type: plan,
    };

    if (plan === "subscription") {
      updates.subscription_status = subscriptionStatus ?? "active";
      if (supabaseClient.schema("next_auth")) {
        const { error: linkError } = await supabaseClient
          .schema("next_auth")
          .from("users")
          .upsert({ id: user.id, email: user.email, name: user.name ?? null });
        if (linkError) {
          console.error("Failed to ensure next_auth user exists", linkError);
        }
      }
    } else {
      updates.subscription_status = null;
    }

    const upsert = await supabaseClient.from("billing_profiles").upsert(updates, {
      onConflict: "user_id",
    });
    if (upsert.error) {
      console.error("Plan upsert failed", upsert.error);
      const message =
        upsert.error.code === "23503"
          ? "Foreign key constraint failed. Ensure billing tables reference next_auth.users (rerun docs/saas-schema.sql)."
          : "Unable to update plan.";
      return NextResponse.json({ error: message }, { status: 500 });
    }

    const state = await fetchUserState(supabaseClient, user.id);
    return NextResponse.json({
      success: true,
      user,
      billing: state.billing,
      credits: state.credits,
      usage: state.usage,
    });
  }

  return NextResponse.json({ error: "Unknown admin action." }, { status: 400 });
}
