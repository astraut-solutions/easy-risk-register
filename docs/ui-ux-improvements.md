# UI/UX Improvements (Full UI/UX Review)

This document is a practical, end-to-end UI/UX review of Easy Risk Register’s current experience, with a single “north star” solution and clear steps to implement it.

The goal: **a delightful, intuitive, trust-building product** that feels clear even to a non-designer.

---

## 1) The “One Outstanding Solution”

### Design direction: Trust-First Risk Capture

Make the app feel like a calm, guided workspace where the user always knows:
1) **What’s important right now**
2) **What to do next**
3) **What will happen if they click**

This is achieved with a simple hierarchy:
- **Level 1: Executive clarity** (overview + “what needs attention”)
- **Level 2: Operational control** (filters + table + matrix drill-down)
- **Level 3: Deep detail** (risk record, evidence, checklists, playbooks, audit trail)

---

## 2) What’s Working Well (Keep + Double Down)

- **Clear IA foundation**: sidebar + mobile nav, distinct “views” (overview, dashboard charts, maturity, table, new, settings).
- **Helpful safety cues**: offline/read-only messaging and workspace scoping cues (privacy-first narrative + auth state).
- **Strong core workflow**: “New risk” stays in-context; draft saving reduces fear of losing work.
- **Accessibility intent is present**: skip link, keyboard support in matrix, labeled controls in key places.
- **Design tokens exist**: Tailwind theme tokens and a documented design system are great for scaling.

---

## 3) Biggest Friction (Pain Points)

### A) Too many primary actions at the top
Header currently exposes several actions at once (create, multiple exports, import, metrics, auth). For new users, this feels like “a control panel,” not a guided product.

**User impact**: choice overload → slower time-to-first-risk → lower confidence.

### B) Visual inconsistency in advanced dashboards
Some dashboards use custom design-system components, while others pull in Ant Design tables/tags and inline color values.

**User impact**: inconsistent look/feel → weaker brand trust; inconsistent accessibility/focus behavior.

### C) Trust and “data safety” isn’t always visible at the moment of action
“Privacy-first” is a strong positioning, but users still need quick, in-context answers:
- Where is this data saved?
- Am I offline?
- Is this field encrypted?
- Who can see this?

**User impact**: uncertainty → user hesitates → fewer records captured.

### D) Modals and complex screens need stronger guidance rails
- Risk creation is powerful, but long forms can feel intimidating.
- Users benefit from progressive disclosure (simple first, advanced later).

---

## 4) UX Improvements (High ROI, Modern, Scalable)

### Improvement 1: “One Primary CTA” rule (reduce cognitive load)

**Keep only one primary action in the header**:
- Primary: **New risk**
- Secondary: a single **Export** button that opens a small menu (CSV, PDF, Dashboard PDF)
- Tertiary: Import + Metrics + Auth (icons or subdued)

This keeps the app feeling calm and intentional.

### Improvement 2: Add a “Now” panel (emotion + momentum)

On the overview screen, add a simple “Now” row:
- **Overdue reviews**
- **Due soon**
- **High risks**
- **Recently changed**

Each item is a one-click drill-down to the table with filters applied.

### Improvement 3: Make trust cues visible in the UI chrome

Add a small “trust strip” near the header (or inside the sidebar header):
- Status chip: **Online / Offline**
- Workspace chip: **Personal / Workspace name**
- Privacy chip: **Encrypted fields locked/unlocked** (when applicable)

This builds confidence without adding heavy text.

### Improvement 4: Progressive disclosure in the risk form

Split the risk form into clear sections:
1) **Basics** (title, category, status)
2) **Score** (likelihood + impact)
3) **Plan** (response, mitigations, owner, due date, review)
4) **Evidence & extras** (attachments, checklists, playbooks, notes)

Default open: Basics + Score. Others collapsed, with clear “Optional” labels.

### Improvement 5: Standardize the UI kit (one system)

Choose one:
- **A)** Commit to the custom Tailwind design system and remove Ant Design UI components in product surfaces.
- **B)** Keep Ant Design but wrap it in your design tokens and enforce consistent component usage.

Option A is generally better for brand cohesion and long-term design control.

---

## Executive Dashboard

What “great” looks like here: a dashboard that answers in 10 seconds:
- What’s our risk posture today?
- What needs attention next?
- Are we improving over time?

Implementation idea: keep “Executive overview” lightweight (KPIs + a simple trend + top risks), and push deeper analytics into “Dashboard charts” for power users.

## Information Hierarchy & Progressive Disclosure

Use a “simple first” layout everywhere:
- Show the smallest set of actions and info needed to proceed.
- Reveal advanced options only when the user asks (collapsed sections, “Optional” groups, “Advanced” toggles).

The risk form is the best place to apply this (Basics → Score → Plan → Evidence).

## Color-Coded Risk Levels

Keep severity colors consistent across:
- Cards
- Badges
- Charts
- Matrix cells

And never rely on color alone: always pair color with a label (Low/Medium/High) or an icon.

## Mobile Responsiveness

Aim for “thumb-first” behavior:
- Primary CTA stays reachable (sticky bottom or top-right, depending on the layout).
- Navigation becomes predictable (bottom nav or compact tabs).
- Tables degrade gracefully (key columns + “View” for full detail).

## Accessibility Features

Baseline: WCAG 2.1 AA
- Keyboard-first flow (including charts and matrix drill-down).
- Visible focus states and consistent interaction patterns across all components.
- Clear error messages and announcements for dynamic updates.

## Navigation System

Navigation should feel the same across desktop and mobile:
- Same labels, same order, same “you are here” state.
- One obvious “home” (Overview) and one obvious “work list” (Risk table).

---

## 5) Simple Annotated Wireframes (Plain-Language)

### Wireframe A — Overview (Trust-first)

```text
┌──────────────────────────────────────────────────────────────┐
│ Easy Risk Register     [Online] [Workspace: Personal] [Auth]  │
│ [New risk]  [Export ▾]  (Import) (Metrics)                    │
├──────────────────────────────────────────────────────────────┤
│ Sidebar (desktop)      │  NOW (what needs attention)          │
│ - Overview             │  ┌─────────┐ ┌─────────┐ ┌────────┐ │
│ - Dashboard charts     │  │Overdue  │ │Due soon │ │High    │ │
│ - Risk table           │  │   3     │ │   5     │ │  2     │ │
│ - Maturity             │  └─────────┘ └─────────┘ └────────┘ │
│ - Settings             │                                      │
│                        │  Executive summary cards             │
│                        │  Matrix (drill-down)                 │
└──────────────────────────────────────────────────────────────┘
```

**Annotations**
- “NOW” makes users feel smart: “Here’s what matters today.”
- Trust chips reduce fear: “My data is safe / I’m offline / I’m in the right workspace.”
- Export is grouped to reduce visual noise.

### Wireframe B — New risk (step-by-step)

```text
New risk
Step 1: Basics        Step 2: Score         Step 3: Plan      Step 4: Evidence

[Title *]  (help?)
[Category *]
[Status *]

Next → (disabled until required fields complete)
```

**Annotations**
- Users get a “finish line” (4 steps) but only handle one chunk at a time.
- Required fields are obvious; the button tells you what’s missing.

### Wireframe C — Table (fast scanning + safe actions)

```text
[Search] [Category] [Threat] [Status] [Severity] [Checklist]  [Reset]

Risk table
Title + 2-line description   Category   Score   Owner   Due   Status   Actions
---------------------------------------------------------------------------
[Risk A ...]                 [Badge]    18 H    IT      Jan   Open     [...]
```

**Annotations**
- Keep destructive actions tucked into a menu to reduce accidental clicks.
- Make “View” the default; “Delete” requires an extra step.

---

## 6) Accessibility Checklist (Practical)

Prioritize these:
- Modal focus trap + return focus on close (critical)
- Consistent focus styles across all interactive components (critical)
- Form errors linked via `aria-describedby` and announced via `aria-live` (already in many places—extend everywhere)
- Charts: provide table fallback + textual summaries (maturity does this—keep consistent)
- Keyboard-only: verify top-to-bottom flow (skip link exists—good)

**Observed in code (good targets for quick wins)**
- `easy-risk-register-frontend/src/design-system/components/Modal.tsx`: has Escape + scroll lock, but does not currently trap focus or set initial focus.
- `easy-risk-register-frontend/src/components/dashboard/ActionCenter.tsx`: uses Ant Design components; verify keyboard/focus/contrast is consistent with the rest of the app.

---

## 7) Emotional Connection (Microcopy + Tone)

Replace “system sounding” copy with calm, friendly guidance:
- Instead of “No risks available” → “No risks yet. Add your first one in 2 minutes.”
- Use reassuring copy around privacy: “Saved to your workspace. You control the database.”
- Keep disclaimers clear but gentle (“Self-assessment only…”) without sounding scary.

---

## 8) Free / Open-Source Tools to Implement Improvements

- **Penpot**: open-source Figma alternative for wireframes/prototypes.
- **Storybook + a11y addon**: component documentation + accessibility checks (open-source).
- **axe-core / Lighthouse**: accessibility auditing (already using axe in dev).
- **Radix UI / React Aria**: accessible primitives for menus, dialogs, selects (open-source).
- **Style Dictionary**: design tokens pipeline (you already have token artifacts in `docs/design/assets/style-dictionary/`).

---

## 9) Implementation Order (Small, Safe Steps)

1) **Reduce header clutter** (one primary CTA + Export menu).
2) **Add the “Now” panel** with drill-down filters.
3) **Standardize dashboards** (remove Ant Design surfaces or wrap to match tokens).
4) **Progressive disclosure in the risk form** (sections/stepper).
5) **Close accessibility gaps** (modal focus trap + consistent focus + chart fallbacks).
