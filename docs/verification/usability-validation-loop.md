# Verification: Usability validation loop

This is a lightweight runbook for completing the Phase 5 usability validation loop.

Primary guide (scripts + templates + metrics collection):
- `docs/guides/product/usability-validation-loop.md`

Results write-up template:
- `docs/verification/usability-validation-results-template.md`

## Goal

Run **5–10** SME usability sessions and produce a short write-up that includes:
- Quantitative outcomes (time-to-first-risk, template/export adoption)
- Top issues (ranked) + recommended fixes
- Any product requirement updates needed

## Checklist (per session)

- [ ] Confirm participant persona + context (industry, size band, role).
- [ ] Ask participant to avoid real customer data (use placeholders).
- [ ] Enable metrics (open app with `?metrics`, then click **Metrics** once).
- [ ] Run tasks A–D (create risk, template, find top risks, export).
- [ ] Capture “think aloud” quotes and friction points.
- [ ] At end: **Metrics → Copy JSON** and store in your notes/ticket/spreadsheet.
- [ ] Ask participant to **Clear** and **Disable analytics** (optional but recommended).

## Consolidation (after all sessions)

- [ ] Summarize completion rates for tasks A–D.
- [ ] Summarize metrics from each session’s Metrics JSON:
  - Sessions with created risk
  - Median time-to-first-risk
  - Template adoption rate
  - Export counts (CSV/PDF/PNG)
- [ ] Rank issues by (impact × frequency); propose fixes and owners.
- [ ] Update `TASK_PLAN.md` with any follow-up items and mark the verify checkbox done when complete.
