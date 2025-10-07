import Link from "next/link";
import { redirect } from "next/navigation";
import { getAuthSession } from "../../auth";
import { getSupabaseAdminClient } from "../../lib/supabaseAdmin";
import PurchaseButtons from "./PurchaseButtons";

function formatDate(value: string | null | undefined) {
  if (!value) return "-";
  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
}

export default async function DashboardPage() {
  const session = await getAuthSession();
  if (!session?.user?.id) {
    redirect(`/auth/signin?callbackUrl=${encodeURIComponent("/dashboard")}`);
  }

  const supabase = getSupabaseAdminClient();

  let planType: string | null = null;
  let subscriptionStatus: string | null = null;
  let remainingCredits: number | null = null;
  let usageEvents:
    | Array<{
        id: string;
        created_at: string;
        provider: string;
        approach: string;
        credits_consumed: number;
      }>
    | null = null;
  let supabaseError: string | null = null;

  if (!supabase) {
    supabaseError =
      "Supabase credentials are not configured. Billing data will not be displayed.";
  } else {
    const profilePromise = supabase
      .from("billing_profiles")
      .select("plan_type, subscription_status")
      .eq("user_id", session.user.id)
      .maybeSingle();
    const creditPromise = supabase
      .from("credit_balances")
      .select("remaining, plan_type")
      .eq("user_id", session.user.id)
      .maybeSingle();
    const usagePromise = supabase
      .from("usage_events")
      .select("id, created_at, provider, approach, credits_consumed")
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: false })
      .limit(5);

    const [profileResult, creditResult, usageResult] = await Promise.all([
      profilePromise,
      creditPromise,
      usagePromise,
    ]);

    if (profileResult.error) {
      console.error("Billing profile fetch error", profileResult.error);
    } else if (profileResult.data) {
      planType = profileResult.data.plan_type;
      subscriptionStatus = profileResult.data.subscription_status;
    }

    if (creditResult.error) {
      console.error("Credit balance fetch error", creditResult.error);
    } else if (creditResult.data) {
      remainingCredits = creditResult.data.remaining;
      if (!planType) {
        planType = creditResult.data.plan_type;
      }
    }

    if (usageResult.error) {
      console.error("Usage events fetch error", usageResult.error);
    } else {
      usageEvents = usageResult.data ?? [];
    }
  }

  const readablePlan = planType
    ? planType === "subscription"
      ? "Unlimited subscription"
      : planType === "bundle"
      ? "Credit bundle"
      : planType === "pay_per_use"
      ? "Pay per use"
      : planType
    : "No active plan";

  const isSubscriptionActive =
    planType === "subscription" && subscriptionStatus === "active";

  return (
    <div className="min-h-screen bg-[#17181C] text-white">
      <div className="mx-auto w-full max-w-5xl px-6 py-12 space-y-12">
        <header className="space-y-2">
          <h1 className="text-3xl font-semibold">Account dashboard</h1>
          <p className="text-sm text-slate-300">
            Signed in as {session.user.email ?? session.user.id}
          </p>
        </header>

        {supabaseError ? (
          <div className="rounded-md border border-yellow-500 bg-yellow-900/30 px-4 py-3 text-sm text-yellow-100">
            {supabaseError}
          </div>
        ) : null}

        <section className="grid gap-6 md:grid-cols-3">
          <div className="rounded-xl border border-slate-700 bg-[#1F2025] p-5">
            <h2 className="text-sm font-semibold text-slate-300">Plan</h2>
            <p className="mt-2 text-lg font-medium">{readablePlan}</p>
            {planType === "subscription" ? (
              <p className="mt-1 text-xs text-slate-400">
                Status: {subscriptionStatus ?? "unknown"}
              </p>
            ) : null}
          </div>

          <div className="rounded-xl border border-slate-700 bg-[#1F2025] p-5">
            <h2 className="text-sm font-semibold text-slate-300">Credits</h2>
            <p className="mt-2 text-lg font-medium">
              {remainingCredits ?? remainingCredits === 0
                ? remainingCredits
                : "—"}
            </p>
            <p className="mt-1 text-xs text-slate-400">
              Bundles and pay-per-use deduct one credit per generation.
            </p>
          </div>

          <div className="rounded-xl border border-slate-700 bg-[#1F2025] p-5">
            <h2 className="text-sm font-semibold text-slate-300">Quick actions</h2>
            <div className="mt-3 space-y-2 text-sm">
              <Link
                href="/dream"
                className="inline-flex w-full justify-center rounded-md border border-slate-600 px-3 py-2 text-sm font-medium text-slate-200 hover:bg-slate-700"
              >
                Generate a room
              </Link>
              <Link
                href="/"
                className="inline-flex w-full justify-center rounded-md border border-slate-600 px-3 py-2 text-sm font-medium text-slate-200 hover:bg-slate-700"
              >
                Back to home
              </Link>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Top up your account</h2>
            {isSubscriptionActive ? (
              <span className="text-xs text-emerald-300">
                Unlimited subscription active
              </span>
            ) : null}
          </div>
          <PurchaseButtons isSubscriptionActive={isSubscriptionActive ?? false} />
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Recent usage</h2>
          {usageEvents && usageEvents.length > 0 ? (
            <div className="overflow-hidden rounded-xl border border-slate-700">
              <table className="min-w-full divide-y divide-slate-700 text-sm">
                <thead className="bg-slate-900/40 text-slate-300">
                  <tr>
                    <th className="px-4 py-2 text-left font-medium">When</th>
                    <th className="px-4 py-2 text-left font-medium">Provider</th>
                    <th className="px-4 py-2 text-left font-medium">Approach</th>
                    <th className="px-4 py-2 text-left font-medium">Credits</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {usageEvents.map((event) => (
                    <tr key={event.id} className="bg-[#1A1B20]">
                      <td className="px-4 py-2 text-slate-200">
                        {formatDate(event.created_at)}
                      </td>
                      <td className="px-4 py-2 text-slate-300">
                        {event.provider}
                      </td>
                      <td className="px-4 py-2 text-slate-300">
                        {event.approach}
                      </td>
                      <td className="px-4 py-2 text-slate-300">
                        {event.credits_consumed}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-slate-400">
              Generate your first room to see usage history here.
            </p>
          )}
        </section>
      </div>
    </div>
  );
}
