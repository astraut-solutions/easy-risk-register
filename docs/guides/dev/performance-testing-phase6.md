/**
 * Phase 6 — Performance Testing Guide
 * Performance Verification with ~1000 Risks + Bounded History
 *
 * This guide outlines performance benchmarks and testing procedures
 * to ensure the Easy Risk Register dashboard remains responsive
 * with large datasets.
 */

# Phase 6 — Performance Testing Guide

## Objectives

Ensure that the Easy Risk Register remains responsive and performant when handling:
- Up to ~1000 concurrent risks
- Bounded risk score history (snapshots)
- Multiple active filters
- Real-time chart rendering and updates
- Seamless interaction across matrix, dashboard, and table views

## Key Performance Metrics

### Target Metrics

| Metric | Target | Acceptable | Warning |
|--------|--------|-----------|---------|
| **Matrix Render Time** | < 100ms | < 200ms | > 200ms |
| **Dashboard Charts Render** | < 300ms | < 500ms | > 500ms |
| **Filter Application** | < 50ms | < 100ms | > 100ms |
| **Snapshot Retention** | < 50ms | < 100ms | > 100ms |
| **Maturity Radar Render** | < 200ms | < 400ms | > 400ms |
| **CSV Export** | < 1000ms | < 2000ms | > 2000ms |
| **Initial Load** | < 1000ms | < 2000ms | > 2000ms |
| **UI Responsiveness** | No jank (60 FPS) | 60 FPS average | < 30 FPS |

### Memory Metrics

| Metric | Target | Acceptable |
|--------|--------|-----------|
| **Local Storage Usage** | < 2MB | < 5MB |
| **Heap Size (idle)** | < 20MB | < 40MB |
| **Heap Size (rendering charts)** | < 50MB | < 100MB |

## Performance Testing Procedures

### 1. Load Testing Setup

#### Generate Test Data

```bash
# Option A: Use app's seed function with 1000 risks
# In Settings > Demo Data, modify to generate larger set or use manual seed
npm run test:perf

# Option B: Programmatic generation (if test utility exists)
# Load app with custom test harness generating 1000+ risks
```

#### Test Data Characteristics

```json
{
  "riskCount": 1000,
  "snapshotsPerRisk": 50,
  "filterDistribution": {
    "statusRatio": [0.5, 0.3, 0.2],
    "categoryRatio": [0.4, 0.3, 0.3],
    "threatTypeRatio": "evenly distributed across 9 types",
    "severityRatio": [0.2, 0.5, 0.3]
  },
  "checklistAttachmentRate": 0.3
}
```

### 2. Benchmark Tests

#### 2.1 Matrix Render Performance

**Test**: Open matrix view with 1000 risks (no filters)

```
Steps:
1. Load app with 1000 seeded risks
2. Navigate to "Executive overview" (matrix view)
3. Measure time from view mount to first interaction
4. Record FPS during initial render
5. Apply random filters and measure re-render time
```

**Expected Results**:
- Initial render: < 100ms
- Filter re-render: < 50ms
- Frame rate: ≥ 50 FPS during interaction

**Tools**:
```javascript
// In browser DevTools Performance tab:
performance.mark('matrix-mount-start')
// ...mount matrix component
performance.mark('matrix-mount-end')
performance.measure('matrix-render', 'matrix-mount-start', 'matrix-mount-end')
console.log(performance.getEntriesByName('matrix-render')[0].duration)
```

#### 2.2 Dashboard Charts Performance

**Test**: Open dashboard with 1000 risks + full history

```
Steps:
1. Navigate to "Dashboard charts" view
2. Measure chart render time (distribution + trend)
3. Apply filters and measure chart re-render
4. Switch between chart types (if available)
5. Monitor memory usage during rendering
```

**Expected Results**:
- Distribution chart render: < 200ms
- Trend chart render: < 300ms
- Filter re-render: < 100ms
- No memory leaks (heap doesn't continuously grow)

#### 2.3 Filter Application Performance

**Test**: Apply/clear filters with various complexity

```javascript
// Pseudo-code for test harness
const risks = generateTestRisks(1000)
const filterStart = performance.now()

// Complex filter: multiple categories + statuses + threat types
applyFilter({
  categories: ['Cyber Security', 'Operational', 'Strategic'],
  statuses: ['open', 'mitigated'],
  threatTypes: ['phishing', 'ransomware', 'malware'],
})

const filterDuration = performance.now() - filterStart
console.log(`Filter application: ${filterDuration}ms`)
// Expected: < 50ms
```

#### 2.4 Snapshot Retention Performance

**Test**: Apply retention policy to large snapshot set

```javascript
const snapshots = generateTestSnapshots(1000 * 50) // 1000 risks × 50 snapshots
const retentionStart = performance.now()

const retained = applySnapshotRetention(snapshots, {
  mode: 'days',
  value: 365,
})

const retentionDuration = performance.now() - retentionStart
console.log(`Snapshot retention: ${retentionDuration}ms`)
// Expected: < 50ms
```

#### 2.5 Maturity Radar Performance

**Test**: Render radar with multiple assessments

```
Steps:
1. Enable maturity feature in settings
2. Create 1-3 maturity assessments (ACSC + NIST)
3. Measure radar render time
4. Update domain scores and measure re-render
5. Export radar as PNG
```

**Expected Results**:
- Radar render: < 200ms
- Domain score update re-render: < 100ms
- PNG export: < 500ms

#### 2.6 Table View Performance

**Test**: Large risk table with 1000 rows + sorting/filtering

```
Steps:
1. Navigate to "Risk table" view
2. Measure initial table render time
3. Apply sort (by risk score, status, etc.)
4. Apply filter to reduce rows
5. Scroll through table (measure scroll smoothness)
6. Test pagination (if implemented)
```

**Expected Results**:
- Table render (virtualized): < 100ms
- Sort application: < 50ms
- Scroll frame rate: ≥ 50 FPS
- Filter + sort: < 100ms combined

### 3. Load Test Scenarios

#### Scenario A: Power User (All Features Enabled)

```
Configuration:
- 1000 risks
- Full history enabled (50 snapshots per risk)
- Multiple maturity assessments (ACSC + NIST)
- All features visible (matrix, dashboard, maturity)
- Frequent filter changes
- Multiple export formats (PDF + PNG)

Measurements:
- Initial load time
- View switching latency
- Filter responsiveness
- Memory usage over 10 minutes

Expected: All metrics within target range
```

#### Scenario B: Mobile User (Bandwidth Constrained)

```
Configuration:
- 500 risks (lower device capacity)
- Touch interactions
- Network throttle: 3G slow (400ms latency)
- Reduced chart complexity

Measurements:
- Time-to-interactive
- Touch responsiveness
- Memory constraints on mobile

Expected: > 30 FPS, < 5MB memory
```

#### Scenario C: Heavy Data Import

```
Configuration:
- Import CSV with 500-1000 risks
- While existing 500 risks already loaded
- Measure import time and post-import lag

Measurements:
- CSV parsing time
- Merge and sort time
- First interaction after import

Expected: < 2s total, responsive immediately after
```

### 4. Memory Profiling

#### 4.1 Baseline Memory Check

```javascript
// Run in browser console
console.log('Baseline heap size:', performance.memory.usedJSHeapSize / 1_000_000, 'MB')

// Generate test data and re-check
generateTestRisks(1000)
console.log('After 1000 risks:', performance.memory.usedJSHeapSize / 1_000_000, 'MB')
```

#### 4.2 Memory Leak Detection

```javascript
// Heap snapshot workflow (Chrome DevTools)
1. Open DevTools > Memory tab
2. Take heap snapshot (baseline)
3. Navigate through views 10 times
4. Take second snapshot
5. Filter by "detached DOM" nodes
6. Compare snapshots (should show minimal growth)

Expected: < 5MB growth after 10 iterations
```

#### 4.3 Profile Chart Rendering

```javascript
// In Performance tab:
1. Record trace during dashboard chart render
2. Look for long tasks (> 50ms)
3. Check for expensive layout recalculations
4. Verify JavaScript execution < 80% of frame budget
```

### 5. Real-world Load Testing

#### 5.1 Sustained Use Test (10 minutes)

```
Steps:
1. Load app with 1000 risks
2. Every 30 seconds: Apply random filter
3. Every 1 minute: Switch views (matrix → dashboard → table)
4. Every 2 minutes: Create a new risk
5. Monitor memory and FPS throughout
6. Measure responsiveness decay (if any)

Success Criteria:
- FPS remains ≥ 30 throughout
- Memory doesn't grow unbounded
- No console errors
- Filters apply consistently
```

#### 5.2 Network Delay Simulation (Export Test)

```
Steps:
1. Throttle network to 3G (Chrome DevTools)
2. Trigger CSV export with 1000 risks
3. Measure export dialog responsiveness
4. Measure file download completeness
5. Measure PDF export time

Expected:
- Export dialog appears immediately
- File downloads complete without timeout
- UI remains responsive during export
```

### 6. Automated Performance Testing

#### 6.1 Jest/Vitest Benchmarks

```javascript
// test/performance/matrix.bench.ts
import { bench } from 'vitest'

bench('Matrix filter application (1000 risks)', () => {
  const risks = generateTestRisks(1000)
  applyFilter(risks, complexFilter)
})

bench('Snapshot retention (50K snapshots)', () => {
  const snapshots = generateTestSnapshots(50000)
  applySnapshotRetention(snapshots, { mode: 'days', value: 365 })
})
```

#### 6.2 Lighthouse CI

```
Configuration: lighthouse-ci-config.json
{
  "ci": {
    "collect": {
      "numberOfRuns": 3,
      "url": "http://localhost:5173"
    },
    "upload": {
      "target": "temporary-public-storage"
    },
    "assert": {
      "preset": "lighthouse:recommended",
      "assertions": {
        "performance": ["error", { "minScore": 0.8 }],
        "categories:performance": ["error", { "minScore": 80 }]
      }
    }
  }
}
```

Run: `npm run lighthouse-ci`

## Test Checklist

### Pre-Testing
- [ ] App builds successfully (`npm run build`)
- [ ] No console errors in production build
- [ ] Test data generation works (`npm run test:seed`)
- [ ] DevTools available and Performance tab accessible
- [ ] Memory profiling tools available (Chrome DevTools or similar)

### Matrix Render
- [ ] Initial render: < 100ms
- [ ] FPS: ≥ 50 during interaction
- [ ] Filter re-render: < 50ms
- [ ] No jank visible

### Dashboard Charts
- [ ] Distribution chart: < 200ms
- [ ] Trend chart: < 300ms
- [ ] Re-render on filter: < 100ms
- [ ] Charts update smoothly
- [ ] No visual stuttering

### Filters & Search
- [ ] Single filter: < 50ms
- [ ] Multiple filters: < 100ms
- [ ] Search (1000 items): < 50ms
- [ ] Clear all filters: < 50ms

### Data Retention
- [ ] Snapshot retention (50K snapshots): < 50ms
- [ ] Retention with mode change: < 100ms
- [ ] No duplicate snapshots

### Memory
- [ ] Idle heap: < 20MB
- [ ] During chart render: < 50MB
- [ ] No growing leaks (10 min test)
- [ ] Local storage < 2MB

### Exports
- [ ] CSV export (1000 rows): < 1s
- [ ] PDF export (1000 rows + charts): < 2s
- [ ] PNG export (chart): < 500ms

### Mobile / Touch
- [ ] Touch interactions responsive
- [ ] Tap drill-down registers quickly
- [ ] Scroll is smooth (≥ 30 FPS)

## Troubleshooting Guide

### Symptom: "Charts take > 500ms to render"

**Diagnosis**:
1. Check chart library version (should be recent)
2. Profile JavaScript execution time
3. Check for N+1 query patterns in data transformation

**Solution**:
- Memoize chart data transformation
- Use React.memo for chart components
- Consider canvas rendering (Plotly/D3) instead of SVG if SVG is slow

### Symptom: "Memory grows during interaction"

**Diagnosis**:
1. Check for event listener leaks
2. Check for closure captures
3. Profile heap snapshots

**Solution**:
- Ensure cleanup in useEffect
- Use useCallback for event handlers
- Profile and identify detached DOM nodes

### Symptom: "Filters are sluggish with 1000 risks"

**Diagnosis**:
1. Check filter logic (O(n²) worst case?)
2. Profile filtering function
3. Check for unnecessary re-renders

**Solution**:
- Optimize filterRisks function (see test/utils/filterRisks.test.ts)
- Implement debouncing for search input
- Use memoization on filtered results

### Symptom: "Initial load takes > 2s"

**Diagnosis**:
1. Check localStorage deserialization time
2. Check initial rendering of large risk list
3. Check for large bundle size

**Solution**:
- Consider lazy loading risk list
- Implement virtual scrolling for table
- Split chunks with code splitting

## Reporting Results

### Performance Test Report Template

```markdown
## Phase 6 Performance Testing Report

**Date**: YYYY-MM-DD
**Environment**: [e.g., MacBook Pro M1, Chrome 120, 16GB RAM]
**Test Data**: 1000 risks, 50K snapshots, 3 maturity assessments

### Results

| Test | Target | Result | Status |
|------|--------|--------|--------|
| Matrix Render | < 100ms | XXms | ✅ PASS |
| Dashboard Charts | < 300ms | XXms | ✅ PASS |
| Filter Application | < 50ms | XXms | ✅ PASS |
| ...more... | | | |

### Memory Profile
- Idle: X MB
- Peak (charts): X MB
- After 10 min: X MB (growth: ±X MB)

### Notes
- [Any observations, failures, or items for investigation]

### Sign-off
- [ ] All metrics within target
- [ ] No console errors
- [ ] Ready for production
```

---

**Next Steps**: Run tests and complete checklist after implementation. Update results above and in [implementation.md](../implmentation.md) Phase 6 section.
