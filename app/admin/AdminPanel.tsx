"use client";

import { useState } from "react";
import { copy } from "../../content/copy";

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

const adminCopy = copy.admin;
const PLAN_LABELS: Record<string, string> = adminCopy.planLabels;

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
      setError(adminCopy.lookup.emptyEmail);
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
        setError(payload?.error ?? adminCopy.lookup.errorLookup);
        setResult(null);
      } else {
        setResult(payload as LookupResult);
      }
    } catch (err) {
      console.error("Admin lookup error", err);
      setError(adminCopy.lookup.errorNetwork);
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
        setError(payload?.error ?? adminCopy.alerts.error);
      } else {
        setSuccess(payload?.success ? adminCopy.alerts.success : null);
        refreshState(payload);
      }
    } catch (err) {
      console.error("Admin action error", err);
      setError(adminCopy.alerts.actionNetwork);
    } finally {
      setActionLoading(null);
    }
  };

  const handleGrantCredits = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const delta = Number(formData.get("credits"));
    if (!Number.isFinite(delta) || delta === 0) {
      setError(adminCopy.alerts.creditInput);
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
      <section className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-lg">
        <h2 className="text-lg font-semibold text-white">{adminCopy.lookup.heading}</h2>
        <p className="mt-1 text-sm text-slate-300">
          {adminCopy.lookup.description}
        </p>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder={adminCopy.lookup.placeholder}
            className="w-full rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-emerald-400 focus:outline-none"
          />
          <button
            type="button"
            onClick={handleLookup}
            disabled={loading}
            className="inline-flex items-center justify-center rounded-full bg-emerald-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? `${adminCopy.lookup.button}…` : adminCopy.lookup.button}
          </button>
        </div>
      </section>

      {error ? (
        <div className="rounded-3xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      ) : null}

      {success ? (
        <div className="rounded-3xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
          {success}
        </div>
      ) : null}

      {result ? (
        <section className="space-y-6">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-lg">
            <h3 className="text-base font-semibold text-white">{adminCopy.userDetails.heading}</h3>
            <dl className="mt-3 grid gap-3 sm:grid-cols-2">
              <div>
                <dt className="text-xs uppercase tracking-wide text-slate-400">
                  {adminCopy.userDetails.email}
                </dt>
                <dd className="text-sm text-slate-200">{result.user.email}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-slate-400">
                  {adminCopy.userDetails.name}
                </dt>
                <dd className="text-sm text-slate-200">{result.user.name ?? adminCopy.userDetails.none}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-slate-400">
                  {adminCopy.userDetails.plan}
                </dt>
                <dd className="text-sm text-slate-200">
                  {PLAN_LABELS[result.billing?.plan_type ?? ""] ?? adminCopy.userDetails.noPlan}
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-slate-400">
                  {adminCopy.userDetails.subscriptionStatus}
                </dt>
                <dd className="text-sm text-slate-200">
                  {result.billing?.subscription_status ?? adminCopy.userDetails.none}
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-slate-400">
                  {adminCopy.userDetails.remainingCredits}
                </dt>
                <dd className="text-sm text-slate-200">
                  {typeof result.credits?.remaining === "number"
                    ? result.credits.remaining
                    : adminCopy.userDetails.none}
                </dd>
              </div>
            </dl>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-3 rounded-3xl border border-white/10 bg-white/5 p-6 shadow-lg">
              <h3 className="text-base font-semibold text-white">{adminCopy.credits.heading}</h3>
              <p className="text-sm text-slate-300">
                {adminCopy.credits.description}
              </p>
              <form onSubmit={handleGrantCredits} className="space-y-3">
                <input
                  type="number"
                  name="credits"
                  step="1"
                  placeholder={adminCopy.credits.placeholder}
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-emerald-400 focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={actionLoading === "grant"}
                  className="inline-flex items-center justify-center rounded-full bg-emerald-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {actionLoading === "grant" ? adminCopy.credits.buttonPending : adminCopy.credits.button}
                </button>
              </form>
            </div>

            <div className="space-y-3 rounded-3xl border border-white/10 bg-white/5 p-6 shadow-lg">
              <h3 className="text-base font-semibold text-white">{adminCopy.planControls.heading}</h3>
              <p className="text-sm text-slate-300">
                {adminCopy.planControls.description}
              </p>
              <div className="flex flex-col gap-2 text-sm text-slate-200">
                <button
                  type="button"
                  onClick={() => handleSetPlan("subscription", "active")}
                  disabled={actionLoading === "plan-subscription"}
                  className="rounded-2xl border border-emerald-400/40 px-3 py-2 text-left text-emerald-200 transition hover:bg-emerald-500/10 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {adminCopy.planControls.subscription}
                </button>
                <button
                  type="button"
                  onClick={() => handleSetPlan("bundle")}
                  disabled={actionLoading === "plan-bundle"}
                  className="rounded-2xl border border-blue-400/40 px-3 py-2 text-left text-blue-200 transition hover:bg-blue-500/10 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {adminCopy.planControls.bundle}
                </button>
                <button
                  type="button"
                  onClick={() => handleSetPlan("pay_per_use")}
                  disabled={actionLoading === "plan-pay_per_use"}
                  className="rounded-2xl border border-indigo-400/40 px-3 py-2 text-left text-indigo-200 transition hover:bg-indigo-500/10 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {adminCopy.planControls.payPerUse}
                </button>
                <button
                  type="button"
                  onClick={() => handleSetPlan("trial")}
                  disabled={actionLoading === "plan-trial"}
                  className="rounded-2xl border border-white/15 px-3 py-2 text-left text-slate-200 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {adminCopy.planControls.trial}
                </button>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-lg">
            <h3 className="text-base font-semibold text-white">{adminCopy.usage.heading}</h3>
            {result.usage.length > 0 ? (
              <div className="mt-3 overflow-auto">
                <table className="min-w-full divide-y divide-white/10 text-sm text-slate-200">
                  <thead className="bg-white/5 text-slate-300">
                    <tr>
                      <th className="px-4 py-2 text-left font-medium">{adminCopy.usage.when}</th>
                      <th className="px-4 py-2 text-left font-medium">{adminCopy.usage.provider}</th>
                      <th className="px-4 py-2 text-left font-medium">{adminCopy.usage.approach}</th>
                      <th className="px-4 py-2 text-left font-medium">{adminCopy.usage.credits}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {result.usage.map((event) => (
                      <tr key={event.id} className="bg-white/[0.04]">
                        <td className="px-4 py-2 text-slate-100">
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
                {adminCopy.usage.empty}
              </p>
            )}
          </div>
        </section>
      ) : null}
    </div>
  );
}
