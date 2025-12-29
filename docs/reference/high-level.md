# Easy Risk Register (High-level Overview)

## Concept

A lightweight, privacy-first web app that empowers small and medium-sized organizations to identify, assess, and visualize operational, cyber security, and compliance risks - delivering enterprise-level insights without the bloat, complexity, or high costs of traditional systems.

## Problem

Many small and medium businesses (SMBs) rely on outdated methods like Excel spreadsheets or simply overlook risk management due to limited resources. Enterprise-grade tools such as Archer or ServiceNow demand steep learning curves, hefty subscriptions, and IT overhead, making them inaccessible for teams that need straightforward, actionable risk tracking.

## Solution

Easy Risk Register stores core risk register data in **Supabase (Postgres)** and accesses it through **serverless APIs** (`/api/*` on Vercel). The browser authenticates with **Supabase Auth** and calls same-origin APIs; the serverless layer passes the end-user JWT through to Supabase so **RLS policies** enforce per-user/per-workspace access.

It enables users to:

- Add, edit, and delete risks with structured fields.
- Create new risks from bundled cyber templates (picker with preview; no template network calls required; template-derived risks are independent records).
- Assign probability (1-5) and impact (1-5) and compute a risk score.
- Visualize risks in a 5×5 probability-impact matrix and table views (click/keyboard drill-down from matrix cells).
- Filter/search server-side via `/api/risks` (status/category/threat type/checklist status, plus sorting/pagination).
- Export CSV and generate print-to-PDF reports from the browser.

## Why it works

- Privacy-first by default: data stays within your own Supabase project and Vercel deployment (no third-party analytics required).
- Online-first: avoids “single device” storage limits; clearing browser storage does not delete server data.
- Multi-tenant-ready: workspace scoping is part of the schema and enforced by RLS.

## Current implementation

**Frontend**

- Vite + React + TypeScript (`easy-risk-register-frontend/`)
- Uses Supabase Auth in the browser and calls `/api/*`
- Persists non-authoritative UI state locally (filters + cached preferences), with some preferences optionally synced to the workspace (e.g. tooltips/onboarding)

**Backend**

- Vercel serverless functions (`api/`)
- Verifies an end-user Supabase JWT and uses Supabase anon key + user JWT so RLS remains the primary enforcement

**Database**

- Supabase Postgres with workspace-scoped tables and RLS (`supabase/init/*.sql`)

## Intended audience

SMB owners, managers, and compliance officers who handle risks informally but need a structured tool to stay proactive, without investing in heavy enterprise software. It targets the intersection of growing businesses that value efficiency and those in regulated sectors requiring basic documentation for audits or insurance.
