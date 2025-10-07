"use client";

import { useState } from "react";

interface LookupResult {
  user: {
    id: string;
    email: string;
    name: string | null;
  };
  billing: {
    plan_type: string | null;
    subscription_status: string | null;
  } | null;
  credits: {
    remaining: number | null;
    plan_type: string | null;
  } | null;
  usage: Array<{
    id: string;
    created_at: string;
    provider: string;
    approach: string;
    credits_consumed: number;
  }>;
}

const PLAN_LABELS: Record<string, string> = {
  subscription: "Unlimited subscription",
  bundle: "Credit bundle",
  pay_per_use: "Pay per use",
  trial: "Trial",
};

export default function AdminPanel({
  initialEmail,
}: {
  initialEmail?: string;
}) {
  const [email, setEmail] = useState(initialEmail ?? "");
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [result, setResult] = useState<LookupResult | null>(null);

  const handleLookup = async () => {
    const normalized = email.trim().toLowerCase();
    if (!normalized) {
      setError("Enter an email address to look up.");
      setResult(null);
      return;
    }

    setLoading(true);
    setActionLoading(null);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "lookup", email: normalized }),
      });
      const payload = await response.json();
      if (!response.ok) {
        setError(payload?.error ?? "Failed to load user.");
        setResult(null);
      } else {
        setResult(payload as LookupResult);
      }
    } catch (err) {
      console.error("Admin lookup error", err);
      setError("Network error while loading user.");
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  const refreshState = (payload: any) => {
    if (payload?.user) {
      setResult({
        user: payload.user,
        billing: payload.billing ?? null,
        credits: payload.credits ?? null,
        usage: payload.usage ?? [],
      });
    }
  };

  const performAction = async (body: any, loadingKey: string) => {
    if (!result?.user?.email) return;
    setActionLoading(loadingKey);
    setError(null);
    setSuccess(null);
    try {
      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: result.user.email, ...body }),
      });
      const payload = await response.json();
      if (!response.ok) {
        setError(payload?.error ?? "Action failed.");
      } else {
        setSuccess(payload?.success ? "Action completed." : null);
        refreshState(payload);
      }
    } catch (err) {
      console.error("Admin action error", err);
      setError("Network error while performing action.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleGrantCredits = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const delta = Number(formData.get("credits"));
    if (!Number.isFinite(delta) || delta === 0) {
      setError("Enter a non-zero numeric amount to add or subtract credits.");
      return;
    }
    await performAction({ action: "grant_credits", credits: delta }, "grant");
    (event.target as HTMLFormElement).reset();
  };

  const handleSetPlan = async (plan: string, subscriptionStatus?: string | null) => {
    await performAction(
      {
        action: "set_plan",
        plan,
        subscriptionStatus: subscriptionStatus ?? null,
      },
      `plan-${plan}`
    );
  };

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-slate-700 bg-[#1F2025] p-6">
        <h2 className="text-lg font-semibold text-white">Find a user</h2>
        <p className="mt-1 text-sm text-slate-300">
          Look up a user by the email they use to sign in. You can then add credits
          or toggle their subscription status.
        </p>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="user@example.com"
            className="w-full rounded-md border border-slate-700 bg-[#141519] px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
          />
          <button
            type="button"
            onClick={handleLookup}
            disabled={loading}
            className="inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? "Searching…" : "Lookup"}
          </button>
        </div>
      </section>

      {error ? (
        <div className="rounded-md border border-red-500 bg-red-900/40 px-4 py-3 text-sm text-red-100">
          {error}
        </div>
      ) : null}

      {success ? (
        <div className="rounded-md border border-emerald-500 bg-emerald-900/40 px-4 py-3 text-sm text-emerald-100">
          {success}
        </div>
      ) : null}

      {result ? (
        <section className="space-y-6">
          <div className="rounded-xl border border-slate-700 bg-[#1F2025] p-6">
            <h3 className="text-base font-semibold text-white">User details</h3>
            <dl className="mt-3 grid gap-3 sm:grid-cols-2">
              <div>
                <dt className="text-xs uppercase tracking-wide text-slate-400">
                  Email
                </dt>
                <dd className="text-sm text-slate-200">{result.user.email}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-slate-400">
                  Name
                </dt>
                <dd className="text-sm text-slate-200">{result.user.name ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-slate-400">
                  Plan
                </dt>
                <dd className="text-sm text-slate-200">
                  {PLAN_LABELS[result.billing?.plan_type ?? ""] ?? "No plan"}
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-slate-400">
                  Subscription status
                </dt>
                <dd className="text-sm text-slate-200">
                  {result.billing?.subscription_status ?? "—"}
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-slate-400">
                  Remaining credits
                </dt>
                <dd className="text-sm text-slate-200">
                  {typeof result.credits?.remaining === "number"
                    ? result.credits.remaining
                    : "—"}
                </dd>
              </div>
            </dl>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-xl border border-slate-700 bg-[#1F2025] p-6 space-y-3">
              <h3 className="text-base font-semibold text-white">Adjust credits</h3>
              <p className="text-sm text-slate-300">
                Positive values add credits; negative values remove them.
              </p>
              <form onSubmit={handleGrantCredits} className="space-y-3">
                <input
                  type="number"
                  name="credits"
                  step="1"
                  placeholder="e.g. 5 or -3"
                  className="w-full rounded-md border border-slate-700 bg-[#141519] px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={actionLoading === "grant"}
                  className="inline-flex items-center justify-center rounded-md bg-slate-200 px-4 py-2 text-sm font-medium text-slate-900 hover:bg-white disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {actionLoading === "grant" ? "Updating…" : "Apply change"}
                </button>
              </form>
            </div>

            <div className="rounded-xl border border-slate-700 bg-[#1F2025] p-6 space-y-3">
              <h3 className="text-base font-semibold text-white">Plan controls</h3>
              <p className="text-sm text-slate-300">
                Switch the user's plan or toggle the unlimited subscription.
              </p>
              <div className="flex flex-col gap-2 text-sm">
                <button
                  type="button"
                  onClick={() => handleSetPlan("subscription", "active")}
                  disabled={actionLoading === "plan-subscription"}
                  className="rounded-md border border-emerald-500 px-3 py-2 text-left text-emerald-100 hover:bg-emerald-900/30 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  Activate unlimited subscription
                </button>
                <button
                  type="button"
                  onClick={() => handleSetPlan("bundle")}
                  disabled={actionLoading === "plan-bundle"}
                  className="rounded-md border border-blue-500 px-3 py-2 text-left text-blue-100 hover:bg-blue-900/30 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  Mark as credit bundle user
                </button>
                <button
                  type="button"
                  onClick={() => handleSetPlan("pay_per_use")}
                  disabled={actionLoading === "plan-pay_per_use"}
                  className="rounded-md border border-indigo-500 px-3 py-2 text-left text-indigo-100 hover:bg-indigo-900/30 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  Mark as pay-per-use user
                </button>
                <button
                  type="button"
                  onClick={() => handleSetPlan("trial")}
                  disabled={actionLoading === "plan-trial"}
                  className="rounded-md border border-slate-600 px-3 py-2 text-left text-slate-200 hover:bg-slate-800/40 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  Move to trial / no plan
                </button>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-700 bg-[#1F2025] p-6">
            <h3 className="text-base font-semibold text-white">Recent usage</h3>
            {result.usage.length > 0 ? (
              <div className="mt-3 overflow-auto">
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
                    {result.usage.map((event) => (
                      <tr key={event.id} className="bg-[#1A1B20]">
                        <td className="px-4 py-2 text-slate-200">
                          {new Date(event.created_at).toLocaleString()}
                        </td>
                        <td className="px-4 py-2 text-slate-300">{event.provider}</td>
                        <td className="px-4 py-2 text-slate-300">{event.approach}</td>
                        <td className="px-4 py-2 text-slate-300">{event.credits_consumed}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="mt-3 text-sm text-slate-400">
                No usage events recorded for this user.
              </p>
            )}
          </div>
        </section>
      ) : null}
    </div>
  );
}
