# Tech Stack (Current + Target + Optional)

This repo is a web-first application (React + Vite). Notes about Expo/mobile frameworks do not apply here.

The product direction is **DB-backed**: Supabase (Postgres) is the system of record, accessed via **server-side APIs** (Vercel serverless functions). The UI should not rely on browser storage for authoritative persistence.

## Current Stack (Implemented in Repo)

### Frontend
- React
- TypeScript
- Vite
- Tailwind CSS (plus a small design token layer)
- Framer Motion (animations)

### State and Forms
- Zustand (app state)
- React Hook Form (forms + validation)

### Backend / APIs
- Vercel serverless functions (`/api/*`, Node)

### Database / Storage
- Supabase (Postgres) for persistence
- Supabase Auth + Row Level Security (RLS) for authorization boundaries

### Data Import/Export
- CSV import/export with validation and CSV injection defenses

### Security
- Content Security Policy (CSP)
- Input sanitization via DOMPurify
- Secret management: service-role keys stay server-side (never in the browser)

### Testing
- Vitest (unit/integration)
- Testing Library (React)
- Playwright (E2E)

### Dev/Deploy
- Vercel (hosting + serverless APIs)
- Docker (dev and production images)
- GitHub Actions workflows (CI/security scanning)

## Optional Additions (Future)
- React Router (if/when the UI grows beyond a single-page dashboard flow)
- IndexedDB (optional bounded, read-only cache for degraded offline viewing)
- React Query (if adding more complex async server-state needs)
- Client-side end-to-end encryption (Web Crypto) for selected fields (ciphertext stored in DB)
