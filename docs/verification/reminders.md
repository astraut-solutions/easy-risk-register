# Reminders verification (notifications + in-app fallback)

Prereqs:

- App running locally or deployed (Vercel recommended).
- At least 1 risk with a **past** due/review date (overdue) or a due/review date within the next 7 days (due soon).

## Verify: denied permission falls back to in-app banners

1) In your browser, ensure notification permission for the app is **Denied**:
   - Chrome/Edge: Site settings → Notifications → Block (or click the “tune” icon in the address bar).
2) In the app: Settings → Reminders
   - Enable reminders.
   - Enable “Use desktop notifications when allowed…”.
3) Wait for the reminders cadence to trigger (or refresh the page once).
4) Confirm an **in-app Reminder banner** appears (and no desktop notification is shown).
5) Click **Snooze 1 day** (or **Snooze 1 week**) and confirm the banner disappears immediately.
6) Refresh and confirm the banner stays hidden while the snooze window is active.
7) Click **Disable** and confirm reminders stop showing until re-enabled.

## Verify: cadence respects settings

Cadence is enforced client-side to avoid repeatedly prompting the user:

1) Settings → Reminders
   - Enable reminders.
   - Set Frequency to Daily/Weekly/Monthly.
2) Ensure at least 1 risk is overdue or due soon.
3) Refresh the page and confirm you see either:
   - A desktop notification (if permission granted and notifications preferred), or
   - An in-app Reminder banner (fallback path).
4) Immediately refresh again and confirm no additional notification/banner appears until the configured frequency window has elapsed.

## Automated check (Playwright)

From `easy-risk-register-frontend/`:

`npm run test:e2e -- reminders.spec.ts`

