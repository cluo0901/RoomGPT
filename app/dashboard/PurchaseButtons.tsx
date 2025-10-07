"use client";

import { useState } from "react";

const PLAN_OPTIONS: Array<{
  key: "pay_per_use" | "bundle_10" | "bundle_25" | "subscription_unlimited";
  title: string;
  blurb: string;
  priceHint: string;
}> = [
  {
    key: "pay_per_use",
    title: "Single generation",
    blurb: "Perfect for one-off redesigns. Pay only when you generate.",
    priceHint: "Charged per request",
  },
  {
    key: "bundle_10",
    title: "10-credit bundle",
    blurb: "Buy 10 generations upfront at a discounted rate.",
    priceHint: "One-time bundle",
  },
  {
    key: "bundle_25",
    title: "25-credit bundle",
    blurb: "Bulk credits for power users and teams.",
    priceHint: "Best value bundle",
  },
  {
    key: "subscription_unlimited",
    title: "Unlimited monthly",
    blurb: "Unlimited generations with fair-use protections. Billed monthly.",
    priceHint: "Recurring subscription",
  },
];

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
        setError(payload?.error ?? "Unable to start checkout. Try again.");
        setLoadingKey(null);
        return;
      }

      window.location.href = payload.url as string;
    } catch (err) {
      console.error("Checkout error", err);
      setError("Network error. Please try again.");
      setLoadingKey(null);
    }
  };

  return (
    <div className="space-y-4">
      {error ? (
        <div className="rounded-md border border-red-500 bg-red-900/30 px-4 py-3 text-sm text-red-100">
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
              className="rounded-xl border border-slate-700 bg-[#1F2025] p-5 text-left transition hover:border-blue-500 disabled:cursor-not-allowed disabled:opacity-70"
            >
              <h3 className="text-base font-semibold text-slate-100">
                {option.title}
              </h3>
              <p className="mt-2 text-sm text-slate-300">{option.blurb}</p>
              <p className="mt-3 text-xs uppercase tracking-wide text-slate-500">
                {option.priceHint}
              </p>
              <span className="mt-4 inline-flex rounded-md border border-blue-500 px-3 py-1 text-xs font-medium text-blue-200">
                {loadingKey === option.key ? "Redirecting..." : "Checkout"}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
