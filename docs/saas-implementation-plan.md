# SaaS Implementation Plan

## Objectives
1. Require authentication for generation workflows so usage can be tied to customers.
2. Introduce three monetisation paths:
   - **Pay per use:** charge per generation with optional free trial credits.
   - **Prepaid bundles:** allow customers to purchase a fixed allotment of generations that decrement per request.
   - **Unlimited subscription:** recurring monthly plan with fair-use guardrails.
3. Maintain operational visibility (usage metrics, billing events, failure alerts) and admin controls.

## Phase 0 – Foundations (1-2 days)
- Audit current API routes (`/generate`) to understand touch points for auth and metering.
- Set up environment secrets placeholders for auth provider keys and billing (e.g. `NEXTAUTH_SECRET`, `STRIPE_SECRET_KEY`).
- Introduce feature flags to keep billing paths dark until QA is complete.

## Phase 1 – Authentication & User Model (3-4 days)
- Adopt **NextAuth.js** (Auth.js) with OAuth email providers (Google, GitHub) and magic link email fallback.
- Extend backend with a persistent user store (e.g. Supabase/Postgres or Prisma + PlanetScale). Define entities:
  - `User`: auth identity, profile metadata, onboarding flags.
  - `UsageLedger`: per-generation log (user, request id, tokens consumed, timestamp, charge ref).
  - `CreditBalance`: current prepaid credits (nullable).
- Wrap `/generate` route with session guard; redirect unauthenticated users to sign-in page.
- Update frontend (header, CTA) with sign-in/out flows and gating UI states.

## Phase 2 – Billing Integration (5-6 days)
- Integrate **Stripe**:
  - Products: `pay_per_use`, `bundle_10`, `bundle_25`, `subscription_unlimited`.
  - Prices: set live/test keys; support multiple currencies later.
- Build checkout handler route (`/api/billing/checkout`) to create Stripe Checkout Sessions based on plan selection.
- Implement Stripe webhooks for payment succeeded/failed events to update local state (credit balance, subscription status).
- For pay-per-use, leverage Stripe Payment Links or on-demand charges via Payment Intents; record invoice references.

## Phase 3 – Usage Enforcement (4-5 days)
- Update `/generate` to:
  - Deduct one credit for prepaid tiers.
  - For pay-per-use, create a pending charge before generation; confirm post-success.
  - For subscriptions, verify active status; enforce soft limits (e.g. 200 generations/month) with warnings.
- Add optimistic UI messaging (remaining credits, next billing date) to the dashboard.
- Handle failure cases gracefully (insufficient credits, payment errors).

## Phase 4 – Customer Dashboard & Admin Tools (4 days)
- Authenticated dashboard (`/dashboard`):
  - Usage summary (credits remaining, last 10 generations with thumbnails).
  - Billing management (update payment method, cancel subscription, one-click top-up).
- Admin panel (role-based): modify credits, refund actions, view logs.
- Integrate analytics (e.g. PostHog or Vercel Analytics) for key metrics.

## Phase 5 – QA, Security, Launch Readiness (3 days)
- Write integration tests for auth, billing webhooks, and generation gating.
- Add monitoring/alerts (Stripe webhook failure notifications, error reporting via Sentry/Logtail).
- Update documentation (`README`, `docs/testing-playbook.md`) with SaaS workflows and pricing configuration.
- Plan incremental rollout (internal testing → beta → production toggle).

## Risks & Mitigations
- **Webhook reliability:** implement idempotent handlers and retry logic.
- **Credit race conditions:** wrap deductions in transactions or use stored procedures.
- **Cost overrun:** add rate limiting and guard rails for unlimited plan.
- **Regulatory compliance:** ensure terms of service, privacy policy, and VAT collection for EU customers.

## Success Criteria
- Authenticated sessions required for generation.
- Stripe dashboard reflects purchases and subscriptions.
- Users can upgrade/downgrade plans self-serve.
- Usage ledger matches Stripe revenue within acceptable tolerance (<1%).
