# Usability validation loop (SME interviews + lightweight metrics)

This guide is a practical kit for running **5–10 usability sessions** with Australian SMEs and capturing **privacy-respecting** success metrics such as **time-to-first-risk** and **export adoption**.

Scope:
- Works with the app’s **local-only** UX instrumentation (opt-in; stored in the participant’s browser).
- Produces repeatable qualitative notes + a consistent metrics export payload for later comparison.

## Principles (privacy-first)

- **No background telemetry**: analytics are **opt-in** and stored locally in the browser.
- **No sensitive payloads**: metrics events are **redacted** and should not include risk descriptions, mitigation text, passphrases, tokens, emails, or titles.
- **Participant control**: the participant can disable analytics and clear events at the end of the session.

Recommendation:
- Do not record screen/audio unless you have explicit consent.
- If recording, avoid capturing passwords and consider using a test workspace/account.

## Session plan (45 minutes)

### 0) Prep (facilitator, before the call)

- Decide the test environment:
  - **Preferred**: a hosted environment (Vercel) with Supabase configured.
  - **Alternative**: local dev build, if the participant can run it.
- Create a test user account (or a small set of accounts) and a clean workspace.
- Prepare a “scenario card” (below) you can paste into chat.
- Decide if you will allow templates:
  - Run at least one session with **templates enabled** to measure adoption.
  - Run at least one session “from scratch” to measure baseline form usability.

### 1) Intro script (2 minutes)

Say:
1. “We’re testing the product, not you.”
2. “Please think out loud. If something is confusing, that’s valuable.”
3. “We’ll collect **optional local-only metrics** (time-to-first-risk, exports) that are **redacted** and can be cleared after.”
4. “Avoid entering real customer data; use placeholders.”

### 2) Enable metrics (1 minute)

Ask the participant to:
- Open the app with `?metrics` in the URL (this reveals the **Metrics** button), then
- Click **Metrics** → this enables analytics and opens the export modal.
- Close the modal and proceed with tasks.

At the end, you’ll ask them to open **Metrics** again and **Copy JSON**.

### 3) Tasks (30 minutes)

Run tasks in order. Don’t help immediately—wait for hesitation, then ask a neutral prompt.

#### Task A — Create a first risk (baseline)

Scenario card (paste into chat):
- Title: “Phishing email leads to credential theft”
- Category: choose what feels right
- Likelihood/Impact: choose what feels right
- Owner: “Alex”
- Due date: pick a date ~2 weeks from now
- Mitigation: placeholder text is fine

Success criteria:
- Participant creates a risk without facilitator intervention.
- Participant understands the live score and severity signal.

Prompts:
- “What do you expect to happen when you click Add risk?”
- “What does ‘severity’ mean to you here?”
- “If you had to explain this score to a manager, what would you say?”

#### Task B — Create a risk from a template (template adoption)

Ask:
- “Now create another risk, but use a template this time.”

Success criteria:
- Participant finds the template workflow.
- Participant can edit prefilled fields confidently.

Prompts:
- “What made you pick that template?”
- “Did the template save time, or create extra work?”

#### Task C — Find the “top risks” quickly (executive scanability)

Ask:
- “Imagine you have 60 seconds before a leadership meeting. Show me the highest risks and how you know.”

Success criteria:
- Participant uses filters/table/matrix effectively.
- Participant can articulate what “top” means (severity, due soon, category).

Prompts:
- “Where would you click first?”
- “What’s missing to make this ‘board-ready’?”

#### Task D — Export something to share (export adoption)

Ask:
- “Export something you’d send to a manager. Choose CSV or PDF—your call.”

Success criteria:
- Participant can find export actions and complete export without confusion.
- Participant understands print-to-PDF vs download PDF.

Prompts:
- “Why did you choose that export?”
- “If you got this file, what would you do with it next?”

Optional Task E — Attach privacy incident checklist (if time)

Ask:
- “If you had a data breach, what would you want to do next? Show me what the app offers.”

## Debrief questions (8 minutes)

Ask:
- “What was easiest?”
- “What was hardest or most surprising?”
- “If you could change one thing, what would it be?”
- “Would you use this monthly? What would trigger you to come back?”
- “Would you pay for this? What’s the value driver?”

## Metrics capture plan (local-only)

### What we measure

Primary success metrics (aligned to PRD):
- **First-session completion rate**: % of sessions with at least one created risk.
- **Time to first value**: median time from session start → first risk created.
- **Template adoption**: % of created risks created via a template.
- **Export adoption**: count of CSV/PDF/PNG exports in-session (and optionally within 7 days via follow-up).

### How to collect (per session)

At the end of the session, ask the participant to:
1. Click **Metrics**
2. Click **Copy JSON**
3. Paste into your notes/ticket/spreadsheet row for that session
4. Click **Clear**
5. Click **Disable analytics**

### Suggested tracking sheet columns

- Session date/time
- Participant persona (owner / ops / IT / compliance)
- Context (industry, company size band)
- Task completion (A/B/C/D): pass/partial/fail
- Time-to-first-risk (from Metrics summary)
- First-session completion rate contribution: yes/no
- Template used: yes/no
- Export completed: CSV/PDF/print/none
- Top 3 usability issues (free text)
- Top 3 “delight” moments (free text)
- Follow-up requested? (yes/no)

### 7-day export adoption (optional follow-up)

If you want to align to “export within 7 days”:
- Schedule a short follow-up email asking them to export once in the next week and paste the Metrics JSON again.
- Alternatively, do a 10-minute follow-up call and capture the second export.

## Moderator note-taking template (copy/paste)

Participant:
- Persona:
- Context (size/industry):

Task A (first risk):
- Outcome:
- Friction:
- Quotes:

Task B (template):
- Outcome:
- Friction:
- Quotes:

Task C (top risks):
- Outcome:
- Friction:
- Quotes:

Task D (export):
- Outcome:
- Friction:
- Quotes:

Debrief:
- Biggest value:
- Biggest missing piece:
- Would use monthly? Why/why not:

Metrics JSON:
```json
{ "paste_here": true }
```

## Triage rubric (after sessions)

Use a simple 2-axis rubric:
- **Impact** (blocks completion / slows completion / cosmetic)
- **Frequency** (1 user / some users / most users)

Prioritize:
1) Issues that block “first risk created”
2) Issues that block “find top risks fast”
3) Issues that block “export to share”

