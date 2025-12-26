# Easy Risk Register - Product Requirements Document

## 1. Executive Summary

The Easy Risk Register is a lightweight, privacy-first web application for Australian small and medium-sized businesses (SMEs) to manage cyber security, privacy, and operational risks without enterprise complexity. The application addresses a critical market gap where SMEs rely on spreadsheets or informal processes while cyber threats and compliance obligations (e.g., the Notifiable Data Breaches scheme under the Privacy Act) continue to increase.

### 1.1 Problem Statement
Australian SMEs often lack structured, cyber-specific risk management processes, which leaves them vulnerable to common threats (phishing, ransomware, business email compromise) and creates stress when preparing for audits, board reporting, or privacy incident response. Traditional risk tools are too generic, too complex, or too costly; lightweight tools often fail to provide practical guidance, templates, and compliance-aligned reporting.

### 1.2 Solution Overview
Easy Risk Register provides a minimalist, privacy-first web application that runs in the browser with no mandatory accounts. The core experience is client-side and offline-first (local storage + optional local encryption), with **optional backend/integrations** to support advanced features such as real-time collaboration, external threat intelligence, and time-series/history storage. The app differentiates through cyber risk templates (based on common Australian SME scenarios), compliance checklists, visual dashboards (heat maps, distribution, trends), and export-ready reporting that helps teams take action, not just record risks.

### 1.3 Target Market
The primary audience includes Australian SME owners, office managers, IT generalists, and compliance leads (typically 5–200 employees), especially in industries handling customer data (professional services, healthcare, retail, manufacturing). Users have basic technology skills and need fast, guided workflows rather than formal GRC training.

### 1.4 Key Value Propositions
- Instant setup with no mandatory accounts; works without backend configuration
- Privacy-first approach with local data storage
- Cyber-security-first templates and guidance for common threats
- Australia-focused privacy incident and reporting support (assistive, not a substitute for legal advice)
- Cost-effective solution compared to traditional enterprise tools
- User-friendly interface accessible to non-risk-experts

### 1.5 Success Metrics
- User acquisition and retention rates
- Risk assessment completion rates
- Template usage rates (risks created from templates vs. from scratch)
- Compliance checklist completion and export adoption
- Reminder/notification opt-in and review completion rates
- User satisfaction scores

## 2. Feature Specifications

### 2.1 Core Risk Management
#### 2.1.1 Risk Creation and Management
- **Feature Description**: Users can quickly add, edit, and delete risks through intuitive forms
- **User Story**: As a risk manager, I want to easily create risk records so that I can track all potential threats to my organization
- **Acceptance Criteria**:
  - Form includes fields for risk description, category, probability, impact, and mitigation plan
  - Risk records can be edited or deleted with appropriate confirmation
  - Form validation prevents incomplete or invalid entries
  - Risk categories are predefined based on common industry needs

#### 2.1.2 Risk Scoring
- **Feature Description**: Automatic calculation of risk scores using probability x impact formulas
- **User Story**: As a manager, I want to see calculated risk scores so that I can prioritize which risks require immediate attention
- **Acceptance Criteria**:
  - Risk score is calculated using probability x impact
  - Scores are displayed visually to indicate severity levels
  - Calculation is updated in real-time when inputs change
  - Risk score ranges are clearly defined based on a 5x5 probability-impact matrix (scores 1-25): Low: <=3, Medium: <=6, High: >6

#### 2.1.3 Risk Visualization
- **Feature Description**: Color-coded heat map (enhanced probability-impact matrix) that visualizes all risks and supports drill-down
- **User Story**: As a stakeholder, I want to visualize risks on a matrix so that I can quickly understand the relative importance of each risk
- **Acceptance Criteria**:
  - Interactive 5x5 matrix displays each risk at its probability/impact coordinate (with cell counts and drill-down to the list)
  - Cells are color-coded by severity (not color-only: labels/legend and patterns or text indicators available)
  - Matrix supports filtering by category, threat type, status, and checklist/compliance state
  - Hover/focus on a cell shows a plain-language summary (e.g., "High likelihood / Major impact") and the number of risks in that cell
  - Clicking/tapping a cell applies a filter and shows the risks for that cell; users can clear the filter
  - Matrix updates in real-time as risks are added/modified

#### 2.1.4 Risk Dashboard Charts (Distribution & Trends)
- **Feature Description**: A dashboard view that summarizes the risk register with simple charts suitable for non-experts (board-ready, not analyst tooling).
- **User Story**: As an SME owner, I want a dashboard with charts so that I can quickly understand what needs attention and explain it to leadership.
- **Acceptance Criteria**:
  - The dashboard includes at least:
    - A bar (or stacked bar) chart showing risk distribution by severity and/or category
    - A trend (line) chart showing overall risk exposure over time (based on stored score snapshots)
  - Charts respect active filters (e.g., category, threat type, status) and clearly display when filters are applied
  - Selecting a chart segment (bar/legend/point) drills down to the underlying risks (filter is applied consistently with the matrix)
  - Charts have accessible equivalents (table view and/or screen-reader summaries) and do not rely solely on color
  - Charts work offline by default; optional integrations may sync or enrich chart data when explicitly enabled
  - Users can export charts as PNG images and include them in PDF reports
- **Priority**: P1 (high perceived value; improves decision-making and reporting)
- **Dependencies**: Risk list filtering, score history (2.1.5), export (2.4.7)
- **Technical Constraints**: Client-side-first; use a lightweight chart library (e.g., Chart.js) and avoid heavy analytics dependencies; integrations must remain optional
- **UX Considerations**: Progressive disclosure (default to 2-3 charts); avoid clutter; clear legends and plain-language labels

#### 2.1.5 Risk Trend Tracking (Score History)
- **Feature Description**: Store lightweight time-series snapshots of risk scores so trends can be visualized over time.
- **User Story**: As a manager, I want to see risk score trends over time so that I can prove improvements and spot deterioration early.
- **Acceptance Criteria**:
  - When a risk is created or updated, the system records a score snapshot (timestamp, probability, impact, score)
  - Trend charts can show:
    - Overall exposure trend (e.g., sum/average of active risks) and/or
    - Per-risk score history for selected risks
  - Users can choose which trend view is the default (e.g., overall exposure vs. recently changed risks)
  - Users can optionally disable history tracking (privacy/storage preference) with clear explanation of impacts
  - History storage remains performant with up to 1000 risks (bounded history per risk, e.g., retain last N snapshots or last N days)
- **Priority**: P1 (enables trends; prerequisite for meaningful dashboards)
- **Dependencies**: Storage layer, settings
- **Technical Constraints**: Must be local-storage friendly; bounded retention required to avoid unbounded growth
- **UX Considerations**: Clear "what changed" microcopy; default settings optimized for simplicity

### 2.2 User Experience Features
#### 2.2.1 Responsive UI
- **Feature Description**: Responsive design that works across devices
- **User Story**: As a user, I want to access the application on any device so that I can manage risks from anywhere
- **Acceptance Criteria**:
  - UI is responsive and works on mobile, tablet, and desktop devices
  - All functionality is accessible across different screen sizes

#### 2.2.2 Real-time Updates
- **Feature Description**: Live updates for risk scores and visualization as data changes
- **User Story**: As a user, I want to see real-time updates to risk scores so that I can make informed decisions immediately
- **Acceptance Criteria**:
  - Risk scores update instantly when probability or impact changes
  - Visualizations update without requiring page refresh
  - All calculations complete within 1 second of input change

### 2.3 Data Management Features
#### 2.3.1 Local Storage Management
- **Feature Description**: Comprehensive data management using browser local storage
- **User Story**: As a user, I want my risk data to be stored securely in my browser so that it remains private and accessible only to me
- **Acceptance Criteria**:
  - All risk data is stored in browser local storage
  - Data persists across browser sessions
  - Users can view and manage their stored data
  - If integrations are enabled, users can still operate locally and choose what data (if any) is synced
  - Clear warnings are provided about local storage limitations

### 2.4 Cyber Security & Australia Compliance Features
#### 2.4.1 Cyber Risk Templates (ACSC-referenced starters)
- **Feature Description**: Users can create risks from curated cyber templates (e.g., phishing, ransomware, business email compromise) with suggested likelihood/impact, controls, and response steps, based on publicly available guidance and common Australian SME scenarios.
- **User Story**: As an SME owner, I want to add common cyber risks from templates so that I can get started quickly without specialist knowledge.
- **Acceptance Criteria**:
  - Given the risk create flow, when I choose a template, then the form pre-fills fields (title/description/category, probability, impact, mitigation plan).
  - Given templates are available offline, when I refresh or go offline, then templates remain available.
  - Edge case: If I edit a template-derived risk, it becomes an independent record (template stays unchanged).
- **Priority**: P0 (high impact, low effort; accelerates onboarding and differentiation)
- **Dependencies**: Category model, risk form
- **Technical Constraints**: Templates must be available offline (bundled JSON and/or user-customizable local templates). Optional integrations may provide additional template packs, but the core set remains local.
- **UX Considerations**: Template picker with preview; keep edits simple; include brief plain-language definitions

#### 2.4.2 Compliance Checklists (NDB / Privacy Act assist)
- **Feature Description**: Attach compliance-related checklists to risks/incidents (e.g., initial triage, containment, internal notifications) and track completion status.
- **User Story**: As a compliance lead, I want a checklist for privacy incidents so that I can respond consistently and document actions.
- **Acceptance Criteria**:
  - Given a risk marked as privacy-related, when I open details, then I can view and complete checklist items with timestamps.
  - Given checklist status, when I filter risks, then I can filter by checklist completion (not started/in progress/done).
  - Edge case: Checklist templates can be updated without altering completed timestamps on existing risks.
- **Priority**: P0 (regulatory pressure; concrete SME value)
- **Dependencies**: Risk details view, filtering (REQ-005)
- **Technical Constraints**: Assistive guidance only; no legal determinations in-app; no external data transmission
- **UX Considerations**: Progressive disclosure (hide advanced items); clear "not legal advice" messaging

#### 2.4.3 Educational Tooltips & Guided Onboarding
- **Feature Description**: Contextual tooltips explain key cyber terms (e.g., MFA, ransomware) and fields (probability/impact) with links to reputable public resources.
- **User Story**: As a non-expert, I want explanations in the app so that I can make confident choices when assessing risk.
- **Acceptance Criteria**:
  - Tooltips are available on key fields and can be turned off in settings.
  - Onboarding prompts templates and shows a "first 3 steps" checklist.
- **Priority**: P1 (improves adoption and data quality)
- **Dependencies**: Settings model
- **Technical Constraints**: Links must be optional and not required for core use (offline-first)
- **UX Considerations**: Avoid overwhelming users; ensure accessibility (keyboard + screen readers)

#### 2.4.4 Automated Reminders (Risk Review / Backup Hygiene)
- **Feature Description**: Optional browser-based reminders prompt periodic risk reviews and operational cyber hygiene tasks (e.g., "review backups", "test restore", "update mitigation").
- **User Story**: As an SME manager, I want reminders so that I don't forget to review critical risks.
- **Acceptance Criteria**:
  - Users can opt-in/out and set reminder frequency.
  - Reminders work without accounts; reminder state persists locally.
  - Edge case: If notification permission is denied, show in-app reminder banners instead.
- **Priority**: P1 (drives ongoing engagement)
- **Dependencies**: Settings model, dates/metadata on risks
- **Technical Constraints**: Must degrade gracefully without Notification API permissions
- **UX Considerations**: Respectful cadence; clear controls to snooze/disable

#### 2.4.5 Incident Response Planner (per-risk playbooks)
- **Feature Description**: Users can attach a simple incident response playbook to a risk (roles, immediate actions, communications, recovery steps).
- **User Story**: As an SME IT generalist, I want a basic response plan so that I can act quickly during an incident.
- **Acceptance Criteria**:
  - Playbooks can be created from templates and customized per risk.
  - Playbooks can be exported (PDF) for offline use.
- **Priority**: P2 (valuable, but depends on exports/templates maturity)
- **Dependencies**: Templates, PDF export
- **Technical Constraints**: No server; keep templates lightweight and editable
- **UX Considerations**: Simple structure; printable layout; avoid overly prescriptive legal guidance

#### 2.4.6 Optional Local Encryption (at-rest in browser)
- **Feature Description**: Users can enable encryption for data stored in local storage using a passphrase.
- **User Story**: As a privacy-conscious user, I want to encrypt my local data so that it's safer if my device is compromised.
- **Acceptance Criteria**:
  - When encryption is enabled, stored risk data is encrypted at rest; the app requires a passphrase on load.
  - Users can disable encryption (with confirmation) and rotate passphrase.
- **Priority**: P2 (security feature; higher complexity and UX risk)
- **Dependencies**: Settings, storage layer
- **Technical Constraints**: Use browser crypto APIs; avoid insecure custom crypto; handle data loss risk if passphrase is forgotten
- **UX Considerations**: Clear warnings about passphrase recovery; keep the default unencrypted for simplicity

#### 2.4.7 PDF Exports (Australia-focused reporting)
- **Feature Description**: Export printable PDF reports (risk register, filtered views, privacy incident log/checklist status) suitable for internal reporting.
- **User Story**: As a business owner, I want PDF reports so that I can share risks with leadership and auditors without spreadsheets.
- **Acceptance Criteria**:
  - Users can export selected risks and applied filters to PDF.
  - PDFs include generation date/time, applied filters, and severity legend.
- **Priority**: P1 (high perceived value; complements CSV)
- **Dependencies**: Export UI, filtering
- **Technical Constraints**: Fully client-side PDF generation; avoid network calls
- **UX Considerations**: Preview or clear confirmation; accessible print styles

#### 2.4.8 Compliance Maturity Radar (ACSC/NIST self-assessment)
- **Feature Description**: A lightweight self-assessment that visualizes maturity across framework domains as a radar/spider chart (optional, for reporting and gap-finding).
- **User Story**: As a compliance lead, I want a maturity chart so that I can communicate gaps against a known framework without building my own spreadsheet.
- **Acceptance Criteria**:
  - Users can select a framework preset (ACSC Essential Eight-inspired and NIST CSF-inspired domains) and record a simple score per domain (e.g., 0–4)
  - The radar chart updates immediately and supports exporting as part of PDF reports
  - The feature is clearly labeled as a self-assessment (assistive, not a certification)
  - Users can store multiple assessments with timestamps (to show maturity trends at a high level)
- **Priority**: P2 (valuable for some SMEs; keep optional to avoid overwhelming users)
- **Dependencies**: Charting (2.1.4), export (2.4.7)
- **Technical Constraints**: Offline-first; keep domain lists small and editable; avoid implying legal/compliance guarantees
- **UX Considerations**: Plain-language domain descriptions; tooltips; default to hidden unless enabled in settings

## 3. Functional Requirements

### 3.1 Risk Management Functions
- **REQ-001**: The system shall allow users to create new risk entries with description, probability, impact, and mitigation plan
- **REQ-002**: The system shall calculate risk score using the formula: Probability x Impact
- **REQ-003**: The system shall provide CRUD (Create, Read, Update, Delete) operations for risk entries
- **REQ-004**: The system shall display risks in an interactive probability-impact matrix
- **REQ-005**: The system shall support filtering and sorting of risks by various criteria (category, severity, etc.)
- **REQ-017**: The system shall allow users to create a risk from a predefined cyber template that pre-fills the risk form
- **REQ-018**: The system shall allow users to attach and complete checklist items for a risk, including completion timestamps
- **REQ-019**: The system shall allow users to filter risks by cyber threat type and compliance/checklist status
- **REQ-020**: The system shall allow users to attach an incident response playbook to a risk (template-based, editable)
- **REQ-026**: The system shall provide a heat map matrix view with drill-down filtering by likelihood/impact cell
- **REQ-027**: The system shall provide a dashboard view with charts summarizing risk distribution and trends
- **REQ-028**: The system shall store bounded risk score history snapshots for trend visualizations (with user-configurable retention and ability to disable)
- **REQ-029**: The system shall allow users to record and view maturity self-assessments across predefined framework domains

### 3.2 User Interface Functions
- **REQ-006**: The system shall provide an intuitive, responsive user interface compatible with desktop, tablet, and mobile devices
- **REQ-008**: The system shall provide real-time updates to risk scores and visualizations
- **REQ-021**: The system shall provide educational tooltips and allow users to disable them
- **REQ-022**: The system shall allow users to configure reminders and display in-app reminder banners when notifications are unavailable

### 3.3 Export and Reporting Functions
- **REQ-010**: The system shall allow users to export risk data in CSV format
- **REQ-011**: The system shall allow users to import risk data from CSV with validation to prevent malformed content and CSV injection
- **REQ-023**: The system shall allow users to export risk data and filtered views as a PDF document
- **REQ-024**: The system shall allow users to export a privacy incident/checklist report template as PDF (assistive reporting)
- **REQ-030**: The system shall allow users to export dashboard charts (including maturity charts where enabled) as part of PDF reports
- **REQ-031**: The system shall allow users to export dashboard charts as PNG images for embedding in external documents

### 3.4 Data Management Functions
- **REQ-014**: The system shall store all user data in browser local storage
- **REQ-016**: The system shall allow users to clear all stored data with appropriate confirmation
- **REQ-025**: The system shall allow users to optionally enable local encryption for stored data using a user-provided passphrase

## 4. Non-Functional Requirements

### 4.1 Performance Requirements
- **NFR-001**: The application shall load within 3 seconds on a standard broadband connection
- **NFR-002**: The application shall handle up to 1000 risk entries without significant performance degradation
- **NFR-003**: All calculations and visual updates shall complete within 1 second of user input
- **NFR-004**: The application shall maintain responsive UI during all operations
- **NFR-023**: Chart rendering (matrix + dashboard) shall remain responsive with up to 1000 risks and bounded history enabled

### 4.2 Usability Requirements
- **NFR-005**: The application shall be usable by individuals with basic technology skills (no specialized risk management training required)
- **NFR-006**: The application shall follow common UI/UX best practices and accessibility guidelines
- **NFR-008**: The learning curve for basic operations shall not exceed 10 minutes
- **NFR-024**: Visualizations shall include non-visual equivalents (summaries and/or tables) and shall not rely on color alone to convey meaning

### 4.3 Security Requirements
- **NFR-009**: By default, all data shall remain local to the user's device and not be transmitted to any server; if integrations are enabled, any transmission must be explicit, configurable, and limited to user-selected endpoints/features
- **NFR-010**: The application shall implement appropriate security measures to prevent XSS and other web vulnerabilities
- **NFR-012**: The application shall provide secure methods for data backup and transfer
- **NFR-021**: If local encryption is enabled, cryptographic operations shall use browser-provided crypto APIs and vetted primitives (no custom crypto)
- **NFR-022**: The application shall not require network access for core functionality (offline-first for templates and checklists)
- **NFR-025**: Integrations (APIs, feeds, databases, real-time sync) shall be opt-in, clearly indicated in the UI, and safely disable-able without breaking core usage

### 4.4 Compatibility Requirements
- **NFR-013**: The application shall be compatible with modern browsers (Chrome, Firefox, Safari, Edge)
- **NFR-014**: The application shall provide responsive design for screen sizes ranging from 320px to 1920px width
- **NFR-015**: The application shall function with JavaScript enabled and provide graceful degradation where possible
- **NFR-016**: The application shall be accessible to users with disabilities according to WCAG 2.1 AA standards

### 4.5 Maintainability Requirements
- **NFR-017**: The application code shall follow established coding standards and include appropriate documentation
- **NFR-018**: The application shall be structured to allow for future feature additions with minimal disruption
- **NFR-020**: The application shall support modular development for easy maintenance and updates

## 5. Technical Architecture

### 5.1 System Architecture
The Easy Risk Register follows a **client-side-first** architecture where the core risk register runs in the user's browser and utilizes local storage for data persistence (with optional local encryption). For advanced deployments, the product also supports **optional backend/integrations** (for example, Vercel serverless functions and externally hosted open source services such as time-series and graph databases). Core functionality remains usable without any server configuration.

### 5.2 Technology Stack
- **Frontend Framework**: React with Vite
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **Forms**: React Hook Form
- **Data Storage (Core)**: Browser local storage (with encryption for stored data)
- **Backend (Optional)**: Vercel serverless functions (Node.js) for integrations/sync
- **External Services (Optional)**: Open source databases/services (e.g., time-series, graph) hosted by the user/org and connected via configured endpoints
- **Visualization**: Interactive 5x5 matrix UI + lightweight charting library (e.g., Chart.js) for dashboard/trend/radar charts
- **Import/Export**: CSV import/export with validation

### 5.3 Data Architecture
- User risk data is stored in local storage using JSON format
- Data structure includes risk ID, description, probability, impact, mitigation plan, creation date, and metadata
- Data validation occurs before storing to ensure data integrity

Optional integration data flows (when enabled) may include:
- Syncing selected risk records or snapshots to a configured backend endpoint
- Pulling threat intelligence feeds or vulnerability metadata from configured sources
- Storing time-series snapshots in an external database for long-term trend analysis

### 5.4 Security Architecture
- By default, data remains client-side with no transmission to external servers
- When integrations are enabled, the app must clearly indicate that data may leave the device and provide controls to disable integrations
- Input sanitization prevents XSS attacks
- Session/auth management (if enabled for backend access) is handled using secure, modern mechanisms (e.g., token-based auth) with least-privilege scopes and safe storage guidance

## 6. User Interface Design Specifications

### 6.1 Dashboard Interface
- **Header**: Application title, navigation menu, user settings
- **Main Content**: Quick stats, heat map matrix, and a dashboard tab/section for charts (distribution and trends; optional maturity radar)
- **Sidebar**: Navigation to different sections, filters, and quick actions
- **Footer**: Legal information, version, and support links

### 6.2 Risk Creation Form
- **Layout**: Form with clear sections for risk information
- **Fields**: Risk description area, probability selection dropdown, impact selection, mitigation plan text area
- **Validation**: Validation with clear error messages
- **Actions**: Save, cancel options

### 6.3 Risk Visualization Matrix
- **Type**: Interactive 5x5 matrix grid with probability and impact axes
- **Color Coding**: Risk severity indicated by color (Green/Yellow/Red) with a legend and non-color cues for accessibility
- **Interactivity**: Click to filter by likelihood/impact cell; table/list items open the edit view for updates
- **Responsive Design**: Adapts to different screen sizes while maintaining usability

### 6.4 Export Interface
- **Options Panel**: Format selection (CSV)
- **Download Area**: Clear download buttons and success confirmation

## 7. Data Management and Security

### 7.1 Data Model
- Risk Entry: {id, title, description, probability, impact, riskScore, category, status, mitigationPlan, creationDate, lastModified}
- Risk Score Snapshot: {riskId, timestamp, probability, impact, riskScore}
- Maturity Assessment: {id, frameworkKey, frameworkName, domains: [{key, name, score, notes?}], createdAt, updatedAt}
- Category: {id, name, description}
- User Settings: {theme, defaultProbabilityOptions, defaultImpactOptions}

### 7.2 Data Storage
- All data stored in browser's local storage using JSON format
- Data validation occurs before storing to ensure data integrity

### 7.3 Data Backup and Recovery
- Export functionality allows users to save data to local files
- Import functionality allows restoring data from local files
- Warning system alerts users about local storage limitations

### 7.4 Data Security
- By default, data never leaves the user's device
- If integrations are enabled, only the minimum necessary data is transmitted for the enabled feature(s), and the UI provides clear controls to disable syncing/integrations
- Input sanitization prevents injection attacks
- Sensitive information is not stored in plain text
- Access control is not necessary for local-only mode; if backend features are enabled, appropriate access controls apply to server-side resources

## 8. Export Features

### 8.1 Export Formats
- **CSV Export**: Structured data export for use in spreadsheets
- **PDF Export**: Printable reports for risk registers and compliance-related checklists (including dashboard visuals where enabled)
- **PNG Export**: Export charts (dashboard and maturity where enabled) as PNG images

## 9. Risk Mitigation and Backup Strategies

### 9.1 Data Loss Risks
- **Risk**: Browser storage clearing or corruption
- **Mitigation**: Clear export functionality for manual backups
- **Response**: Clear recovery instructions, import functionality

### 9.2 Adoption Risks
- **Risk**: Users reverting to Excel/Google Sheets due to habit
- **Mitigation**: Superior visualization and automation features
- **Response**: User onboarding, tutorials, and support resources

### 9.3 Technical Risks
- **Risk**: Browser compatibility issues
- **Mitigation**: Cross-browser testing, graceful degradation
- **Response**: Regular compatibility updates, user support

### 9.4 Security Risks
- **Risk**: Local storage vulnerabilities
- **Mitigation**: Input sanitization, XSS protection
- **Response**: Regular security audits, updates to security practices

## 10. Success Metrics and KPIs

### 10.1 User Engagement Metrics
- Number of active users per month
- Average number of risks created per user
- Session duration and frequency
- Feature adoption rates (export, visualization, etc.)

### 10.2 Performance Metrics
- Application load time
- Time to complete first risk entry
- Error rates and system stability
- Cross-browser compatibility success rates

### 10.3 Business Metrics
- User acquisition rate
- User retention rate (7-day, 30-day)
- Customer satisfaction scores

### 10.4 Quality Metrics
- Bug reports and resolution time
- User support request volume
- Feature request satisfaction rate
- Accessibility compliance scores

## 11. Implementation Timeline

### Phase 1: Current MVP (Complete)
- Basic risk CRUD operations
- Probability-impact scoring
- Simple visualizations
- CSV export functionality
- Responsive UI implementation

### Phase 2: Cyber Templates & Compliance (Month 1)
- Cyber risk templates and template picker
- Threat type and compliance/checklist status filtering
- Compliance checklist attachment and completion tracking
- Educational tooltips and guided onboarding (lightweight)
- Heat map enhancements (drill-down, accessibility improvements)

### Phase 3: Reporting & Reminders (Month 2)
- PDF export for risk register and filtered views
- Privacy incident/checklist report export templates
- Optional reminders (notifications with in-app fallback)
- Dashboard charts (distribution + trends) with drill-down

### Phase 4: Advanced Privacy Controls (Month 3)
- Optional local encryption (passphrase, rotation, disable flow)
- Incident response planner templates and PDF export integration
- Optional maturity radar (framework self-assessment) and PDF inclusion

# Product Manager Output: Visual Charts & Dashboards

## Confirm Understanding (and Open Questions)

### Restatement
Add visual charts to Easy Risk Register to make cyber risk data more intuitive and actionable for Australian SMEs, starting with an enhanced risk heat map and expanding into a simple dashboard (distribution + trends) and an optional maturity radar for compliance reporting.

### Assumptions
- The app remains client-side-first (offline-first) and stores all data in local storage (with optional encryption), with optional backend/integrations available for advanced use cases.
- Charts are for decision support and reporting; they are not meant to be "advanced analytics" or a SOC dashboard.
- Users have basic tech skills and limited time; the UI must avoid clutter and use progressive disclosure.

### Clarifying Questions (non-blocking)
1. Which framework(s) should be first-class for maturity radar presets: `ACSC Essential Eight`, `NIST CSF`, or both? **Decision**: Both; user-selectable.
2. For trends, do you prefer "overall exposure" (sum/average across risks) as the default, or "risks changed recently"? **Decision**: User-selectable default in settings.
3. Should chart exports include a standalone image export (PNG) in addition to PDF inclusion? **Decision**: Both; support PNG export and PDF inclusion.

## Executive Summary
- **Elevator Pitch**: Turn your risk list into clear charts so you can see what matters and explain it quickly.
- **Problem Statement**: SMEs struggle to interpret risk registers and communicate priorities; spreadsheets and lists make it hard to see hotspots, trends, and compliance gaps.
- **Target Audience**: Australian SME owners, operations/compliance leads, and IT generalists (5–200 employees), especially in regulated or data-heavy industries.
- **Unique Selling Proposition**: Privacy-first, offline dashboards tailored to cyber risk and Australia-focused reporting, without enterprise GRC complexity.
- **Success Metrics**:
  - Increased use of visualization views (heat map + dashboard) per active user
  - Reduced time-to-prioritize (time from opening app to identifying top risks)
  - Higher PDF export adoption (board/audit reporting)
  - Self-reported "confidence in prioritization" via in-app feedback prompt

## Feature Specifications

### Feature: Enhanced Risk Heat Map (Matrix)
- **User Story**: As an SME owner, I want a color-coded heat map so that I can spot the highest priority risks at a glance.
- **Acceptance Criteria**:
  - Given I have risks, when I open the matrix view, then I see a 5x5 grid with severity coloring and a legend
  - Given I select a cell, when it contains risks, then the risk list filters to show only those risks
  - Edge case: If color perception is limited, then severity is still understandable via labels/legend and non-color cues
- **Priority**: P0 (builds on existing matrix; immediate usability gain)
- **Dependencies**: Filtering consistency across views
- **Technical Constraints**: Offline-first; no external data calls
- **UX Considerations**: Plain-language axis labels; clear drill-down affordances; avoid dense clutter inside cells

### Feature: Dashboard Charts (Distribution + Trends)
- **User Story**: As a manager, I want a dashboard so that I can understand distribution and trends and present it to leadership.
- **Acceptance Criteria**:
  - Given I open the dashboard, when risks exist, then I see at least one distribution chart (bar/stacked bar) and one trend chart (line)
  - Given I apply filters, when viewing charts, then charts reflect filters and show "filters applied" state
  - Given I use exports, when I export charts, then I can export as PNG and include charts in PDF reports
  - Edge case: With 1000 risks and bounded history, charts still render responsively
- **Priority**: P1 (high perceived value; supports board reporting)
- **Dependencies**: Score history snapshots; PDF export
- **Technical Constraints**: Lightweight chart library (e.g., Chart.js); avoid heavy deps
- **UX Considerations**: Progressive disclosure; sensible defaults; drill-down interactions are consistent with matrix/list

### Feature: Compliance Maturity Radar (Optional)
- **User Story**: As a compliance lead, I want a maturity radar so that I can show gaps against a known framework without building my own spreadsheet.
- **Acceptance Criteria**:
  - Given I choose a framework preset, when I score domains, then a radar chart updates immediately
  - Given presets are available, when I start a maturity assessment, then I can choose ACSC Essential Eight-inspired or NIST CSF-inspired presets
  - Given I export a PDF, when maturity is enabled, then the radar is included with a clear "self-assessment" label
  - Edge case: If a user does not need maturity tracking, then the feature remains optional/hidden by default
- **Priority**: P2 (useful for some; avoid overwhelming the core audience)
- **Dependencies**: Charting infrastructure; export pipeline
- **Technical Constraints**: Keep domain list small; editable; no compliance guarantees implied
- **UX Considerations**: Plain-language domain descriptions; tooltips; timestamps to show improvement over time

## Requirements Documentation Structure

### Functional Requirements
- Chart views: heat map drill-down, dashboard distribution/trends, optional maturity scoring
- State management: filters are shared across list/matrix/charts; user settings control history retention and maturity enablement
- Data validation: maturity scores constrained to a small range; history snapshots bounded
- Integration points: chart library for standard charts; existing matrix remains custom UI

### Non-Functional Requirements
- Performance: responsive rendering up to 1000 risks with bounded history enabled
- Security: no network calls for core functionality; sanitize inputs; use browser crypto if encryption enabled
- Accessibility: WCAG 2.1 AA; charts have text alternatives and do not rely on color alone

### User Experience Requirements
- Information architecture: dashboard tab with limited default chart set; deeper views behind progressive disclosure
- Error prevention: clear empty states and "no data for current filters" messaging
- Feedback patterns: drill-down and filter chips; clear "filters applied" indicator across views

## Critical Questions Checklist
- [x] Are there existing solutions we're improving upon? (Spreadsheets, static matrices)
- [x] What's the minimum viable version? (Enhanced heat map + 2-chart dashboard)
- [x] Potential risks? (Overwhelming users; misleading visuals; accessibility gaps)
- [x] Platform-specific requirements? (Offline-first; browser storage constraints)
- [ ] What gaps need clarity? (Framework preset choice; default trend definition; export format expectations)
