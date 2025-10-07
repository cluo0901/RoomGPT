-- Users are stored via Supabase Auth (managed by Supabase Adapter).

create table if not exists public.billing_profiles (
  user_id uuid primary key references next_auth."users"("id") on delete cascade,
  plan_type text not null default 'trial',
  subscription_status text,
  stripe_customer_id text,
  stripe_subscription_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.credit_balances (
  user_id uuid primary key references next_auth."users"("id") on delete cascade,
  plan_type text not null default 'bundle',
  remaining integer not null default 0,
  updated_at timestamptz not null default now()
);

create table if not exists public.usage_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references next_auth."users"("id") on delete cascade,
  plan_type text,
  provider text not null,
  approach text not null,
  credits_consumed integer not null,
  seed bigint,
  created_at timestamptz not null default now()
);

create table if not exists public.billing_checkout_sessions (
  session_id text primary key,
  user_id uuid not null references next_auth."users"("id") on delete cascade,
  plan_key text not null,
  created_at timestamptz not null default now()
);

create or replace function public.increment_credit_balance(
  p_user_id uuid,
  p_amount integer,
  p_plan_type text
) returns void as $$
begin
  insert into public.credit_balances (user_id, plan_type, remaining)
  values (p_user_id, p_plan_type, coalesce(p_amount, 0))
  on conflict (user_id)
  do update set
    plan_type = excluded.plan_type,
    remaining = public.credit_balances.remaining + coalesce(p_amount, 0),
    updated_at = now();
end;
$$ language plpgsql security definer;

-- Ensure RLS is enabled and policies allow service role operations.
alter table public.billing_profiles enable row level security;
alter table public.credit_balances enable row level security;
alter table public.usage_events enable row level security;
alter table public.billing_checkout_sessions enable row level security;
