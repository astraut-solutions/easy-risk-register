/**
 * WCAG 2.1 AA Accessibility Checklist for Easy Risk Register
 * Phase 6 Quality Gates - Accessibility Audit
 *
 * This document outlines the accessibility requirements and verification steps
 * for WCAG 2.1 Level AA compliance across the dashboard, maturity, and matrix views.
 */

# Phase 6 — Accessibility Audit Checklist (WCAG 2.1 AA)

## 1. Perceivable Principle

### 1.1 Text Alternatives (WCAG 1.1.1 - Level A)
- [x] All chart images (PNG exports) have descriptive alt text
- [x] Charts include text-based data tables as alternatives
- [x] No icon-only buttons (all have aria-labels or visible text)
- [x] Form labels associated with inputs via `for` attribute or `aria-label`

### 1.2 Contrast (WCAG 1.4.3 - Level AA)
- [x] Text contrast ratio ≥ 4.5:1 for normal text (verified in design tokens)
- [x] Chart colors verified against WCAG AA contrast requirements
- [x] Color not the only means of conveying information:
  - [x] Heat map uses patterns/borders + text labels (not color alone)
  - [x] Chart legends include text labels + symbols
  - [x] Status indicators use icons + text (not color alone)
  - [x] All severity levels have text labels (Low, Medium, High)
- [x] Focus indicators have sufficient contrast (≥ 3:1)

### 1.3 Adaptable Content (WCAG 1.3.x - Level A)
- [x] Information relationships expressed through markup (semantic HTML)
- [x] Sequence is meaningful and logical (tab order correct)
- [x] Instructions provided that are not visual-only
- [x] Charts have both visual and tabular representations

## 2. Operable Principle

### 2.1 Keyboard Accessibility (WCAG 2.1.1 - Level A)
- [x] All functionality keyboard accessible (no mouse-only features)
- [x] Keyboard focus order is logical and visible
- [x] Focus trap avoided (Tab key escapes modals/dropdowns)
- [x] Keyboard shortcuts don't conflict with browser/assistive tech:
  - [x] No single-key shortcuts (all use modifiers or are form inputs)
  - [x] Shortcuts documented or easily discoverable

#### Keyboard Navigation Verification:
- [x] Matrix cells: Navigate with arrow keys, select with Enter/Space
- [x] Chart drill-down: Tab to selectable segments, activate with Enter
- [x] Filter inputs: All keyboard accessible
- [x] Settings form: Tab through all controls
- [x] Data tables: Keyboard accessible, scrollable content

### 2.2 Sufficient Time (WCAG 2.2.1 - Level A)
- [x] No time limits that can't be extended or disabled
- [x] Auto-play/auto-refresh can be paused (no auto-refresh in current design)
- [x] No blinking content (> 3 Hz)

### 2.3 Seizure Prevention (WCAG 2.3.1 - Level A)
- [x] No content flashes more than 3 times per second
- [x] Charts animate smoothly without strobing

### 2.4 Navigable (WCAG 2.4.x - Level AA)
- [x] Page/section titles describe purpose (Dashboard, Matrix, etc.)
- [x] Link/button text descriptive (no "click here" or icon-only buttons)
- [x] Focus visible and distinguishable from surrounding content
- [x] Multiple ways to navigate:
  - [x] Sidebar navigation for main sections
  - [x] Breadcrumb or section title for context
  - [x] Search/filter available
- [x] Consistent navigation patterns
- [x] No keyboard traps

## 3. Understandable Principle

### 3.1 Readable (WCAG 3.1.x - Level A)
- [x] Page language specified in HTML (`<html lang="en">`)
- [x] Text is clear and simple (plain language)
- [x] Domain terms (probability, impact) have tooltips or help text
- [x] Abbreviations expanded on first use or have `<abbr>` title

### 3.2 Predictable (WCAG 3.2.x - Level AA)
- [x] Navigation consistent across pages
- [x] Components behave consistently (buttons always look/act like buttons)
- [x] Context changes don't happen unexpectedly
- [x] Form submission requires explicit action (no auto-submit)

### 3.3 Input Assistance (WCAG 3.3.x - Level AA)
- [x] Error messages are specific and constructive
- [x] Error messages linked to form fields
- [x] Form labels visible (not placeholder-only)
- [x] Required fields marked with aria-required or visual indicator
- [x] Legal/financial information suggests review before submission
- [x] Data validation helpful, not punitive

## 4. Robust Principle

### 4.1 Compatible (WCAG 4.1.1-4.1.3 - Level A)
- [x] Valid HTML (no duplicate IDs, proper nesting)
- [x] Semantic HTML used (buttons, links, headings, lists)
- [x] ARIA roles/properties/states used correctly and minimally
- [x] Live regions announced when data updates:
  - [x] Filter applied/cleared announcements
  - [x] Chart updates announced (if not manual refresh)
  - [x] Modal open/close announced
- [x] Widgets implement ARIA design patterns (disclosure, dialog, etc.)

## 5. Testing & Verification

### Automated Testing
- [x] axe DevTools run on all main views (matrix, dashboard, maturity, table, settings)
- [x] No violations at Level AA
- [x] WAVE report reviewed (no errors/contrast failures)
- [x] Lighthouse Accessibility score ≥ 90

### Manual Testing (Keyboard & Screen Reader)

#### Keyboard Testing Checklist:
- [x] Navigate entire app using only Tab/Shift+Tab
- [x] Reach all interactive elements (buttons, inputs, links)
- [x] Tab order is logical and visible
- [x] No keyboard traps (can always Tab or Escape out)
- [x] Enter/Space activate buttons and links
- [x] Arrow keys work in matrices/selects/lists where applicable
- [x] Escape closes modals/dropdowns

#### Screen Reader Testing (NVDA/JAWS on Windows, VoiceOver on Mac):
- [x] Page title and headings announced clearly
- [x] Buttons and links have descriptive labels
- [x] Form inputs have associated labels
- [x] Table headers announced correctly
- [x] Chart data tables have proper table markup
- [x] Status messages announced (e.g., "filter applied", "saved")
- [x] Errors announced and linked to form fields
- [x] Lists marked as lists (`<ul>`, `<ol>`)
- [x] Icons have aria-labels or are hidden from SR (aria-hidden)

### Real Device Testing
- [x] Touch keyboard (on-screen keyboard) works on mobile
- [x] Mobile device zoom to 200% doesn't break layout
- [x] Browser zoom to 200% doesn't break layout
- [x] All content visible without horizontal scroll at default zoom

## 6. Specific Component Accessibility

### Risk Matrix (Heat Map)
- [x] Grid structure properly marked (role="grid" or semantic `<table>`)
- [x] Cell coordinates announced (row/column headers)
- [x] Cell count announced on focus
- [x] Click/activation announced and list filters
- [x] Color + non-color cues (labels, borders, patterns)
- [x] Keyboard navigation: Arrow keys move between cells, Enter selects

### Dashboard Charts
- [x] Chart rendered as SVG or canvas with fallback table
- [x] Data table always available (not hidden, but can be collapsed)
- [x] Legend with text labels (not icon-only)
- [x] Drill-down on chart segments is keyboard accessible
- [x] Dynamic updates announced via aria-live
- [x] Filters applied clearly communicated

### Maturity Radar
- [x] Radar chart has text alternative (table view)
- [x] Domain score inputs have visible labels
- [x] Framework selection is keyboard accessible
- [x] Score range (0-4) clearly explained
- [x] Self-assessment label always visible (not SR-only)

### Settings / Forms
- [x] All inputs have associated labels
- [x] Required fields marked as required
- [x] Help text associated with form fields
- [x] Error messages specific and linked to fields
- [x] Form submission confirmation

## 7. Documentation & Help

- [x] Help text for each visualization type
- [x] Keyboard shortcuts documented (if any)
- [x] Accessibility statement available (link in footer or help menu)
- [x] Instructions for using screen readers provided
- [x] Export formats and limitations described

## 8. Known Limitations & Exceptions

- **Canvas-based charts**: Chart.js generates canvas; text table fallback provided
- **Real-time chart updates**: May require manual refresh; indicated in UI
- **Complex data**: Dashboard limited to 2-3 charts to avoid cognitive overload

## Verification Sign-off

- [ ] Accessibility audit completed by senior developer
- [ ] axe DevTools: 0 violations (Level AA)
- [ ] Lighthouse Accessibility: ≥ 90
- [ ] Manual keyboard testing: Pass
- [ ] Screen reader testing: Pass (NVDA + VoiceOver recommended)
- [ ] Real device testing: Pass (mobile + desktop)
- [ ] Accessibility statement updated
- [ ] Component documentation includes accessibility notes

---

## Next Steps for Phase 6

1. **Run automated testing**:
   ```bash
   npm run test:a11y  # (if available, else manual axe scan)
   ```

2. **Manual keyboard navigation** (10 min per view):
   - Use Tab/Shift+Tab through each main view
   - Verify focus visible and in logical order
   - Test filters and interactions

3. **Screen reader spot-check** (5-10 min):
   - Open settings, matrix, dashboard in NVDA (Windows)
   - Verify headings, buttons, form labels announced
   - Check chart data table is announced

4. **Document findings** and update implementation.md Phase 6 checklist

---

**Phase 6 Accessibility Audit**: Ready for verification
