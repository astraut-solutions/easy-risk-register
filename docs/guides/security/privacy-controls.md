# Privacy Controls (Current + Roadmap)

This guide covers privacy-related features and how they map to the current Supabase-backed architecture.

## Data location (default)

- Risk register data is stored in Supabase Postgres (workspace-scoped with RLS).
- The browser stores only non-authoritative UI state (filters/settings) plus the Supabase Auth session token.

## Local encryption (current)

The app includes optional passphrase-based encryption for the **local persisted UI state** (`easy-risk-register-data`). This protects local preferences at rest on a shared/lost device, but it does **not** encrypt data stored in Supabase.

For details, see `docs/architecture/secure-data-storage.md`.

## End-to-end encryption (planned)

End-to-end encryption for selected sensitive fields (client-side encrypt before sending to Supabase; no server-side recovery) is tracked in `TASK_PLAN.md` under Phase 4.

## Incident response playbooks (current UI)

Playbooks are editable response checklists you can attach to a risk. In the current implementation these are stored in the risk row's `data` JSON payload (see `docs/reference/risk-record-schema.md`).

## PDF export integration

PDF exports are generated via a print-friendly report view in the browser (no server-side PDF generation). Reports are built from the currently loaded dataset (fetched from `/api/*`) and may include playbook/checklist information when present.
