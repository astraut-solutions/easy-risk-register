# TODO — Audit-Ready + Framework Support (ISO 27001 / SOC 2)

Use this checklist to track the work needed to support claims around **ownership/accountability** and **audit evidence** (including ISO 27001 / SOC 2 mapping guidance).

## App / Product

### Data model & storage
- [x] Add `owner` field to `Risk` (string)
- [x] Add `ownerTeam` field to `Risk` (string, optional)
- [x] Add `dueDate` field to `Risk` (ISO date string, optional)
- [x] Add `reviewDate` field to `Risk` (ISO date string, optional)
- [x] Add `reviewCadence` field to `Risk` (optional; e.g. monthly/quarterly)
- [x] Add `riskResponse` field to `Risk` (enum: treat/transfer/tolerate/terminate)
- [x] Add `ownerResponse` field to `Risk` (short text)
- [x] Add `securityAdvisorComment` field to `Risk` (short text)
- [x] Add `vendorResponse` field to `Risk` (short text)
- [x] Add `notes` field to `Risk` (long text, optional)
- [x] Add `evidence` field to `Risk` (array of `{ type, url, description?, addedAt }`)
- [x] Add risk acceptance support (choose one approach and implement):
  - [x] Option A: extend `RiskStatus` with `accepted`
  - [ ] Option B: keep statuses and add `acceptanceStatus` + `acceptedAt` + `acceptedBy`
- [x] Add `mitigationSteps` to `Risk` (array of steps; optional `owner`, `dueDate`, `status`)
- [x] Decide how `mitigationPlan` is handled (keep as legacy/summary vs replace) and document the approach (`docs/reference/risk-record-schema.md`)
- [x] Implement LocalStorage schema versioning + migration for existing stored risks

### Categories
- [ ] Add support for user-defined/custom categories (in addition to predefined ones)
- [ ] Persist custom categories in LocalStorage

### UI/UX
- [ ] Update risk create/edit form to capture new accountability fields (owner/team/due/review/cadence/response)
- [ ] Add UI to manage evidence entries (add/edit/remove; validate URL)
- [ ] Add UI to manage `mitigationSteps` (add/reorder/complete; optional owner/due date)
- [ ] Update risk list/table view to display key fields (owner, due date, next review, response, evidence count)
- [ ] Update risk detail view to display all new fields clearly
- [ ] Update matrix tooltip/quick view to include owner + next review + acceptance status
- [ ] Ensure labels match user language (Likelihood = Probability; Severity derived from score bands)

### Import/Export
- [ ] Define a stable CSV column spec for the new fields (versioned)
- [ ] Extend CSV export to include new fields
- [ ] Make CSV import backward-compatible (accept older exports without new columns)
- [ ] Ensure custom categories round-trip correctly via CSV
- [ ] Add “Audit pack” export option (CSV variant including evidence URLs + review/acceptance metadata)
- [ ] Add CSV/Excel formula injection protection on export (e.g. prefix `=`, `+`, `-`, `@` values)

### Security & validation
- [x] Extend sanitization/validation limits for new text fields (`notes`, responses, evidence descriptions)
- [x] Validate and normalize evidence URLs (allowlist `http`/`https`)
- [ ] Avoid unsafe dynamic regex construction in search/filter logic
- [ ] Confirm CSP/XSS hardening remains consistent with existing patterns
- [ ] Document why SQL injection is not applicable (no backend) but CSV/XSS risks still are

### Tests
- [ ] Add unit tests for migration logic (old LocalStorage → new schema)
- [ ] Add unit tests for CSV import/export round-trips (old + new formats)
- [ ] Add unit tests for validation edge cases (dates, URLs, missing owner, long text)
- [ ] Update demo seed data to include realistic owners + evidence + acceptance examples

## Documentation

### New docs pages
- [ ] Add `docs/guides/audit-ready-workflow.md` (owners, reviews, evidence, audit pack export)
- [ ] Add `docs/guides/evidence-guidance.md` (what counts as evidence, naming conventions, retention reminders)
- [ ] Add `docs/frameworks/iso-27001-mapping.md` (how records/exports support evidence; avoid “certified/compliant” wording)
- [ ] Add `docs/frameworks/soc2-mapping.md` (practical mapping guidance + example evidence artifacts)

### Update existing docs
- [ ] Update `README.md` to reflect new ownership + evidence + audit-pack features
- [ ] Update docs index/navigation (MkDocs / GitHub Pages) to include the new pages
- [ ] Add a wording note: “supports audit evidence preparation for ISO 27001 / SOC 2” (do not claim certification)

## Definition of done
- [ ] A risk can be assigned to an owner and tracked with due/review dates
- [ ] Evidence links can be added, displayed, and exported
- [ ] Mitigation can be tracked as steps (not only free text)
- [ ] Risk acceptance can be recorded and surfaced in views/exports
- [ ] CSV import/export works across old/new versions
- [ ] Docs include clear, non-misleading ISO 27001 / SOC 2 mapping guidance
