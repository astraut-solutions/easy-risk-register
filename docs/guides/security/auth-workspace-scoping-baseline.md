# Feature: Auth + workspace scoping baseline

This repo uses **Supabase Auth** for user identity and **workspace scoping** for multi-tenant data isolation.

## What runs where

- **Browser (frontend)**: authenticates with Supabase using `@supabase/supabase-js` and stores the end-user access token.
- **Serverless (`/api/*`)**: verifies the end-user token and talks to Supabase using the **anon key + the user’s JWT**, so **RLS policies** enforce per-user/per-workspace access.

## Frontend auth flow (baseline)

1) The frontend creates a Supabase client using:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_PUBLISHABLE_KEY` (or the legacy `VITE_SUPABASE_ANON_KEY` until your project rotates)

2) On load and on auth state changes, the frontend:
   - reads the current Supabase session
   - stores `accessToken` and `user` in the auth store

3) After the user is authenticated, the frontend calls `GET /api/users` to resolve:
   - `workspaceId`
   - `workspaceName` (if available)
   - `workspaceRole` (owner/admin/member/viewer; used for role-based UI like audit trail export)

4) For subsequent API calls, the frontend automatically attaches:
   - `Authorization: Bearer <accessToken>`
   - `x-workspace-id: <workspaceId>` (when available)

## Serverless auth flow (baseline)

All `/api/*` endpoints require an end-user Bearer token.

Token verification has two modes:

- **Local JWT verification (optional)**: if `SUPABASE_JWT_SECRET` is set, the API verifies HS256 JWTs locally.
- **Supabase verification (default)**: if `SUPABASE_JWT_SECRET` is not set, the API verifies by calling Supabase (`supabase.auth.getUser(accessToken)`).

## Workspace scoping (baseline)

By default, APIs resolve a workspace ID and scope all Supabase queries to that workspace.

### Selecting a workspace

The serverless layer accepts an optional workspace selector:

- `x-workspace-id` request header (preferred)
- `workspaceId` query parameter (supported for simple GETs)

Precedence:

- Header `x-workspace-id` wins over query `workspaceId`.

### Validation + membership checks

If a workspace selector is provided:

- It must look like a UUID (lowercased and validated server-side).
- The authenticated user must be a member of that workspace.

Common errors:

- `400 Invalid x-workspace-id` (malformed value)
- `403 Not a member of workspace` (user is not in that workspace)

### Default workspace resolution

If no workspace selector is provided, the API picks a default:

1) The user’s earliest workspace where `created_by = userId`
2) Otherwise, the earliest workspace membership
3) Otherwise, it creates a “Personal” workspace via `create_workspace` RPC

## Notes

- Workspace scoping is enforced primarily via **Supabase RLS**; the serverless APIs pass the user’s JWT through to Supabase.
- Do not put secrets in `VITE_*` variables; `VITE_*` values ship to the browser bundle.
