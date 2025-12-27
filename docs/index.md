# Easy Risk Register Documentation

Easy Risk Register is a client-side, privacy-focused risk management app that supports **audit evidence preparation for ISO 27001 / SOC 2** (it does not provide certification).

## Start here

- Setup: `docs/guides/setup.md`
- Development workflow: `docs/guides/development-workflow.md`
- Testing: `docs/guides/testing.md`
- Code style: `docs/guides/code-style.md`

## Cyber templates and checklists

- Cyber templates, threat types, and filters: `docs/reference/high-level.md`

## Maturity and Settings

- Maturity self-assessment feature: Built-in capability radar with numbered domain scoring (2-column layout)
- Settings: Full-page view with customizable preferences for tooltips, reminders, visualizations, and encryption

## Audit-ready and evidence

- Audit-ready workflow: `docs/guides/audit-ready-workflow.md`
- PDF exports (print-to-PDF): `docs/guides/pdf-exports.md`
- Evidence guidance: `docs/guides/evidence-guidance.md`
- Privacy controls (encryption + playbooks): `docs/guides/privacy-controls.md`
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
- Header simplified: Removed description text, maintained action buttons (New Risk, Export CSV/PDF, Import CSV)
