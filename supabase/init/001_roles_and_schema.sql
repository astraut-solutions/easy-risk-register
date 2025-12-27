-- Dev-only bootstrap for a minimal Supabase-compatible PostgREST setup.
-- This stack is intentionally minimal: DB + PostgREST + gateway that exposes `/rest/v1`.

do $$
begin
  create role supabase_admin login superuser password 'postgres';
exception
  when duplicate_object then
    alter role supabase_admin with login superuser password 'postgres';
end $$;

-- Needed by some Supabase Postgres image extension hooks.
grant pg_read_server_files to supabase_admin;

do $$
begin
  create role anon nologin;
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create role authenticated nologin;
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create role service_role nologin bypassrls;
exception
  when duplicate_object then null;
end $$;

grant usage on schema public to anon, authenticated, service_role;

-- GoTrue expects an `auth` schema for its migrations.
-- In hosted Supabase this already exists, but in this minimal local stack we create it.
create schema if not exists auth;
grant usage on schema auth to anon, authenticated, service_role;

-- GoTrue migrations create some types without schema qualification, relying on the connection search_path.
-- Ensure they land in `auth` by default for the dedicated superuser used by GoTrue.
alter role supabase_admin set search_path = auth, public;

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
