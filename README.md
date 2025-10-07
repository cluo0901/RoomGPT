# [RoomGPT](https://roomGPT.io) - redesign your room with AI

This is the previous and open source version of RoomGPT.io (a paid SaaS product). It's the very first version of roomGPT without the auth, payments, or additional features and it's simple to clone, deploy, and play around with.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/Nutlope/roomGPT&env=REPLICATE_API_KEY&project-name=room-GPT&repo-name=roomGPT)

[![Room GPT](./public/screenshot.png)](https://roomGPT.io)

## How it works

This branch pairs the Next.js web app with a standalone SDXL + ControlNet service. The frontend collects your room photo, builds a structured prompt (general + room + style), and calls the local FastAPI microservice. The service runs Stable Diffusion XL with a Canny ControlNet to keep the room layout while restyling. [Bytescale](https://www.bytescale.com/) is used for image storage.

## Running Locally

### Cloning the repository the local machine.

```bash
git clone https://github.com/Nutlope/roomGPT
```

### Setting up the ControlNet service

1. Create a Python virtual environment:

   ```bash
   python -m venv .venv
   source .venv/bin/activate
   pip install --upgrade pip
   pip install -r controlnet_service/requirements.txt
   ```

2. (Optional) Pre-download model weights so the first request is faster:

   ```bash
   python controlnet_service/app.py  # first run triggers model downloads
   ^C after you see the models cached
   ```

3. Launch the service (default port 8000):

   ```bash
   uvicorn controlnet_service.app:app --host 0.0.0.0 --port 8000
   ```

The service expects a CUDA GPU (≥12 GB VRAM recommended). It falls back to CPU/MPS, but generations will be slow.

### Storing the API keys in .env

Create a file in the project root (see `.example.env`) and store your configuration. The `DEFAULT_APPROACH` flag lets you choose between the hosted OpenAI edits flow (anchors to your uploaded photo) and the local ControlNet pipeline.

```
DEFAULT_APPROACH=openai
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret
ADMIN_EMAILS=admin@example.com
SUPABASE_URL=https://your-supabase-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=service-role-key
GITHUB_ID=optional
GITHUB_SECRET=optional
GOOGLE_CLIENT_ID=optional
GOOGLE_CLIENT_SECRET=optional
EMAIL_SERVER=optional
EMAIL_FROM=optional
CONTROL_SERVICE_URL=http://localhost:8000
CONTROL_SERVICE_ENDPOINT=/generate
CONTROL_SERVICE_TOKEN=optional-token
CONTROL_DEFAULT_NEGATIVE_PROMPT=low quality, blurry, distorted, extra furniture, warped walls, overexposed
CONTROL_DEFAULT_STRENGTH=0.35
CONTROL_DEFAULT_GUIDANCE=6
CONTROL_DEFAULT_INFERENCE_STEPS=30
CONTROL_CANNY_CONDITIONING_SCALE=0.75
CONTROL_CANNY_LOW_THRESHOLD=100
CONTROL_CANNY_HIGH_THRESHOLD=200

NEXT_PUBLIC_UPLOAD_API_KEY=optional-bytescale-key

# Optional OpenAI keys (required when DEFAULT_APPROACH=openai)
OPENAI_API_KEY=
OPENAI_IMAGE_MODEL=gpt-image-1
OPENAI_IMAGE_SEED=1337

STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxx
STRIPE_PRICE_PAY_PER_USE=price_xxx   # use the real Stripe price id, e.g. price_123
STRIPE_PRICE_BUNDLE_10=price_xxx
STRIPE_PRICE_BUNDLE_25=price_xxx
STRIPE_PRICE_SUBSCRIPTION_UNLIMITED=price_xxx
STRIPE_SUCCESS_URL=http://localhost:3000/billing/success
STRIPE_CANCEL_URL=http://localhost:3000/billing/cancel
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

You can keep `OPENAI_API_KEY`/`OPENAI_IMAGE_MODEL` values if you plan to provide an OpenAI fallback, but they are not required for the ControlNet flow.

Set `DEFAULT_APPROACH=controlnet` when you're ready to use the local SDXL ControlNet service instead. The OpenAI approach uses the Images Edits endpoint, so it re-draws over your actual room photo; `OPENAI_IMAGE_SEED` is a best-effort knob (ignored if the API doesn't yet support it) to encourage repeatable results.

### Authentication, credits, and billing

1. Create a Supabase project, enable at least one auth provider (Google, Apple, etc.), expose the `next_auth` schema under **Settings → API → Additional schemas**, then run the SQL in `docs/next-auth-schema.sql` followed by `docs/saas-schema.sql` to bootstrap the adapter tables (including the `password_hash` column for email login), billing tables, and helper functions. If you created the billing tables before this update, drop them or run the `ALTER TABLE` statements in `docs/saas-schema.sql` so all foreign keys reference `next_auth."users"` rather than `auth.users`.
2. Populate the Stripe products for pay-per-use, bundles, and subscription tiers. Record their price IDs in your environment configuration.
3. Expose the Stripe webhook endpoint (e.g. `/api/billing/webhook`) and point Stripe's dashboard to it. Use `stripe listen --forward-to localhost:3000/api/billing/webhook` during local development.
4. After configuring env vars, restart the dev server. Users can sign up with email + password or social login, visit `/dashboard` to monitor credits, and the app enforces plan limits before generation.

If you'd also like to do rate limiting, create an account on UpStash, create a Redis database, and populate the two environment variables in `.env` as well. If you don't want to do rate limiting, you don't need to make any changes.

### Dashboard

- Authenticated users can visit `/dashboard` to see their current plan, remaining credits, recent usage, and launch a Stripe Checkout session for bundles or the unlimited subscription.
- The front-end calls `/api/billing/checkout`, so make sure your Stripe keys and price IDs are present in the environment.

### Admin Portal

- Set `ADMIN_EMAILS` to a comma-separated list of accounts allowed to manage plans.
- Admins can visit `/admin` to look up users, add or subtract credits, or toggle the unlimited subscription flag.
- All admin API actions still flow through Supabase and Stripe, so webhooks and billing tables remain the single source of truth.

### Installing the dependencies.

```bash
npm install
```

### Running the application.

Start the ControlNet service (in a separate terminal) and the Next.js dev server:

```bash
npm run control:dev   # starts the SDXL ControlNet API (requires Python env)
npm run dev           # starts the Next.js frontend
```

## One-Click Deploy

Deploy the example using [Vercel](https://vercel.com?utm_source=github&utm_medium=readme&utm_campaign=vercel-examples):

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/Nutlope/roomGPT&env=REPLICATE_API_KEY&project-name=room-GPT&repo-name=roomGPT)

## License

This repo is MIT licensed.
