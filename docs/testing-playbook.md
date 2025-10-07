Start from clean terminal session:

1. Ensure Python 3.12 (or compatible) is available: `python3.12 --version`.
2. Create a virtual environment at the repo root: `/opt/homebrew/bin/python3.12 -m venv .venv`.
3. Activate it for the current shell: `source .venv/bin/activate`.
4. Upgrade pip and install ControlNet dependencies: `pip install --upgrade pip && pip install -r controlnet_service/requirements.txt`.
5. (Optional) Pre-cache diffusion weights: `python controlnet_service/app.py`, interrupt with `Ctrl+C` once model downloads complete.
6. Copy the sample env vars and edit values as needed: `cp .example.env .env` then open `.env`.
7. Decide which generator to use by setting `DEFAULT_APPROACH` (`openai` is the default; switch to `controlnet` for the local pipeline) and optionally set `OPENAI_IMAGE_SEED` for consistent results when the API supports it.
8. Configure SaaS prerequisites: set `NEXTAUTH_URL`, Supabase URL/service role key, NextAuth secret, and **real Stripe price IDs** (each must start with `price_…`) plus the webhook secret. Add `ADMIN_EMAILS` with the comma-separated list of addresses that can access `/admin`. In Supabase expose the `next_auth` schema (Settings → API → Additional schemas), then run `docs/next-auth-schema.sql` followed by `docs/saas-schema.sql` so adapter and billing tables exist (columns must match the SQL exactly). If you already created the billing tables, drop them or alter the foreign keys to point at `next_auth."users"`. Ensure at least one auth provider is enabled in Supabase.
9. Install Node dependencies (venv may remain active): `npm install`.

Launch services for manual testing:

1. In a shell with the venv active, export any tuning overrides, e.g. `export CONTROL_TARGET_SIZE=768`, `export CONTROL_DEVICE=cpu`, or `export DEFAULT_APPROACH=controlnet` before launching the backend when you want the SDXL pipeline.
2. Start the ControlNet API: `npm run control:dev`.
3. Open a second terminal at the repo root (venv optional) and start the Next.js dev server: `npm run dev`.
4. Visit `http://localhost:3000` in a browser, sign in with a configured provider, and verify the dashboard shows credit/subscription status.
5. Upload a room photo, choose a style, and submit. Monitor the ControlNet terminal for request logs and ensure generations complete without errors.

Regression checks:

1. Validate negative cases (e.g. missing image upload) surface user-friendly errors.
2. Sign up with email/password, sign out, and sign back in to confirm the credentials flow (`/api/auth/email` + credentials provider).
3. Trigger multiple generations to confirm seeds, styles, and prompt values update correctly.
4. Inspect Supabase tables (`next_auth.users`, `billing_profiles`, `credit_balances`, `usage_events`) to verify users are created and credits adjust after webhook events.
5. Use `/dashboard` to start each Stripe checkout path and ensure you are redirected to Stripe with the correct price ID, then verify webhooks update Supabase.
6. Sign in with an admin email and adjust credits/subscription via `/admin`; confirm the changes reflect in `/dashboard`.
7. If using GPU, watch for MPS/CUDA OOM. Adjust `CONTROL_TARGET_SIZE` or `PYTORCH_MPS_HIGH_WATERMARK_RATIO` before retrying.
8. When satisfied, stop servers with `Ctrl+C` in each terminal.
9. For production parity, run `npm run build && npm start` and smoke test again.

Post-testing cleanup:

1. Deactivate the venv: `deactivate`.
2. Remove cached artifacts if necessary (`rm -rf .venv controlnet_service/__pycache__`).
