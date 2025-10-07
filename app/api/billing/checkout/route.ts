import { NextResponse } from "next/server";
import { getAuthSession } from "../../../../auth";
import { getStripeClient } from "../../../../lib/stripe";
import { getSupabaseAdminClient } from "../../../../lib/supabaseAdmin";
import Stripe from "stripe";

const PRICE_LOOKUP: Record<string, { priceId?: string | null; mode: "payment" | "subscription"; credits?: number | null }> = {
  pay_per_use: {
    priceId: process.env.STRIPE_PRICE_PAY_PER_USE,
    mode: "payment",
    credits: 1,
  },
  bundle_10: {
    priceId: process.env.STRIPE_PRICE_BUNDLE_10,
    mode: "payment",
    credits: 10,
  },
  bundle_25: {
    priceId: process.env.STRIPE_PRICE_BUNDLE_25,
    mode: "payment",
    credits: 25,
  },
  subscription_unlimited: {
    priceId: process.env.STRIPE_PRICE_SUBSCRIPTION_UNLIMITED,
    mode: "subscription",
  },
};

const DEFAULT_SUCCESS_URL = process.env.STRIPE_SUCCESS_URL ?? `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/billing/success`;
const DEFAULT_CANCEL_URL = process.env.STRIPE_CANCEL_URL ?? `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/billing/cancel`;

export async function POST(request: Request) {
  const session = await getAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let payload: { plan: string };
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const planConfig = PRICE_LOOKUP[payload.plan];
  if (!planConfig?.priceId) {
    return NextResponse.json({ error: "Unknown billing plan configuration" }, { status: 400 });
  }

  const priceId = planConfig.priceId.trim();
  if (!priceId || !priceId.startsWith("price_")) {
    return NextResponse.json(
      {
        error:
          "Stripe price ID is not configured correctly. Set STRIPE_PRICE_* environment variables to the actual price IDs (e.g. price_xxx).",
      },
      { status: 400 }
    );
  }

  const stripe = getStripeClient();

  try {
    const customer = await ensureStripeCustomer(
      session.user.id,
      session.user.email ?? undefined
    );

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: planConfig.mode,
      success_url: DEFAULT_SUCCESS_URL,
      cancel_url: DEFAULT_CANCEL_URL,
      metadata: {
        userId: session.user.id,
        plan: payload.plan,
      },
    };

    if (customer) {
      sessionParams.customer = customer;
    }

    const checkoutSession = await stripe.checkout.sessions.create(sessionParams);

    const supabase = getSupabaseAdminClient();
    if (supabase) {
      await supabase.from("billing_checkout_sessions").insert({
        user_id: session.user.id,
        session_id: checkoutSession.id,
        plan_key: payload.plan,
      });
    }

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error: any) {
    console.error("Stripe checkout error", error);
    const message =
      typeof error?.message === "string"
        ? error.message
        : "Unable to start Stripe checkout.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

async function ensureStripeCustomer(userId: string, email?: string) {
  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return undefined;
  }

  const { data } = await supabase
    .from("billing_profiles")
    .select("stripe_customer_id")
    .eq("user_id", userId)
    .maybeSingle();

  const stripe = getStripeClient();

  if (data?.stripe_customer_id) {
    return data.stripe_customer_id;
  }

  const customer = await stripe.customers.create({
    email,
    metadata: { userId },
  });

  await supabase.from("billing_profiles").upsert({
    user_id: userId,
    stripe_customer_id: customer.id,
    plan_type: "trial",
  });

  return customer.id;
}
