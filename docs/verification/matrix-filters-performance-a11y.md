# Matrix + Filters: Performance & A11y Verification

This note captures the lightweight checks to validate the “up to 1000 risks” target and an accessibility quick pass for the matrix + filters.

## Performance (up to 1000 risks)

**Automated (recommended, repeatable):**
- Run the focused performance tests:
  - `cd easy-risk-register-frontend`
  - `npm run test:run -- test/performance/performance.test.ts -t "Matrix Render Performance"`
- Targets are encoded in the test expectations:
  - Simple filter application: `< 50ms`
  - Complex multi-filter: `< 100ms`

**Manual (browser instrumentation):**
- Open the app with a workspace that has ~1000 risks.
- In Chrome/Edge DevTools:
  - Performance tab: record while toggling filters and clicking matrix cells.
  - Verify interactions stay responsive and the UI does not “lock up” (long tasks).
- Check network payload size when syncing risks:
  - Risks list request uses `limit=1000` so matrix/table can render a full workspace snapshot in one request for MVP.

## Accessibility quick pass (matrix + filters)

**Automated smoke (fast):**
- Run the a11y smoke test:
  - `cd easy-risk-register-frontend`
  - `npm run test:run -- test/a11y/matrix-filters.a11y.test.tsx`

**Manual spot check (keyboard + semantics):**
- Matrix:
  - Tab lands on the grid; Arrow keys move between cells.
  - Enter activates a populated cell and drills down to the filtered table.
  - Legend is not color-only (labels + border styles).
- Filters:
  - All controls are reachable by keyboard.
  - Active filter chips have clear accessible names (e.g. "Remove filter: Category: Security").

## Cross-browser spot check (recommended)

If Playwright browsers are available locally, smoke the key flow in:
- Chromium/Chrome
- Firefox
- WebKit/Safari (macOS)

Minimum checklist:
- Load overview → click matrix cell → confirm table shows filtered results.
- Apply category/status filters → verify matrix counts and table stay in sync.
- Apply threat type + checklist status filters → verify overview KPIs, matrix counts, risk table, and dashboard drill-down reflect the same filtered set.
- Keyboard navigation works as expected in each browser.
