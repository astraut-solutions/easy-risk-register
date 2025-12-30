# Privacy Controls (Current + Roadmap)

This guide covers privacy-related features and how they map to the current Supabase-backed architecture.

## Data location (default)

- Risk register data is stored in Supabase Postgres (workspace-scoped with RLS).
- The browser stores non-authoritative UI state (filters + cached preferences) plus the Supabase Auth session token. Some preferences (e.g. tooltips/onboarding) may be synced server-side per workspace/user.

## Local encryption (current)

The app includes optional passphrase-based encryption for the **local persisted UI state** (`easy-risk-register-data`). This protects local preferences at rest on a shared/lost device, but it does **not** encrypt data stored in Supabase.

For details, see `docs/architecture/secure-data-storage.md`.

## End-to-end encryption (selected fields)

Easy Risk Register supports optional end-to-end encryption (E2EE) for selected sensitive risk fields (client-side encrypt before sending to Supabase; **no server-side recovery**).

Key points:

- Encrypts `description` and `mitigationPlan` only; list/filter fields remain plaintext for UX.
- Encryption keys are derived client-side (PBKDF2 + AES-GCM) and are not stored server-side.
- E2EE setup is **per device/browser** and must be unlocked per session to view/edit encrypted fields.
- **No recovery**: losing the passphrase means encrypted fields are unrecoverable.

See:

- Architecture: `docs/architecture/end-to-end-encryption.md`
- Verification (threat model + recovery flows): `docs/verification/e2ee-threat-model-and-recovery.md`

## Incident response playbooks (current UI)

Playbooks are editable response checklists you can attach to a risk. In the current implementation these are stored in the risk row's `data` JSON payload (see `docs/reference/risk-record-schema.md`).

## Compliance checklists (privacy incident assist)

The app includes optional per-risk compliance checklists (for example: privacy incident response under the NDB scheme). These are **assistive guidance only** and are not legal advice.

Implementation notes:

- Checklist templates are stored in Supabase (`public.checklist_templates` + `public.checklist_template_items`).
- Per-risk checklist instances and item completion timestamps are stored in Supabase (`public.risk_checklists` + `public.risk_checklist_items`).
- Template changes do **not** overwrite existing per-risk checklist item timestamps; instances snapshot template content at attach-time.

## PDF export integration

Easy Risk Register supports two PDF export paths:

- **Server-side PDF endpoints** (`/api/exports/*.pdf`) for direct downloads (risk register + privacy incident/checklist report).
- **Print to PDF** via a print-friendly report view (used for dashboard charts so exported PDFs include chart images).

Reports are built from workspace-scoped data fetched via `/api/*` and may include playbook/checklist information when present.
