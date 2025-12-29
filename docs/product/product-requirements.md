# Easy Risk Register - Product Requirements Document

## 1. Executive Summary

The Easy Risk Register is a lightweight, privacy-first web application for Australian small and medium-sized businesses (SMEs) to manage cyber security, privacy, and operational risks without enterprise complexity. The application addresses a critical market gap where SMEs rely on spreadsheets or informal processes while cyber threats and compliance obligations (e.g., the Notifiable Data Breaches scheme under the Privacy Act) continue to increase.

### 1.1 Problem Statement
Australian SMEs often lack structured, cyber-specific risk management processes, which leaves them vulnerable to common threats (phishing, ransomware, business email compromise) and creates stress when preparing for audits, board reporting, or privacy incident response. Traditional risk tools are too generic, too complex, or too costly; lightweight tools often fail to provide practical guidance, templates, and compliance-aligned reporting.

### 1.2 Solution Overview
Easy Risk Register provides a minimalist, privacy-first web application that runs in the browser. The core experience is still simple and SME-friendly, but the product now uses a **backend + database as the system of record**: risk register data is stored in **Supabase (Postgres)** and accessed via **server-side APIs** (e.g., Vercel serverless functions).

This direction enables:
- Centralized persistence (multi-device access, team workflows, auditability)
- Safer secret handling (no service keys in the browser)
- A foundation for optional integrations (e.g., threat intelligence, collaboration/sync)

### 1.2.1 Evolution from MVP
The earliest MVP direction was "client-only/local storage" to reduce friction and maximize privacy. As requirements expanded (multi-device access, team workflows, long-term history, and deployability), the product shifted to **Supabase as the default storage layer**.

Privacy implications of this shift:
- Data is stored server-side with authenticated access controls; there is **no default public sharing**.
- Optional **client-side encryption** (end-to-end) may be enabled so the database stores ciphertext for selected fields.

### 1.3 Target Market
The primary audience includes Australian SME owners, office managers, IT generalists, and compliance leads (typically 5-200 employees), especially in industries handling customer data (professional services, healthcare, retail, manufacturing). Users have basic technology skills and need fast, guided workflows rather than formal GRC training.

Primary personas:
- **Solo owner/operator (5-20 employees)**: needs fast setup, plain-language reporting, minimal admin overhead
- **Operations/office manager (10-50 employees)**: maintains the register, schedules reviews, exports for leadership
- **IT generalist / MSP contact (20-200 employees)**: wants cyber-specific starters, evidence of progress, and practical actions
- **Compliance lead (50-200 employees)**: tracks checklists, maturity snapshots, and audit-ready exports

### 1.4 Key Value Propositions
- Centralized, secure storage in Supabase (Postgres) for access across devices
- Privacy-first approach with clear data handling and least-privilege access controls
- Basic team collaboration within secure workspaces
- Cyber-security-first templates and guidance for common threats
- Australia-focused privacy incident and reporting support (assistive, not a substitute for legal advice)
- Cost-effective solution compared to traditional enterprise tools
- User-friendly interface accessible to non-risk-experts

### 1.5 Success Metrics
- **First-session completion rate**: >=70% of new users create at least 1 risk in their first session
- **Time to first value**: median time to first saved risk <=5 minutes
- **Template adoption**: >=50% of risks created from templates (first 30 days)
- **Reporting adoption**: >=30% of active workspaces export PDF/CSV within 7 days
- **Retention**: 30-day retention >=20% for active workspaces
- **Satisfaction**: collect NPS/CSAT and target an improving trend over time

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
- **Feature Description**: Automatic calculation of risk scores using probability × impact formulas
- **User Story**: As a manager, I want to see calculated risk scores so that I can prioritize which risks require immediate attention
- **Acceptance Criteria**:
  - Risk score is calculated using probability × impact
  - Scores are displayed visually to indicate severity levels
  - Calculation is updated in real-time when inputs change
  - Risk score ranges are clearly defined based on a 5x5 probability-impact matrix (scores 1-25): Low: 1-8, Medium: 9-15, High: 16-25 (or configurable by an admin)

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
    - A pie/donut chart showing category distribution (optional, complementary to bars)
    - A trend (line) chart showing overall risk exposure over time (based on stored score snapshots)
  - Charts respect active filters (e.g., category, threat type, status) and clearly display when filters are applied
  - Selecting a chart segment (bar/legend/point) drills down to the underlying risks (filter is applied consistently with the matrix)
  - Charts have accessible equivalents (table view and/or screen-reader summaries) and do not rely solely on color
  - If the database is unreachable, charts display a clear unavailable state; if client-side caching is implemented, charts can show the most recent synced snapshot with a "last updated" timestamp
  - Users can export charts as PNG images and include them in PDF reports
- **Priority**: P1 (high perceived value; improves decision-making and reporting)
- **Dependencies**: Risk list filtering, score history (2.1.5), export (2.4.7)
- **Technical Constraints**: Browser-based; use a lightweight chart library (e.g., Chart.js) and avoid heavy analytics dependencies
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
  - History storage remains performant with up to 1000 risks (bounded history per risk; default: retain last 20 snapshots per risk or last 90 days)
- **Priority**: P1 (enables trends; prerequisite for meaningful dashboards)
- **Dependencies**: Storage layer, settings
- **Technical Constraints**: Must be database-friendly; bounded retention required to avoid unbounded growth
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

#### 2.2.3 Workspaces and Collaboration (Basic)
- **Feature Description**: Users can collaborate in a shared workspace with controlled access.
- **User Story**: As an SME team lead, I want to invite teammates so that we can maintain one shared risk register and export reports consistently.
- **Acceptance Criteria**:
  - Users can create or join a workspace and invite members (email invite or link-based invite)
  - Workspace roles support at least: Owner/Admin, Member (read/write), and Viewer (read-only)
  - Risks, checklists, templates, and exports operate within the selected workspace context
  - Access is enforced server-side (RLS / authorization checks) so users cannot access other workspaces
- **Priority**: P2 (unlocks team use; not required for single-user)
- **Dependencies**: Authentication, database schema, authorization policies

### 2.3 Data Management Features
#### 2.3.1 Database Storage (Supabase)
- **Feature Description**: Centralized data management using a backend database (Supabase Postgres)
- **User Story**: As a user, I want my risk data stored securely in a database so that it is available across devices and can support team workflows
- **Acceptance Criteria**:
  - All risk register data (risks, categories, checklists, history where enabled) is stored in the database
  - Data persists across sessions and devices for the authenticated user/workspace
  - Users can view, edit, and delete their data via the application UI
  - The UI clearly communicates availability when offline/unreachable (no silent failures)
  - Access is restricted by authentication and least-privilege authorization (e.g., workspace/user scoping)

#### 2.3.2 Audit Trail (Optional)
- **Feature Description**: Track who changed what and when for key records (risks, checklists) to support accountability and audit preparation.
- **User Story**: As a compliance lead, I want to see an audit trail so that I can understand changes over time and answer "who changed this?" questions.
- **Acceptance Criteria**:
  - Create/update/delete actions for risks are recorded with user, timestamp, and action type
  - Checklist completion events are recorded with user and timestamp
  - Audit events are stored in a bounded append-only table (default retention: 90 days; configurable where appropriate)
  - The UI can display a basic per-risk activity log
  - Access rules:
    - Owner/Admin can view and export audit trails
    - Member can view audit trails (no export)
    - Viewer has no access to audit trails
- **Priority**: P2 (useful for teams/compliance; not required for MVP)
- **Dependencies**: Authentication, database schema, authorization policies

### 2.4 Cyber Security & Australia Compliance Features
#### 2.4.1 Cyber Risk Templates (ACSC-referenced starters)
- **Feature Description**: Users can create risks from curated cyber templates (e.g., phishing, ransomware, business email compromise) with suggested likelihood/impact, controls, and response steps, based on publicly available guidance and common Australian SME scenarios.
- **User Story**: As an SME owner, I want to add common cyber risks from templates so that I can get started quickly without specialist knowledge.
- **Acceptance Criteria**:
  - Given the risk create flow, when I choose a template, then the form pre-fills fields (title/description/category, probability, impact, mitigation plan).
  - Given templates are bundled with the app, when I open the template picker, then I can use templates without requiring additional network calls.
  - Edge case: If I edit a template-derived risk, it becomes an independent record (template stays unchanged).
- **Priority**: P0 (high impact, low effort; accelerates onboarding and differentiation)
- **Dependencies**: Category model, risk form
- **Technical Constraints**: Templates must be bundled with the app. MVP ships bundled-only templates (no user-customizable templates stored in the database); optional integrations may provide additional template packs.
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
- **Technical Constraints**: Links must be optional and not required for core use
- **UX Considerations**: Avoid overwhelming users; ensure accessibility (keyboard + screen readers)

#### 2.4.4 Automated Reminders (Risk Review / Backup Hygiene)
- **Feature Description**: Optional browser-based reminders prompt periodic risk reviews and operational cyber hygiene tasks (e.g., "review backups", "test restore", "update mitigation").
- **User Story**: As an SME manager, I want reminders so that I don't forget to review critical risks.
- **Acceptance Criteria**:
  - Users can opt-in/out and set reminder frequency.
  - Reminders are driven from risk metadata and user/workspace settings stored in the database.
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
- **Technical Constraints**: Keep templates lightweight and editable
- **UX Considerations**: Simple structure; printable layout; avoid overly prescriptive legal guidance

#### 2.4.6 Optional End-to-End Encryption (client-side before upload)
- **Feature Description**: Users can enable client-side encryption for risk data using a passphrase before it is stored in the database.
- **User Story**: As a privacy-conscious user, I want my stored data encrypted with a key only I control, so that database access alone does not reveal plaintext.
- **Acceptance Criteria**:
  - When enabled, sensitive fields are encrypted in the browser before transmission; the backend/database stores ciphertext (example sensitive fields: risk description, mitigation plan, incident response playbook content, notes/attachments metadata).
  - The app requires a passphrase to decrypt and use data during a session; the passphrase is not stored persistently.
  - Users can disable encryption (with confirmation) and rotate the passphrase with a defined migration flow.
  - Users can export encrypted backups and re-import them without decrypting server-side.
- **Priority**: P2 (security feature; higher complexity and UX risk)
- **Dependencies**: Data model, API contracts, key management UX
- **Technical Constraints**: Use Web Crypto API (e.g., PBKDF2 for key derivation and AES-GCM for encryption); avoid insecure custom crypto; handle data loss risk if passphrase is forgotten
- **UX Considerations**: Clear warnings about recovery; keep disabled by default for simplicity

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
  - Users can select a framework preset and record a simple score per domain (e.g., 0-4)
  - Presets include:
    - **ACSC Essential Eight-inspired** domains: application control, patch applications, configure Microsoft Office macros, user application hardening, restrict administrative privileges, patch operating systems, multi-factor authentication, regular backups
    - **NIST CSF-inspired** domains: identify, protect, detect, respond, recover
  - The radar chart updates immediately and supports exporting as part of PDF reports
  - The feature is clearly labeled as a self-assessment (assistive, not a certification)
  - Users can store multiple assessments with timestamps (to show maturity trends at a high level)
- **Priority**: P2 (valuable for some SMEs; keep optional to avoid overwhelming users)
- **Dependencies**: Charting (2.1.4), export (2.4.7)
- **Technical Constraints**: Keep domain lists small and editable; avoid implying legal/compliance guarantees
- **UX Considerations**: Plain-language domain descriptions; tooltips; default to hidden unless enabled in settings

## 3. Functional Requirements

### 3.1 Risk Management Functions
- **REQ-001**: The system shall allow users to create new risk entries with description, probability, impact, and mitigation plan
- **REQ-002**: The system shall calculate risk score using the formula: Probability × Impact
- **REQ-003**: The system shall provide CRUD (Create, Read, Update, Delete) operations for risk entries
- **REQ-004**: The system shall display risks in an interactive probability-impact matrix
- **REQ-005**: The system shall support filtering and sorting of risks by various criteria (category, severity, etc.)
- **REQ-017**: The system shall allow users to create a risk from a predefined cyber template that pre-fills the risk form
- **REQ-018**: The system shall allow users to attach and complete checklist items for a risk, including completion timestamps
- **REQ-019**: The system shall allow users to filter risks by cyber threat type and compliance/checklist status
- **REQ-020**: The system shall allow users to attach an incident response playbook to a risk (template-based, editable)
- **REQ-026**: The system shall provide a heat map matrix view with drill-down filtering by likelihood/impact cell
- **REQ-027**: The system shall provide a dashboard view with charts summarizing risk distribution and trends
- **REQ-028**: The system shall store bounded risk score history snapshots for trend visualizations (default: retain up to 20 snapshots per risk or 90 days, whichever is smaller; configurable and disable-able)
- **REQ-029**: The system shall allow users to record and view maturity self-assessments across predefined framework domains

### 3.2 User Interface Functions
- **REQ-006**: The system shall provide an intuitive, responsive user interface compatible with desktop, tablet, and mobile devices
- **REQ-008**: The system shall provide real-time updates to risk scores and visualizations
- **REQ-021**: The system shall provide educational tooltips and allow users to disable them
- **REQ-022**: The system shall allow users to configure reminders and display in-app reminder banners when notifications are unavailable

### 3.3 Export and Reporting Functions
- **REQ-010**: The system shall allow users to export risk data in CSV format
- **REQ-011**: The system shall allow users to import risk data from CSV with validation to prevent malformed content and CSV injection (e.g., neutralize leading formula characters `=`, `+`, `-`, `@` in user-controlled fields on export/import); supported columns must be documented and aligned with CSV export
- **REQ-023**: The system shall allow users to export risk data and filtered views as a PDF document
- **REQ-024**: The system shall allow users to export a privacy incident/checklist report template as PDF (assistive reporting)
- **REQ-030**: The system shall allow users to export dashboard charts (including maturity charts where enabled) as part of PDF reports
- **REQ-031**: The system shall allow users to export dashboard charts as PNG images for embedding in external documents
- **REQ-035**: The system shall support JSON export/import for backups and migrations, including encrypted variants where end-to-end encryption is enabled

### 3.4 Data Management Functions
- **REQ-014**: The system shall store user risk register data in a database (Supabase/Postgres)
- **REQ-016**: The system shall allow users to clear all stored data with appropriate confirmation
- **REQ-025**: The system shall allow users to optionally enable end-to-end encryption for selected fields using a user-provided passphrase
- **REQ-032**: The system shall authenticate users via Supabase Auth (or equivalent) and enforce row-level security (RLS) / authorization rules for data access
- **REQ-033**: The system shall detect offline/unavailable backend states and present clear UI feedback; write operations shall be blocked while offline; read-only mode may display last-synced data from an IndexedDB cache (bounded to the last 7 days or 100 items) with a clear "last updated" timestamp
- **REQ-034**: The system shall support workspaces and basic collaboration (invite members, role-based access) with server-side enforcement
- **REQ-036**: The system shall record an audit trail of create/update/delete actions for risks and completion events for checklists, scoped to the workspace and protected by authorization rules

## 4. Non-Functional Requirements

### 4.1 Performance Requirements
- **NFR-001**: The application shall load within 3 seconds on a standard broadband connection
- **NFR-002**: The application shall handle up to 1000 risk entries without significant performance degradation (use pagination and bounded queries for lists/history)
- **NFR-003**: All calculations and visual updates shall complete within 1 second of user input
- **NFR-004**: The application shall maintain responsive UI during all operations
- **NFR-023**: Chart rendering (matrix + dashboard) shall remain responsive with up to 1000 risks and bounded history enabled

### 4.2 Usability Requirements
- **NFR-005**: The application shall be usable by individuals with basic technology skills (no specialized risk management training required)
- **NFR-006**: The application shall follow common UI/UX best practices and accessibility guidelines
- **NFR-008**: The learning curve for basic operations shall not exceed 10 minutes
- **NFR-024**: Visualizations shall include non-visual equivalents (summaries and/or tables) and shall not rely on color alone to convey meaning

### 4.3 Security Requirements
- **NFR-009**: By default, data is stored securely in Supabase/Postgres with user authentication and authorization; no external sharing occurs without explicit user action (e.g., inviting workspace members)
- **NFR-010**: The application shall implement appropriate security measures to prevent XSS and other web vulnerabilities
- **NFR-012**: The application shall provide secure methods for data backup and transfer
- **NFR-021**: If end-to-end encryption is enabled, cryptographic operations shall use the Web Crypto API and vetted primitives (e.g., PBKDF2 with >=100,000 iterations + AES-GCM; no custom crypto)
- **NFR-022**: The application shall require network access for core risk register operations and provide clear offline/unavailable states (read-only where possible)
- **NFR-025**: Integrations (APIs, feeds, databases, real-time sync) shall be opt-in, clearly indicated in the UI, and safely disable-able without breaking core usage
- **NFR-026**: Backend APIs shall handle up to 50 concurrent requests per second with p95 latency under 500ms for typical SME workloads

### 4.4 Accessibility Testing
- **NFR-027**: The application shall target Lighthouse Accessibility score >=90 on key user flows (risk list, create/edit, matrix, dashboard)

### 4.5 Compatibility Requirements
- **NFR-013**: The application shall be compatible with modern browsers (Chrome, Firefox, Safari, Edge)
- **NFR-014**: The application shall provide responsive design for screen sizes ranging from 320px to 1920px width
- **NFR-015**: The application shall function with JavaScript enabled and provide graceful degradation where possible
- **NFR-016**: The application shall be accessible to users with disabilities according to WCAG 2.1 AA standards

### 4.6 Maintainability Requirements
- **NFR-017**: The application code shall follow established coding standards and include appropriate documentation
- **NFR-018**: The application shall be structured to allow for future feature additions with minimal disruption
- **NFR-020**: The application shall support modular development for easy maintenance and updates

## 5. Technical Architecture

### 5.1 System Architecture
The Easy Risk Register uses a browser-based UI with a backend API layer and a database system of record. The frontend runs in the user's browser and communicates with **server-side APIs** (e.g., Vercel serverless functions) which persist and query data in **Supabase (Postgres)**.

**Operating modes**
- **Online (normal)**: full functionality with authenticated access to the database.
- **Offline/unavailable (degraded)**: the UI communicates loss of connectivity and blocks write operations; read-only mode may show last-synced data from an IndexedDB cache (bounded to the last 7 days or 100 items) with a clear "last updated" timestamp.

**Key constraints**
- The browser must never receive service tokens/keys (no database admin keys, no third-party API keys).
- Access control must be enforced server-side (workspace/user scoping; least privilege).

### 5.2 Technology Stack
- **Frontend Framework**: React with Vite
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **Forms**: React Hook Form
- **Data Storage (Core)**: Supabase (Postgres)
- **Backend**: Vercel serverless functions (Node.js) for API access and secret management
- **External Services (Optional)**: Additional databases/services (e.g., time-series, graph) hosted by the user/org and connected via configured endpoints
- **Visualization**: Interactive 5x5 matrix UI + lightweight charting library (e.g., Chart.js) for dashboard/trend/radar charts
- **Import/Export**: CSV import/export with validation

### 5.3 Data Architecture
The database is the system of record. The frontend may maintain in-memory UI state and non-sensitive preferences, but should not be the authoritative source for risk register records.

Optional integration data flows (when enabled) may include:
- Syncing selected risk records or snapshots to a configured backend endpoint
- Pulling threat intelligence feeds or vulnerability metadata from configured sources
- Storing time-series snapshots in an external database for long-term trend analysis (recommended: Supabase/Postgres)

**Initial backend scope (recommended)**
- Time-series trends via backend endpoints:
  - `POST /api/timeseries/write` (ingest risk score snapshots)
  - `GET /api/timeseries/query` (read trend points)
- Data is stored in Supabase in a simple append-only table (e.g., `risk_trends`) keyed by `risk_id` and `timestamp`.

### 5.4 Security Architecture
- By default, risk register data is stored server-side (Supabase/Postgres) with authentication and least-privilege authorization (e.g., RLS)
- The app must make sharing explicit (workspace invites); there is no default public access
- Input sanitization prevents XSS attacks
- Authentication uses Supabase Auth (email/password, magic link, and/or OAuth) with email verification where appropriate
- Authorization is enforced primarily via Supabase RLS using end-user JWTs (`auth.uid()` and JWT claims for `workspace_id` scoping); backend APIs pass through the user's JWT rather than bypassing RLS
- Service-role credentials are limited to admin-only operations (e.g., migrations) and are never used for user-facing data access; the browser never receives admin keys or third-party API keys
- If end-to-end encryption is enabled, encryption keys are derived client-side and are never stored server-side
- Backend APIs include rate limiting guidance and structured logging to support anomaly detection and incident response

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
- **Color Coding**: Risk severity indicated by color (Green/Yellow/Red) with a legend plus non-color cues (labels, patterns/hatching, and/or icons) for accessibility
- **Interactivity**: Click to filter by likelihood/impact cell; table/list items open the edit view for updates
- **Responsive Design**: Adapts to different screen sizes while maintaining usability

### 6.4 Export Interface
- **Options Panel**: Format selection (CSV, PDF, PNG for charts where applicable)
- **Download Area**: Clear download buttons and success confirmation

## 7. Data Management and Security

### 7.1 Data Model
- Risk Entry: {id, workspaceId, title, description, probability, impact, riskScore, category, status, mitigationPlan, createdAt, updatedAt, createdBy, updatedBy, deletedAt?}
- Risk Score Snapshot: {id, workspaceId, riskId, timestamp, probability, impact, riskScore, createdAt, createdBy}
- Maturity Assessment: {id, workspaceId, frameworkKey, frameworkName, domains: [{key, name, score, notes?}], createdAt, updatedAt, createdBy, updatedBy} (store `domains` as JSONB for flexibility)
- Category: {id, workspaceId, name, description, createdAt, updatedAt}
- User Settings: {id, workspaceId, userId, theme, defaultProbabilityOptions, defaultImpactOptions, updatedAt}
- Audit Event: {id, workspaceId, entityType, entityId, action, userId, timestamp, details (JSONB)} (append-only; subject to retention)

### 7.2 Data Storage
- **Default**: risk register data is stored in Supabase/Postgres; data validation occurs before persistence.
- **Client behavior**: the app should not rely on persistent browser storage for core data; if caching is implemented for degraded offline viewing, it must be read-only, non-authoritative, and bounded (e.g., last 7 days or 100 items) with a clear "last updated" timestamp.

### 7.3 Data Backup and Recovery
- Export functionality allows users to save data to local files
- Import functionality allows restoring data from local files
- Warning system alerts users about data availability when offline/unreachable

### 7.4 Data Security
- By default, risk register data is stored server-side (Supabase/Postgres) with authentication and authorization controls (e.g., RLS); there is no default public sharing
- Optional end-to-end encryption keeps selected sensitive fields encrypted client-side before upload (database stores ciphertext)
- Input sanitization prevents injection attacks
- Sensitive information is not stored in plain text
- Access control is required to protect server-side resources (authentication + authorization)

## 8. Export Features

### 8.1 Export Formats
- **CSV Export**: Structured data export for use in spreadsheets
- **PDF Export**: Printable reports for risk registers and compliance-related checklists (including dashboard visuals where enabled)
- **PNG Export**: Export charts (dashboard and maturity where enabled) as PNG images (default 1080p; optional high-resolution export)
- **JSON Export**: Backup/migration export for restoring data across environments

## 9. Risk Mitigation and Backup Strategies

### 9.1 Data Loss Risks
- **Risk**: Database outage, accidental deletion, or remote data corruption
- **Mitigation**: Export (CSV/PDF/JSON) for backups; retry logic; optional client-side caching of last-synced data for read-only access during outages
- **Response**: Clear outage messaging, degraded-mode behavior, recovery and re-import instructions

### 9.2 Adoption Risks
- **Risk**: Users reverting to Excel/Google Sheets due to habit
- **Mitigation**: Superior visualization and automation features
- **Response**: User onboarding, tutorials, and support resources

### 9.3 Technical Risks
- **Risk**: Browser compatibility issues
- **Mitigation**: Cross-browser testing, graceful degradation
- **Response**: Regular compatibility updates, user support

### 9.4 Security Risks
- **Risk**: Auth/RLS misconfiguration, insecure API exposure, or leaked credentials
- **Mitigation**: Enforce RLS, least privilege, secret management, input validation, XSS protection, and rate limiting
- **Response**: Regular security reviews, credential rotation, incident response runbooks, and monitoring/alerting

- **Risk**: Encryption passphrase loss (when end-to-end encryption is enabled)
- **Mitigation**: Clear warnings; encourage encrypted JSON backups; require explicit acknowledgement during enablement
- **Response**: Documented recovery limitations (no server-side recovery); guided re-onboarding workflow

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
- Customer satisfaction scores (CSAT) and/or NPS (lightweight in-app survey)

### 10.4 Quality Metrics
- Bug reports and resolution time
- User support request volume
- Feature request satisfaction rate
- Accessibility compliance scores
- A/B test outcomes for key UX changes (e.g., dashboard defaults, scoring labels) where feasible

## 11. Implementation Timeline

### Phase 1: Core DB-Backed Register (Month 0-1)
- Supabase Auth + RLS policies (user/workspace scoping)
- Database schema + migrations (risks, categories, checklists, history)
- Core risk CRUD + matrix view wired to APIs
- Baseline exports (CSV)
- QA: automated tests where available + manual smoke test checklist

### Phase 2: Cyber Templates & Compliance (Month 1)
- Cyber risk templates and template picker
- Threat type and compliance/checklist status filtering
- Compliance checklist attachment and completion tracking
- Educational tooltips and guided onboarding (lightweight)
- Heat map enhancements (drill-down, accessibility improvements)
- QA: accessibility checks (Lighthouse) + cross-browser spot checks

### Phase 3: Reporting & Reminders (Month 2)
- PDF export for risk register and filtered views
- Privacy incident/checklist report export templates
- Optional reminders (notifications with in-app fallback)
- Dashboard charts (distribution + trends) with drill-down
- QA: export validation + performance checks on 1000 risks

### Phase 4: Advanced Privacy Controls (Month 3)
- Optional end-to-end encryption (passphrase, rotation, disable flow)
- Incident response planner templates and PDF export integration
- Optional maturity radar (framework self-assessment) and PDF inclusion
- QA: crypto review, threat modeling, and recovery-flow validation

### Phase 5: User Validation and Iteration (Month 4)
- Conduct 5-10 SME user interviews and usability tests
- Validate scoring thresholds, dashboard defaults, and collaboration workflows
- Prioritize improvements based on observed friction and adoption data

## 12. Critical Questions Checklist
- [x] Are there existing solutions we're improving upon? (Spreadsheets, static matrices)
- [x] What's the minimum viable version? (Core DB-backed register + matrix + exports)
- [x] What are the potential risks or unintended consequences? (Mis-scoped RLS, privacy expectations, misleading scoring, offline confusion)
- [x] Have we considered platform-specific requirements? (Online-first with degraded offline; browser storage constraints; optional caching)
- [x] What gaps need clarity? (Auth model and JWT claims, offline caching boundaries, workspace roles and audit visibility)

## Appendix A: Product Manager Review Output

## Confirm Understanding

Review the current PRD and ensure it is internally consistent with the pivot to Supabase/Postgres as the system of record, especially around auth/RLS, offline behavior, multi-tenancy, and auditability. Incorporate the provided resolutions as explicit, testable requirements.

### Clarifying Questions (Remaining)
- Will workspace scoping be carried as a custom JWT claim (e.g., `workspace_id`) or derived via a membership join table at query time?
- Will the app expose a "switch workspace" UX (multi-workspace user), or is it one workspace per user for MVP?

## Executive Summary

- **Elevator Pitch**: A simple cyber risk register for Australian SMEs with secure, shared workspaces and board-ready reporting.
- **Problem Statement**: SMEs need a practical way to capture, prioritize, and report cyber/privacy risks without enterprise GRC complexity.
- **Target Audience**: Australian SMEs (5-200 staff), especially data-heavy industries; owners, ops/compliance leads, and IT generalists.
- **Unique Selling Proposition**: Cyber-first templates + Australia-focused compliance support, with privacy-first storage and optional end-to-end encryption.
- **Success Metrics**: First-session completion, time-to-first-value, template adoption, export adoption, retention, NPS/CSAT (baselined in the PRD).

## Review Findings (Applied)

- **Auth + Authorization**: Supabase Auth + RLS is the primary enforcement mechanism using end-user JWTs; service-role is limited to admin-only operations.
- **Offline Strategy**: MVP behavior is defined as block writes while offline plus optional read-only last-synced cache (bounded to 7 days or 100 items) with a "last updated" timestamp.
- **Multi-Tenancy**: Core entities include `workspaceId` and audit fields in the data model, enabling RLS and collaboration.
- **Audit Trail**: Scope tightened with minimum events, retention baseline (90 days default), and role-based visibility rules.

## Feature Notes (Key Areas)

### Workspaces & Roles (P2)
- Roles: Owner/Admin, Member (read/write), Viewer (read-only).
- RLS policies must enforce workspace isolation and role constraints.

### End-to-End Encryption (P2)
- Sensitive fields identified (e.g., description, mitigation, playbooks).
- Crypto primitives specified (PBKDF2 iterations + AES-GCM) with explicit "no server-side recovery" posture.

### Auditability (P2)
- Append-only `audit_events` concept added; per-risk activity view supported.
- Export restricted to Owner/Admin.
