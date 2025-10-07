import Link from "next/link";
import { redirect } from "next/navigation";
import Footer from "../../components/Footer";
import Header from "../../components/Header";
import { getAuthSession } from "../../auth";
import { getSupabaseAdminClient } from "../../lib/supabaseAdmin";
import PurchaseButtons from "./PurchaseButtons";
import { copy } from "../../content/copy";

function formatDate(value: string | null | undefined) {
  if (!value) return "-";
  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
}

export default async function DashboardPage() {
  const dashboardCopy = copy.dashboard;
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
    supabaseError = dashboardCopy.supabaseError;
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

  const planNames = dashboardCopy.planNames as Record<string, string>;
  const readablePlan = planType
    ? planNames[planType] ?? planType
    : planNames.default;

  const isSubscriptionActive =
    planType === "subscription" && subscriptionStatus === "active";

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 antialiased">
      <Header />
      <main className="mx-auto w-full max-w-5xl px-4 pb-24 pt-24 sm:px-6 lg:px-8">
        <div className="space-y-12">
          <header className="space-y-3">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-300">
              {dashboardCopy.badge}
            </span>
            <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl">
              {dashboardCopy.heading}
            </h1>
            <p className="text-sm text-slate-300 sm:text-base">
              {dashboardCopy.subheading(session.user.email ?? session.user.id)}
            </p>
          </header>

          {supabaseError ? (
            <div className="rounded-3xl border border-amber-400/30 bg-amber-500/10 px-5 py-4 text-sm text-amber-200">
              {supabaseError}
            </div>
          ) : null}

          <section className="grid gap-6 lg:grid-cols-3">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-lg">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
                {dashboardCopy.planLabel}
              </h2>
              <p className="mt-3 text-lg font-medium text-white">{readablePlan}</p>
              {planType === "subscription" ? (
                <p className="mt-1 text-xs text-slate-400">
                  {dashboardCopy.planStatusLabel} {subscriptionStatus ?? dashboardCopy.subscriptionStatusUnknown}
                </p>
              ) : null}
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-lg">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
                {dashboardCopy.creditsLabel}
              </h2>
              <p className="mt-3 text-lg font-medium text-white">
                {remainingCredits ?? remainingCredits === 0
                  ? remainingCredits
                  : "—"}
              </p>
              <p className="mt-1 text-xs text-slate-400">
                {dashboardCopy.creditsDescription}
              </p>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-lg">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
                {dashboardCopy.quickActions}
              </h2>
              <div className="mt-4 space-y-3 text-sm">
                <Link
                  href="/dream"
                  className="inline-flex w-full justify-center rounded-full border border-white/15 bg-white/5 px-4 py-2 font-semibold text-white transition hover:border-white/30 hover:bg-white/10"
                >
                  {dashboardCopy.generate}
                </Link>
                <Link
                  href="/"
                  className="inline-flex w-full justify-center rounded-full border border-white/15 bg-white/5 px-4 py-2 font-semibold text-white transition hover:border-white/30 hover:bg-white/10"
                >
                  {dashboardCopy.backHome}
                </Link>
              </div>
            </div>
          </section>

          <section className="space-y-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-2xl font-semibold text-white">
                {dashboardCopy.topUpTitle}
              </h2>
              {isSubscriptionActive ? (
                <span className="inline-flex items-center rounded-full border border-emerald-400/40 bg-emerald-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-200">
                  {dashboardCopy.unlimitedBadge}
                </span>
              ) : null}
            </div>
            <PurchaseButtons isSubscriptionActive={isSubscriptionActive ?? false} />
          </section>

          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold text-white">{dashboardCopy.recentUsageTitle}</h2>
              <p className="text-xs uppercase tracking-wide text-slate-500">
                {dashboardCopy.recentUsageHint}
              </p>
            </div>
            {usageEvents && usageEvents.length > 0 ? (
              <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-lg">
                <table className="min-w-full divide-y divide-white/10 text-sm text-slate-200">
                  <thead className="bg-white/5 text-slate-300">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium uppercase tracking-wide">
                        {dashboardCopy.tableHeaders.when}
                      </th>
                      <th className="px-4 py-3 text-left font-medium uppercase tracking-wide">
                        {dashboardCopy.tableHeaders.provider}
                      </th>
                      <th className="px-4 py-3 text-left font-medium uppercase tracking-wide">
                        {dashboardCopy.tableHeaders.approach}
                      </th>
                      <th className="px-4 py-3 text-left font-medium uppercase tracking-wide">
                        {dashboardCopy.tableHeaders.credits}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {usageEvents.map((event) => (
                      <tr key={event.id} className="bg-white/[0.04]">
                        <td className="px-4 py-3 text-slate-100">
                          {formatDate(event.created_at)}
                        </td>
                        <td className="px-4 py-3 text-slate-300">
                          {event.provider}
                        </td>
                        <td className="px-4 py-3 text-slate-300">
                          {event.approach}
                        </td>
                        <td className="px-4 py-3 text-slate-300">
                          {event.credits_consumed}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm text-slate-400">
                {dashboardCopy.recentUsageEmpty}
              </p>
            )}
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
