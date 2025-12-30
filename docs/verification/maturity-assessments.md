# Verification: Maturity Assessments (Radar + Table + Exports)

Scope: verify the maturity self-assessment feature is clearly labeled as **self-assessment only** (not certification/compliance) and works accessibly with correct exports.

## 1. Copy and presets (deploy readiness)

- [ ] Framework labels use **"(inspired)"** wording and avoid implying certification (ACSC/NIST).
- [ ] UI copy includes a clear disclaimer: **self-assessment only** (not certification/compliance/legal advice).
- [ ] PDF/print report includes the disclaimer and does not claim compliance.
- [ ] Domain names match the product requirements (ACSC Essential Eight-inspired domains; NIST CSF-inspired domains).

## 2. Data and history

- [ ] Creating an assessment persists it to the current workspace.
- [ ] Updating a domain score persists and is reflected after refresh.
- [ ] Multiple assessments can be created and selected (series).
- [ ] Deleting an assessment removes it (and it does not reappear after refresh).

## 3. Accessibility checks

### Keyboard-only
- [ ] Can navigate to **Maturity radar** view via keyboard.
- [ ] Can create an assessment, select an assessment, and change scores using only keyboard.
- [ ] Focus states are visible for action buttons and score inputs.

### Screen reader / non-visual fallback
- [ ] Radar chart section includes a visible self-assessment disclaimer.
- [ ] Table fallback is available and includes domain names + scores (usable without the chart).
- [ ] Score inputs have accessible names (via label text and/or table context).

## 4. Export correctness

### PNG
- [ ] **Export PNG** downloads a file and the image is legible (not blank/transparent).
- [ ] Output resolution is suitable for reporting (default 1080p).

### PDF / print report
- [ ] **Export PDF** opens a print-friendly report window.
- [ ] Report includes: generated timestamp, preset label, radar chart image, and domain scores table.
- [ ] Report includes the disclaimer and does not claim certification/compliance.

## 5. Suggested quick automated checks

- Run `cd easy-risk-register-frontend && npm run test:run` and confirm the maturity report HTML tests pass.
