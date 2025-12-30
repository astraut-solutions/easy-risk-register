# Easy Risk Register Documentation

Easy Risk Register is a privacy-first risk management app backed by **Supabase (Postgres)** and accessed via **serverless APIs** (`/api/*` on Vercel). It supports **audit evidence preparation for ISO 27001 / SOC 2** (it does not provide certification).

Core risk register data is stored server-side (workspace-scoped with Supabase RLS). The browser stores non-authoritative UI state (for example filters and cached preferences) plus the Supabase session token; selected preferences (e.g. tooltips/onboarding/reminders) also sync to the workspace when available.

## Start here

- Setup: `docs/guides/dev/setup.md`
- Development workflow: `docs/guides/dev/development-workflow.md`
- Testing: `docs/guides/dev/testing.md`
- Code style: `docs/guides/dev/code-style.md`
- Deployment (Vercel + env vars): `docs/guides/deploy/deploy-vercel.md`
- Auth + workspace scoping baseline: `docs/guides/security/auth-workspace-scoping-baseline.md`

## Verification

- Matrix + filters performance and accessibility quick pass: `docs/verification/matrix-filters-performance-a11y.md`
- PDF exports (content + filters + charts + CSV regression): `docs/verification/pdf-exports.md`
- Maturity assessments (accessibility + exports): `docs/verification/maturity-assessments.md`
- Reminders (notifications + in-app fallback): `docs/verification/reminders.md`
- Usability validation loop (5–10 SME sessions): `docs/verification/usability-validation-loop.md`
- End-to-end encryption (threat model + recovery): `docs/verification/e2ee-threat-model-and-recovery.md`
- Audit trail (role access + export): `docs/verification/audit-trail.md`
- Offline expectations (deploy + privacy): `docs/guides/deploy/deploy-vercel.md#offline-behavior-expectations`
- Offline / read-only mode and cache: `docs/verification/offline-readonly-cache.md`
- Checklist template updates (no timestamp overwrites): `docs/verification/checklist-template-updates.md`
- Playbook template updates (no instance overwrites): `docs/verification/playbook-template-updates.md`

## Cyber templates and checklists

- Cyber templates, threat types, checklists, and filters: `docs/reference/high-level.md`
- Implementation note (MVP): cyber risk templates are bundled-only (no database table; no template APIs) and ship in the frontend build (`easy-risk-register-frontend/src/constants/cyber.ts`).
- Compliance checklists (privacy incident assist) are stored in Supabase and are assistive guidance only: `docs/guides/security/privacy-controls.md`

## Maturity and Settings

- Maturity self-assessment feature: Built-in capability radar with numbered domain scoring (self-assessment only; not certification)
- Settings: Full-page view with customizable preferences for tooltips, reminders, visualizations, and encryption

### Feature: Guided onboarding + educational tooltips
- [x] [database] Add user/workspace settings (tooltips on/off, onboarding state)
- [x] [backend] Add settings endpoints (workspace-scoped)
- [x] [frontend] Add tooltips on key fields + "first 3 steps" onboarding checklist; allow disabling tooltips
- [x] [deploy] Ensure external links (if any) are optional and do not block core use
- [x] [verify] Accessibility check for tooltip triggers and keyboard-only flow

## Audit-ready and evidence

- Audit-ready workflow: `docs/guides/product/audit-ready-workflow.md`
- PDF exports (download + print-to-PDF): `docs/guides/product/pdf-exports.md`
- Evidence guidance: `docs/guides/product/evidence-guidance.md`
- Privacy controls (encryption + playbooks): `docs/guides/security/privacy-controls.md`
- Risk record schema: `docs/reference/risk-record-schema.md`
- Risk CSV specification: `docs/reference/risk-csv-spec.md`

## Framework mapping guidance

- ISO 27001 mapping (evidence prep): `docs/frameworks/iso-27001-mapping.md`
- SOC 2 mapping (evidence prep): `docs/frameworks/soc2-mapping.md`

## Architecture and Security

- Architecture diagrams: `docs/architecture/architecture-diagrams.md`
- Secure data storage: `docs/architecture/secure-data-storage.md`
- Security policy: `docs/SECURITY.md`
- Security implementation: `docs/security-implementation.md`
- Security & Compliance Features: `security-and-compliance.md`
- Audit trail retention and access rules: `docs/guides/deploy/audit-trail.md`

## Financial Risk Quantification Features

- [Financial Risk Quantification Documentation](financial-risk-quantification.md): Complete guide to financial risk features
- Estimated Financial Impact (EFI) calculator: Calculate potential financial impact with range-based estimates (lower/upper bounds and expected mean)
- Financial Risk Trend visualization: Visualize financial risk trends over time with potential impact, mitigation investments, and net exposure
- Return on Security Investment (ROSI) calculator: Calculate risk reduction and return on investment for security controls
- Interactive Cost Modeling: Model and track costs associated with risk mitigation and security investments
- Range-based impact visualization: Visualize potential financial impact with lower/upper bounds and expected mean

## Advanced Risk Scoring Features

- [Advanced Risk Scoring Documentation](advanced-risk-scoring.md): Complete guide to advanced risk scoring features
- Dynamic Risk Score system: Enhanced risk scoring with multiple weighted factors and time-based adjustments
- Breach Likelihood probability calculations: Calculate breach probability based on threat, vulnerability, and controls effectiveness
- Scenario-based scoring: Specialized scoring for specific threat scenarios (ransomware, data compromise, insider threats, supply chain)
- Real-time risk posture measurement: Monitor organizational risk posture with trend analysis and capacity metrics

## Differentiating Features

- [Differentiating Features Documentation](differentiating-features.md): Complete guide to all differentiating features
- Financial Risk Translation: Converting technical risk data into business-friendly language with natural language generation
- Scenario Modeling and What-If Analysis: Monte Carlo simulations and sensitivity analysis capabilities
- Board-Ready PDF Reporting: Professional reports for executive presentations and board meetings
- Executive Communication Tools: Pre-built templates and sharing capabilities for stakeholder communication
- ROI Measurement for Security Investments: Financial analysis tools for security investment decisions with cost-benefit analysis and prioritization

## UI/UX Enhancements (Phase 6)

- [Integration capabilities UI/UX (scanners, SIEM, CMDB, APIs)](integration-capabilities-ui-ux.md)
- [Executive-focused dashboard with key metrics and visualizations](ui-ux-improvements.md#executive-dashboard)
- [Clear information hierarchy with progressive disclosure](ui-ux-improvements.md#information-hierarchy--progressive-disclosure)
- [Color-coded risk levels with consistent visual design](ui-ux-improvements.md#color-coded-risk-levels)
- [Mobile-responsive design optimized for all screen sizes](ui-ux-improvements.md#mobile-responsiveness)
- [Enhanced accessibility features with ARIA compliance](ui-ux-improvements.md#accessibility-features)
- [Intuitive navigation system for improved user experience](ui-ux-improvements.md#navigation-system)
- Performance testing framework with defined benchmarks
- WCAG 2.1 AA accessibility compliance checklist
- Maturity assessment panel: Full-width chart (400px height) + 2-column domain grid (numbered badges, equal-width label/dropdown)
- Settings: Moved from modal dialog to full-page view for improved usability
- Header simplified: One primary CTA (New risk) + Export/Import menus
