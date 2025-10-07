# Project Progress Log

## 2025-10-05
- Documented full local setup, testing playbook, and server start/stop procedures.
- Installed ControlNet dependencies (Python 3.12) and resolved `tokenizers` build issue by recreating the venv with Python 3.12.
- Addressed MPS memory exhaustion guidance (resolution overrides, waterline adjustments, CPU fallback).
- Updated deployment pipeline: committed dependency refresh and pushed branch `feature/sdxl-controlnet` to GitHub.
- Added `docs/testing-playbook.md` detailing validation workflows and cleanup steps.
- Implemented configurable `DEFAULT_APPROACH` toggle so OpenAI generation is now the default with optional ControlNet fallback.
- Updated `.example.env`, `README.md`, and testing docs to explain the new toggle and environment expectations.
- Switched OpenAI flow to the Images Edits API, downloading the base photo, enforcing "do not change" guidance, and adding a best-effort deterministic seed option with graceful fallback when unsupported.
- Added SaaS scaffolding: NextAuth + Supabase adapter, Stripe checkout/webhook handlers, billing gatekeeper logic, and updated docs/environment templates.
- Implemented email/password auth (credentials provider + bcrypt hashing) with sign-up API, refreshed sign-in UI, and documented the `password_hash` column.
- Built `/dashboard` to surface plan status, credit balance, recent usage, and launch Stripe checkouts for bundles or subscriptions.
- Hardened Stripe checkout route with explicit `price_` validation and JSON error responses to guide ENV configuration.
