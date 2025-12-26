-- Dev-only bootstrap for a minimal Supabase-compatible PostgREST setup.
-- This stack is intentionally minimal: DB + PostgREST + gateway that exposes `/rest/v1`.

create role anon nologin;
create role authenticated nologin;
create role service_role nologin bypassrls;

grant usage on schema public to anon, authenticated, service_role;

create extension if not exists pgcrypto;

create table if not exists public.risk_trends (
  id uuid primary key default gen_random_uuid(),
  risk_id text not null,
  probability int not null,
  impact int not null,
  risk_score int not null,
  timestamp bigint not null,
  category text,
  status text
);

alter table public.risk_trends enable row level security;
alter table public.risk_trends force row level security;

-- Allow server-side access (service_role key). Keep anon/authenticated locked down by default.
grant select, insert on public.risk_trends to service_role;

