# Secure Data Storage (Local State + Tokens)

This document describes what Easy Risk Register stores in the browser, and what is stored server-side.

## System of record (Supabase)

Core risk register data is stored in **Supabase Postgres** and accessed via `/api/*`. Workspace scoping is enforced via Supabase **RLS** (see `supabase/init/002_workspaces_core_tables_rls.sql`).

## Browser storage (non-authoritative)

The browser stores:

- **UI preferences** (filters/settings) under the Zustand persisted key `easy-risk-register-data`.
- **Supabase Auth session** (access token/refresh token) using the default `@supabase/supabase-js` session storage.

Clearing browser storage will typically sign you out and reset local preferences, but it does not delete server-side risk data.

## Optional local encryption

The app includes an optional passphrase-based encryption layer for the **Zustand persisted key** (`easy-risk-register-data`):

- **KDF**: PBKDF2 (SHA-256)
- **Cipher**: AES-GCM
- **Key handling**: derived key is kept in memory for the current session

Implementation:

- `easy-risk-register-frontend/src/utils/encryptionManager.ts`
- `easy-risk-register-frontend/src/utils/RiskRegisterPersistStorage.ts`

Important scope note:

- This encryption protects the local persisted payload (preferences). It does **not** encrypt data stored in Supabase.
- End-to-end encryption of selected risk fields is tracked as Phase 4 work in `TASK_PLAN.md`.

## Threat model notes

- Local encryption does not protect against attackers who can execute code in the same origin (for example via XSS).
- Primary server-side risk is mis-scoped authorization (RLS/API). Keep service keys out of the browser and rely on RLS enforcement.
