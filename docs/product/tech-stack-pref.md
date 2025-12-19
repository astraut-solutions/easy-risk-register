# Tech Stack (Current + Optional)

This repo is a web-first, client-side application (React + Vite). Notes about Expo/mobile frameworks do not apply here.

## Current Stack (Implemented)

### Frontend
- React
- TypeScript
- Vite
- Tailwind CSS (plus a small design token layer)
- Framer Motion (animations)

### State and Forms
- Zustand (app state)
- React Hook Form (forms + validation)

### Data and Import/Export
- Browser `localStorage` for persistence (encrypted at rest in the app)
- CSV import/export (validated to reduce malformed content and CSV injection risks)

### Security
- Content Security Policy (CSP)
- Input sanitization via DOMPurify

### Testing
- Vitest (unit/integration)
- Testing Library (React)
- Playwright (E2E)

### Dev/Deploy
- Docker (dev and production images)
- GitHub Actions workflows (CI/security scanning)
- Static hosting supported (see `vercel.json` for one option)

## Optional Additions (Future)
- React Router (if/when the UI grows beyond a single-page dashboard flow)
- IndexedDB (if larger datasets or more robust offline storage is needed)
- React Query (if adding async persistence/sync layers later)
- PocketBase (if adding optional cloud sync / multi-user collaboration later)
