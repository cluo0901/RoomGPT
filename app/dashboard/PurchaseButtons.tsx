"use client";

import { useState } from "react";
import { copy } from "../../content/copy";

const purchaseCopy = copy.dashboard.purchaseButtons;
const PLAN_OPTIONS = purchaseCopy.options;

export default function PurchaseButtons({
  isSubscriptionActive,
}: {
  isSubscriptionActive: boolean;
}) {
  const [loadingKey, setLoadingKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleCheckout = async (planKey: string) => {
    setLoadingKey(planKey);
    setError(null);
    try {
      const response = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: planKey }),
      });

      const payload = await response.json();
      if (!response.ok || !payload?.url) {
        setError(payload?.error ?? purchaseCopy.error);
        setLoadingKey(null);
        return;
      }

      window.location.href = payload.url as string;
    } catch (err) {
      console.error("Checkout error", err);
      setError(purchaseCopy.networkError);
      setLoadingKey(null);
    }
  };

  return (
    <div className="space-y-4">
      {error ? (
        <div className="rounded-3xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      ) : null}
      <div className="grid gap-4 md:grid-cols-2">
        {PLAN_OPTIONS.map((option) => {
          const disabled =
            loadingKey === option.key ||
            (option.key === "subscription_unlimited" && isSubscriptionActive);
          return (
            <button
              key={option.key}
              type="button"
              onClick={() => handleCheckout(option.key)}
              disabled={disabled}
              className="rounded-3xl border border-white/10 bg-white/5 p-6 text-left shadow-lg transition hover:border-white/30 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <h3 className="text-lg font-semibold text-white">
                {option.title}
              </h3>
              <p className="mt-2 text-sm text-slate-300">{option.blurb}</p>
              <p className="mt-4 text-xs uppercase tracking-wide text-slate-500">
                {option.hint}
              </p>
              <span className="mt-5 inline-flex rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold text-slate-100">
                {loadingKey === option.key ? purchaseCopy.buttonLoading : purchaseCopy.buttonIdle}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
