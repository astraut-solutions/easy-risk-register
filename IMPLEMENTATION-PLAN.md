# Easy Risk Register — Implementation Plan (AU Cyber Focus)

This plan implements the cyber-security and Australia compliance enhancements captured in `docs/product/product-requirements.md`.

## How To Use This Plan
- Each task is a traceable checkbox with linked requirement IDs (e.g., `REQ-017`, `NFR-022`).
- Mark items complete as they ship; keep scope changes reflected in the PRD.

## Traceability Index
| Area | Requirement IDs |
| --- | --- |
| Cyber risk templates | `REQ-017`, `NFR-022` |
| Compliance checklists | `REQ-018`, `REQ-019`, `NFR-022` |
| Educational tooltips + onboarding | `REQ-021`, `NFR-006`, `NFR-016` |
| Reminders + notifications fallback | `REQ-022` |
| PDF exports | `REQ-023`, `REQ-024` |
| Incident response playbooks | `REQ-020` |
| Optional local encryption | `REQ-025`, `NFR-021` |

## Phase 2 (Month 1) — P0: Templates + Compliance Core
- [x] Define data model extensions: `threatType`, `templateId?`, `checklists[]`, `checklistStatus`, `playbook?` (`REQ-017`, `REQ-018`, `REQ-019`, `REQ-020`, `REQ-014`)
- [x] Create bundled cyber template library v1 (phishing, ransomware, BEC) with suggested likelihood/impact and mitigations (`REQ-017`, `NFR-022`)
- [x] Add template picker to risk create flow; selecting a template pre-fills fields; editing creates an independent record (`REQ-017`)
- [x] Add threat type taxonomy and filtering (matrix + list) (`REQ-019`, `REQ-005`)
- [x] Implement compliance checklist templates v1 (privacy incident) and attach to risks (`REQ-018`, `NFR-022`)
- [x] Persist checklist item completion with timestamps and compute checklist status (`REQ-018`, `REQ-019`)
- [x] Add filters for checklist status (not started / in progress / done) (`REQ-019`, `REQ-005`)
- [x] Add local-storage migration for existing users with safe defaults (no data loss) (`REQ-014`, `NFR-018`)

## Phase 3 (Month 2) - P1: Reporting + Reminders + Education
- [x] Build tooltip system for key fields + global toggle in settings (`REQ-021`, `NFR-016`)
- [x] Add guided onboarding (lightweight) encouraging templates and "first 3 steps" (`REQ-021`, `NFR-005`)
- [x] Implement PDF export for risk register + filtered views (include generated time, applied filters, severity legend) (`REQ-023`)
- [x] Implement PDF export for privacy incident/checklist report (checklist completion summary + timestamps) (`REQ-024`, `REQ-018`)
- [x] Add reminder settings (frequency, opt-in/out) stored locally (`REQ-022`, `REQ-014`)
- [x] Use Notification API when allowed; otherwise show in-app reminder banners (`REQ-022`)

## Phase 4 (Month 3) — P2: Advanced Privacy Controls + Response Planning
- [ ] Crypto design spike: storage format, key derivation, passphrase UX, recovery warnings (`REQ-025`, `NFR-021`)
- [ ] Implement at-rest encryption for stored data using browser crypto APIs (no custom crypto) (`REQ-025`, `NFR-021`, `NFR-009`)
- [ ] Add passphrase flows: enable/disable confirmations, rotation, explicit “forgotten passphrase = data loss” warning (`REQ-025`)
- [ ] Add incident response playbooks per risk (template-based, editable) (`REQ-020`)
- [ ] Include playbooks in PDF exports where applicable (`REQ-020`, `REQ-023`)

## Definition of Done (Per Feature)
- [ ] Requirement IDs referenced in PR description and/or commits
- [ ] Works offline for core flows (templates/checklists do not require network) (`NFR-022`)
- [ ] No data leaves device; no network dependency for core usage (`NFR-009`)
- [ ] Accessibility basics verified (keyboard navigation + screen reader-friendly labels) (`NFR-016`)
- [ ] Backward compatible with existing stored data (`REQ-014`)
