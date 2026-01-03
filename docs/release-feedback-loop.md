# Release & Feedback Loop

## Feedback prompt
- Surface a lightweight, dismissible prompt in the Executive Overview after a user completes their first risk or export flow in a session. The prompt asks "How clear was that experience?" with a 1-5 emoji scale plus an optional text field for what could be improved. Persist the answer via the same analytics service that already records metrics, and show a short confirmation that the response helps shape the next release.

## Event tracking
- Track `risk.first-create` (time delta from first product load to risk save) to align with the "time-to-first-risk <= 5 minutes" success metric.
- Track `risk.batch-export` completion/failure, `risk.export.format` (CSV/PDF/Dashboard) and success codes so we can hit the 95% export success target.
- Track `feedback.prompt-shown`/`subscribed`/`response` to understand how often the prompt renders and how often folks share clarity data, feeding the perceived clarity KPI.
- Track `usability.session-scheduled` and `usability.session-feedback-captured` so we can tie session outcomes back to the friction log.

## Usability sessions
- Recruit 5-10 participants from the core SME personas (owner/operator, ops lead, compliance lead) with a brief screener on workload and compliance familiarity.
- Run 15-20 minute moderated remote sessions guided by the same tasks used in the baseline: create a new risk, export a report, and interpret the Overview cards. Capture audio/video (with consent) plus timestamped notes in the shared Notion log and tag the findings with success metrics (time-to-first-risk, completion rate, clarity).
- After each session, log the top friction scorecard in the `usability-feedback` table (what confused them, where they hesitated, what they liked). Highlight emerging patterns after the first five sessions to validate whether new participants surface novel issues.

## Iterating the top friction points
- Maintain a ranked list of friction points in `docs/feedback-log.md` (or other shared tracker) that links each issue to the supporting session(s) and related success metric.
- Prioritize the top three issues by frequency and metric impact; assign owners, outline acceptance criteria, and estimate effort in the sprint.
- Ship fixes incrementally (clearer copy, layout tweaks, automated hints) and re-measure via the tracked events and a brief "post-release clarity" pulse email to the session participants so we can confirm the intended improvements reduce friction.
