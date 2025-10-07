import { getSupabaseAdminClient } from "../supabaseAdmin";

type PlanType = "pay_per_use" | "bundle" | "subscription" | "trial";

export type BillingCheckResult = {
  allowed: boolean;
  plan: PlanType | "dev";
  remainingCredits?: number | null;
  reason?: string;
};

const CREDIT_DEDUCTION = 1;

export async function assertCanGenerate(
  userId: string
): Promise<BillingCheckResult> {
  const client = getSupabaseAdminClient();
  if (!client) {
    return {
      allowed: true,
      plan: "dev",
    };
  }

  const { data: profile, error: profileError } = await client
    .from("billing_profiles")
    .select("plan_type, subscription_status, stripe_customer_id, stripe_subscription_id")
    .eq("user_id", userId)
    .maybeSingle();

  if (profileError) {
    console.error("Failed to fetch billing profile", profileError);
  }

  if (!profile) {
    return {
      allowed: false,
      plan: "trial",
      reason: "No active plan. Purchase credits or subscribe to continue.",
    };
  }

  if (profile.plan_type === "subscription") {
    if (profile.subscription_status === "active") {
      return { allowed: true, plan: "subscription", remainingCredits: null };
    }
    return {
      allowed: false,
      plan: "subscription",
      reason: "Subscription inactive. Update payment method to continue.",
    };
  }

  const { data: creditRecord, error: creditError } = await client
    .from("credit_balances")
    .select("remaining, plan_type")
    .eq("user_id", userId)
    .maybeSingle();

  if (creditError) {
    console.error("Failed to fetch credit balance", creditError);
  }

  const remaining = creditRecord?.remaining ?? 0;
  if (remaining < CREDIT_DEDUCTION) {
    return {
      allowed: false,
      plan: creditRecord?.plan_type ?? profile.plan_type,
      remainingCredits: remaining,
      reason: "You are out of credits. Purchase a new bundle to continue.",
    };
  }

  return {
    allowed: true,
    plan: creditRecord?.plan_type ?? profile.plan_type,
    remainingCredits: remaining,
  };
}

export async function recordGenerationUsage({
  userId,
  plan,
  approach,
  provider,
  seed,
}: {
  userId: string;
  plan: PlanType | "dev";
  approach: string;
  provider: string;
  seed?: number | null;
}): Promise<void> {
  const client = getSupabaseAdminClient();
  if (!client) {
    return;
  }

  try {
    await client.from("usage_events").insert({
      user_id: userId,
      plan_type: plan === "dev" ? null : plan,
      provider,
      approach,
      credits_consumed: CREDIT_DEDUCTION,
      seed,
    });
  } catch (error) {
    console.error("Failed to write usage event", error);
  }

  if (plan === "bundle" || plan === "pay_per_use") {
    const { data } = await client
      .from("credit_balances")
      .select("remaining")
      .eq("user_id", userId)
      .maybeSingle();

    const remaining = data?.remaining ?? 0;
    const nextRemaining = Math.max(0, remaining - CREDIT_DEDUCTION);

    try {
      await client
        .from("credit_balances")
        .upsert({ user_id: userId, remaining: nextRemaining, plan_type: plan });
    } catch (error) {
      console.error("Failed to update credit balance", error);
    }
  }
}
