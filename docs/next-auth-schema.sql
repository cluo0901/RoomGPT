-- NextAuth Supabase Adapter schema (quoted identifiers to match adapter expectations)
-- Run: drop schema if exists next_auth cascade;
-- Then execute this script.

create schema if not exists next_auth;
create extension if not exists pgcrypto;

create table if not exists next_auth."users" (
  "id" uuid primary key default gen_random_uuid(),
  "name" text,
  "email" text unique,
  "emailVerified" timestamptz,
  "image" text,
  password_hash text,
  "created_at" timestamptz default now(),
  "updated_at" timestamptz default now()
);

create table if not exists next_auth."accounts" (
  "id" bigserial primary key,
  "userId" uuid references next_auth."users"("id") on delete cascade,
  "type" text not null,
  "provider" text not null,
  "providerAccountId" text not null,
  "refresh_token" text,
  "access_token" text,
  "expires_at" bigint,
  "token_type" text,
  "scope" text,
  "id_token" text,
  "session_state" text,
  "oauth_token_secret" text,
  "oauth_token" text,
  "created_at" timestamptz default now(),
  "updated_at" timestamptz default now(),
  constraint provider_unique unique ("provider", "providerAccountId")
);

create table if not exists next_auth."sessions" (
  "id" bigserial primary key,
  "sessionToken" text unique,
  "userId" uuid references next_auth."users"("id") on delete cascade,
  "expires" timestamptz not null,
  "created_at" timestamptz default now(),
  "updated_at" timestamptz default now()
);

create table if not exists next_auth."verification_tokens" (
  "identifier" text not null,
  "token" text primary key,
  "expires" timestamptz not null,
  "created_at" timestamptz default now(),
  "updated_at" timestamptz default now()
);

create table if not exists next_auth."authenticators" (
  "id" bigserial primary key,
  "userId" uuid references next_auth."users"("id") on delete cascade,
  "credentialID" text unique not null,
  "provider" text not null,
  "credentialPublicKey" text not null,
  "counter" bigint not null,
  "credentialDeviceType" text not null,
  "credentialBackedUp" boolean not null,
  "transports" text,
  "created_at" timestamptz default now(),
  "updated_at" timestamptz default now()
);

alter table next_auth."users" enable row level security;
alter table next_auth."accounts" enable row level security;
alter table next_auth."sessions" enable row level security;
alter table next_auth."verification_tokens" enable row level security;
alter table next_auth."authenticators" enable row level security;

grant usage on schema next_auth to service_role;
grant all privileges on all tables in schema next_auth to service_role;
grant all privileges on all sequences in schema next_auth to service_role;
