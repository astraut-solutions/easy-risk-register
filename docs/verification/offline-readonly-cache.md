# Offline / Read-only Verification

This app is online-first. When the browser is offline (or the backend is temporarily unreachable), the UI must clearly communicate the degraded state and must not silently drop writes.

## Preconditions

- You can sign in (Supabase configured).
- You have at least 1 risk in the workspace (so caching has something to store).
- Popups are allowed (not required for this checklist, but useful for exports).

## Verify: writes blocked while offline

1) Load the app normally and confirm the header shows the workspace data loaded.
2) Open browser DevTools and enable Offline mode:
   - Chrome/Edge: DevTools → Network → Throttling → `Offline`
3) Confirm the UI shows **Read-only mode** and indicates “changes will not be saved”.
4) Attempt each write action and confirm it is blocked with explicit messaging:
   - Create risk: open “New risk” and confirm the submit button is disabled and shows the offline reason.
   - Edit risk: open an existing risk and confirm updates cannot be submitted.
   - Delete risk: attempt delete and confirm a “Not saved / offline” message appears and nothing changes.
   - Import CSV: open Import and confirm import is blocked while offline.

## Verify: cached view is read-only (when enabled)

1) Disable Offline mode and click “Retry sync” (or refresh).
2) Confirm “Last updated” timestamp is present after sync.
3) Re-enable Offline mode.
4) Confirm:
   - Risk list/table/matrix still shows data (from cache).
   - UI remains in read-only mode and all write actions remain blocked.
   - No new risks appear after attempted creates/edits/deletes/imports.

## Notes

- Cache bounds: up to 100 risks updated in the last 7 days.
- Cache storage: IndexedDB (per-browser, per-device), not a source of truth.
- If encryption is enabled and locked, cached data may be unavailable until unlocked.

