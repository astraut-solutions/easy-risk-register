# Dashboard & Maturity Features: User Guide

## Overview

Easy Risk Register now includes interactive dashboards and optional maturity assessments to help you visualize, analyze, and report on your cyber risks. This guide explains each feature and how to use them effectively.

---

## 1. Executive Overview (Risk Matrix)

The **Executive Overview** tab provides an at-a-glance view of all your risks using an interactive heat map.

### What It Shows

A **5×5 probability-impact matrix** where each cell displays:
- **Risk count** (number of risks in that cell)
- **Severity cues** (H/M/L labels + border styles; not color-only)
- **Accessible labels** (screen-reader-friendly cell summaries)

### How to Use It

**Drill down to the list**:
1. Click a populated cell (or focus it and press **Enter**)
2. The app opens the **Risk table** view with a matrix filter active (Likelihood × Impact)
3. Use **Clear matrix filter** to remove the cell selection

**Drill into severity levels**:
- Click the **High severity** cell to see top-priority risks
- Click **Medium** to focus on secondary risks
- Click a specific cell combination (e.g., High likelihood + Low impact)

**Keyboard navigation**:
- Use **Arrow keys** to move between cells
- Press **Enter/Space** to activate a populated cell

**Tips for interpreting the matrix**:
- Red cells (top right) = immediate attention required
- Orange cells (middle) = should be addressed soon
- Yellow cells (bottom left) = monitor regularly

---

## 2. Dashboard Charts

The **Dashboard Charts** tab shows distribution and trend data to help you communicate risk status to leadership.

### Distribution Chart

Shows how risks are distributed across **severity levels** and/or **categories**.

**What it tells you**:
- "Most of our risks are Medium severity" → May indicate you're managing risk well
- "Lots of High severity" → Clear action items needed
- Distribution by category helps identify problem areas (e.g., "70% are Cyber Security risks")

**How to use it**:
1. Click on any bar segment to filter the risk list
2. The matrix and table automatically filter to match
3. Charts update to reflect your current filters

### Trend Chart (Score History)

Shows how your **overall risk exposure** has changed over time (last 30, 90, or 365 days).

**What it tells you**:
- Upward trend = risk exposure is increasing (new risks, control failures)
- Downward trend = risk exposure is decreasing (mitigations working)
- Flat = stable risk profile

**Customization**:
- In **Settings**, choose the default trend view:
  - **Overall exposure**: Sum/average of active risks (shows org-wide trend)
  - **Recently changed**: Highlights risks that were just added or updated

### Tips for Board Reporting

- **Take a screenshot** of the dashboard to include in board reports
- **Export as PNG** (button on each chart) for slides or emails
- **Export as PDF** for complete reports with all charts
- Use the **clear filters** button to reset to "all risks" before exporting
- Trend charts are ideal for showing improvement over time

---

## 3. Maturity Radar (Optional)

The **Maturity Radar** tab is for organizations that want to self-assess their cyber security maturity against a known framework.

### What Is It?

A **radar chart** that visually shows your maturity score across key domains (e.g., ACSC Essential Eight or NIST CSF).

**Example**:
- Domain: "Multi-factor authentication (MFA)"
- Your score: 2 out of 4 (partial implementation)
- Radar shows a mid-range value for that domain

### Available Frameworks

**ACSC Essential Eight (Australia-specific)**:
- Application control
- Patch applications
- Patch operating systems
- Multi-factor authentication
- Restrict administrative privileges
- Regular backups
- User application hardening
- Macro settings

**NIST Cybersecurity Framework**:
- Identify
- Protect
- Detect
- Respond
- Recover

### How to Use It

**Create an assessment**:
1. Click **New Assessment** button
2. Choose your framework (ACSC or NIST)
3. You'll see a form with all domains

**Score each domain**:
- Score: **0** = Not implemented
- Score: **1** = Initial/ad hoc
- Score: **2** = Repeatable/documented
- Score: **3** = Optimized/proactive
- Score: **4** = Advanced/automated

Optional: Add **notes** for each domain (e.g., "MFA enabled for 80% of users")

**View the radar**:
- As you score domains, the radar chart updates in real time
- Each domain is a "spoke" of the radar; longer spokes = higher maturity
- Compare two assessments visually to spot gaps

**Multiple assessments**:
- Create multiple assessments over time (e.g., quarterly)
- Each is timestamped to show progress
- Delete old assessments you no longer need

### Tips for Assessments

- **Be honest**: This is a self-assessment, not a compliance audit. Accuracy helps you identify real gaps.
- **Update quarterly**: Schedule maturity reviews when you update your risk register
- **Use for planning**: Domains with low scores are good candidates for improvement projects
- **Export for audits**: Include the radar chart in audit reports (with the "Self-Assessment" label)

---

## 4. Risk Table (Spreadsheet View)

The **Risk Table** tab displays all risks in a spreadsheet-like view for quick scanning and bulk operations.

### Columns

- **Risk Title**: Description of the risk
- **Category**: Cyber Security, Operational, etc.
- **Probability**: 1 (Very Low) to 5 (Very High)
- **Impact**: 1 (Very Low) to 5 (Very High)
- **Risk Score**: Calculated probability × impact (1–25)
- **Status**: Open, Mitigated, Closed, Accepted
- **Actions**: Edit, delete, or attach checklists

### Filtering & Sorting

Click **column headers** to sort by that column (↑ ascending, ↓ descending).

Use the **Filter panel** on the left to narrow the list by:
- Status (Open, Mitigated, etc.)
- Category
- Threat type
- Severity level
- Search text

### Exporting

- **Export as CSV**: Download all visible risks for use in Excel or other tools
- **Export as PDF**: Includes the table, charts, and optional maturity radar

---

## 5. Filtering Across All Views

All views (matrix, dashboard, table) share the **same filters**. When you filter in one view, the others update automatically.

### Filter Types

**Status**:
- Open (active risks requiring attention)
- Mitigated (risk reduced by controls)
- Closed (risk no longer applies)
- Accepted (risk accepted as-is)

**Category**:
- Cyber Security, Operational, Strategic, or custom categories you've created

**Threat Type**:
- Phishing, Ransomware, Business Email Compromise, Malware, Vulnerability, Data Breach, Supply Chain, Insider, Other

**Severity**:
- Low (score 1–3)
- Medium (score 4–6)
- High (score 7–25)

**Search**:
- Type a keyword to search across risk descriptions and categories

**Checklist Status**:
- Not Started (no checklist attached or not begun)
- In Progress (checklist started but not complete)
- Done (all checklist items completed)

### Applying Filters

1. Check the boxes next to the values you want to filter
2. The risk list, matrix, and charts update instantly
3. A **"Filters Applied"** indicator appears at the top
4. Click **"Clear Filters"** to reset

---

## 6. Exporting & Sharing

### What Can You Export?

**CSV**:
- All risks (all columns)
- Downloadable for Excel, Google Sheets, or data analysis tools

**PDF**:
- Includes a summary page with key statistics
- Risk matrix (heat map)
- Distribution and trend charts
- Optional maturity radar (if enabled)
- Full risk table
- Checklist details (if any)

**PNG (Charts Only)**:
- Save individual charts for presentations
- Use in slide decks or board materials

### Export Best Practices

1. **Clear filters** before exporting to include all risks (or export with specific filters for targeted reports)
2. **Export PDF** for board/audit reports (most professional format)
3. **Export CSV** for data analysis or external tools
4. **Screenshot charts** for quick sharing (no file download needed)

---

## 7. Settings & Customization

### Visualization Settings

**Enable/Disable Score History**:
- If enabled, snapshots of risk scores are stored over time (needed for trend charts)
- If disabled, trend charts are unavailable (but frees up storage space)

**History Retention**:
- **Keep last N days**: Automatically removes snapshots older than X days (default: 365)
- **Keep last N snapshots per risk**: Keeps only the N most recent snapshots per risk (default: 50)

**Default Trend View**:
- Choose whether trend charts show overall organization exposure or recently changed risks

**Maturity Framework**:
- Choose default framework for new assessments (ACSC or NIST)
- Can select a different framework when creating each assessment

**Enable Maturity Feature**:
- Turn the maturity radar on/off (disabled by default to reduce clutter)

---

## 8. Accessibility Features

Easy Risk Register is designed to be accessible to all users:

- **Keyboard navigation**: Use Tab to move between elements, Enter to select
- **Screen reader support**: All content readable with screen readers (NVDA, JAWS, VoiceOver)
- **Color-independent**: Information is never conveyed by color alone (all charts have text labels)
- **Contrast**: Text meets WCAG AA standards for readability
- **Mobile-friendly**: Works on phones and tablets with full functionality

### Keyboard Shortcuts

- **Tab**: Move to next element
- **Shift+Tab**: Move to previous element
- **Enter/Space**: Activate button or select option
- **Arrow keys**: Navigate within matrix or lists (where applicable)
- **Escape**: Close dialogs or cancel actions

---

## 9. Tips & Best Practices

### For Risk Managers

1. **Review monthly**: Schedule a regular review to update risk scores and trends
2. **Use templates**: Start new risks from cyber risk templates to save time
3. **Track mitigation**: Update probability/impact as controls are implemented
4. **Archive closed risks**: Mark risks as "Closed" when they no longer apply
5. **Monitor trends**: Review the trend chart quarterly to identify patterns

### For Leadership

1. **Focus on High severity**: Use the matrix to identify top priorities
2. **Request exports**: Ask risk manager for monthly PDF reports
3. **Watch trends**: Track the trend chart to assess program effectiveness
4. **Use for strategy**: Maturity assessments help identify 3–5 year improvement roadmap

### For Compliance Teams

1. **Checklist discipline**: Use compliance checklists for incident response
2. **Export for audits**: Include matrix and maturity radar in audit reports
3. **Document decisions**: Add notes to risks and maturity domains
4. **Version control**: Export PDFs periodically as evidence of ongoing management

---

## 10. Troubleshooting

### "My filters are not working"

- **Check filter panel**: Ensure you've checked the boxes for the values you want
- **Clear and reapply**: Click "Clear Filters" and start over
- **Refresh page**: Sometimes caching can interfere

### "Charts are not updating"

- **Manual refresh**: Charts update automatically; if stuck, refresh the page
- **Data check**: Ensure you have at least 2–3 risks in the filtered set
- **History enabled**: Trend charts require score history to be enabled (check Settings)

### "Maturity radar is not visible"

- **Enable in Settings**: Check Settings > Visualizations > "Enable maturity feature"
- **Create assessment**: Click "New Assessment" to start your first maturity review

### "Export is taking a long time"

- **Large dataset**: Exporting 1000+ risks may take 1–2 seconds
- **Try CSV first**: CSV exports faster than PDF
- **Check browser**: Using an older browser? Try a modern browser (Chrome, Firefox, Edge)

---

## 11. FAQ

**Q: Can I undo a risk deletion?**
A: No. Deletions are permanent. Be careful when deleting. Consider marking as "Closed" instead if you may need the record later.

**Q: Does my data leave my device?**
A: Yes. Core risk register data is stored in Supabase (Postgres) and accessed via `/api/*`. Your data stays within your Supabase project and is workspace-scoped (enforced by RLS).

**Q: How long is my data kept?**
A: Your risks are kept in Supabase until deleted. Clearing browser storage usually signs you out and resets local preferences, but it does not delete server data.

**Q: Can I share my risk register with a team member?**
A: Yes, if both users are members of the same workspace in Supabase. The UI currently ships as single-workspace-first (no invite/switcher UX yet), so workspace membership is typically managed via Supabase admin tooling.

**Q: How do I back up my data?**
A: Export to CSV or PDF regularly. Store files securely (email, cloud drive, or local backup).

**Q: Can I import risks from another tool?**
A: Yes, if you export them to CSV format first. The CSV must match the Easy Risk Register column structure.

---

## Support & Feedback

For questions or feedback:
- Check the help tooltips in the app (hover over `?` icons)
- Review the Product Requirements Document (PRD) in the docs folder
- Report bugs or suggest features on the project GitHub

---

**Last Updated**: January 2025  
**Version**: 1.0 (Phase 6)
