import { headers } from "next/headers";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getStripeClient } from "../../../../lib/stripe";
import { getSupabaseAdminClient } from "../../../../lib/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BUNDLE_CREDIT_MAP: Record<string, number> = {
  pay_per_use: 1,
  bundle_10: 10,
  bundle_25: 25,
};

export async function POST(request: Request) {
  const stripe = getStripeClient();
  const signature = (await headers()).get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!signature || !webhookSecret) {
    return NextResponse.json({ error: "Webhook misconfigured" }, { status: 400 });
  }

  const payload = await request.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  } catch (error: any) {
    console.error("Stripe webhook signature verification failed", error?.message);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed":
      await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
      break;
    case "invoice.paid":
      await handleInvoicePaid(event.data.object as Stripe.Invoice);
      break;
    case "customer.subscription.deleted":
    case "customer.subscription.updated":
      await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
      break;
    default:
      break;
  }

  return NextResponse.json({ received: true });
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const supabase = getSupabaseAdminClient();
  if (!supabase) return;

  const plan = session.metadata?.plan;
  const userId = session.metadata?.userId;

  if (!plan || !userId) {
    console.warn("Checkout session missing metadata", session.id);
    return;
  }

  if (plan === "subscription_unlimited") {
    await supabase
      .from("billing_profiles")
      .upsert({
        user_id: userId,
        plan_type: "subscription",
        subscription_status: "active",
        stripe_customer_id: session.customer as string,
        stripe_subscription_id: session.subscription as string,
      });
    return;
  }

  const creditsToAdd = BUNDLE_CREDIT_MAP[plan];
  if (!creditsToAdd) {
    console.warn("Unknown bundle plan", plan);
    return;
  }

  const { error } = await supabase.rpc("increment_credit_balance", {
    p_user_id: userId,
    p_amount: creditsToAdd,
    p_plan_type: plan === "pay_per_use" ? "pay_per_use" : "bundle",
  });

  if (error) {
    console.warn("increment_credit_balance RPC missing, falling back to upsert", error.message);
    await supabase
      .from("credit_balances")
      .upsert({
        user_id: userId,
        remaining: creditsToAdd,
        plan_type: plan === "pay_per_use" ? "pay_per_use" : "bundle",
      }, { onConflict: "user_id" });
  }
}

async function handleInvoicePaid(invoice: Stripe.Invoice) {
  const supabase = getSupabaseAdminClient();
  if (!supabase) return;

  const subscriptionField = (invoice as Stripe.Invoice & {
    subscription?: string | Stripe.Subscription | null;
  }).subscription;
  const subscriptionId =
    typeof subscriptionField === "string"
      ? subscriptionField
      : subscriptionField?.id;
  if (!subscriptionId) return;

  await supabase
    .from("billing_profiles")
    .update({ subscription_status: "active" })
    .eq("stripe_subscription_id", subscriptionId);
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const supabase = getSupabaseAdminClient();
  if (!supabase) return;

  const status = subscription.status;

  await supabase
    .from("billing_profiles")
    .update({ subscription_status: status })
    .eq("stripe_subscription_id", subscription.id);
}
