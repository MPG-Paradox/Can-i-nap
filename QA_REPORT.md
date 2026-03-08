# QA Report — Can I Nap? v1.0

## Date: 2026-03-08

## Functional Tests

| # | Test | Status | Notes |
|---|------|--------|-------|
| 1 | Page loads with data | PASS | Risk dial, stats cards, graph all render. Loading spinner shown until data arrives. |
| 2 | Language toggle | PASS | he/en switch works. RTL/LTR direction updates. All text comes from i18n files. |
| 3 | Duration buttons | PASS | 20/45/90/Custom all update `napDuration` state. Risk dial recalculates on change. Decimal precision at high risk (>90%) shows difference between durations. |
| 4 | Location quick chips | PASS | Each chip passes Hebrew name to zone matcher. English labels shown in EN mode. |
| 5 | Location search | PASS | Fuzzy search finds Hebrew and English city names. Results filtered correctly. |
| 6 | Keyboard navigation | PASS | Tab moves through buttons. Search dropdown accessible via keyboard. |
| 7 | Stats cards | PASS | All 4 cards show data. Timer ticks via 1s interval. Days/hours/minutes display correctly. |
| 8 | Dual front card | PASS | Shows national counts with (national) label. Zone-specific counts shown when city selected. Status badge shows "last 30 min" window. |
| 9 | 24h graph | PASS | Now shows Safety % (inverted). Green gradient, green-400 line. Best time badge positioned at highest (safest) peak. Tooltip shows "Safety: X%". |
| 10 | Calculation panel | PASS | Expand/collapse works. Weight sliders update risk via debounced callback (150ms). |
| 11 | URL persistence | PASS | `?zone=` param uses encoded Hebrew names. Refreshing page restores selected zone. |
| 12 | Mobile layout (375px) | PASS | No horizontal overflow. Flexbox layout wraps correctly. Buttons stack on small screens. |
| 13 | Empty state | PASS | `alerts.json = []` returns empty array. Risk defaults to baseline. No crash. |
| 14 | Error handling | PASS | API fetch failures caught with try-catch. Connection status shows "reconnecting". Alert store returns `[]` on corrupted JSON. |

## Security Audit

| # | Check | Status | Notes |
|---|-------|--------|-------|
| 1 | API input validation | FIXED | `/api/alerts?hours=` now validates: must be positive number, max 168. Returns 400 on invalid input. |
| 2 | XSS prevention | PASS | Zero uses of `dangerouslySetInnerHTML`, `innerHTML`, or `eval`. All data rendered via React JSX (auto-escaped). No dynamic `href`/`src` from user data. |
| 3 | URL parameter injection | PASS | `?zone=` decoded and rendered as React text. `<script>` tags in URL are harmless — React escapes them. |
| 4 | API key exposure | PASS | No API keys in codebase. Oref API uses only headers (Referer, X-Requested-With, User-Agent). No `.env` files committed. |
| 5 | File store safety | FIXED | Path is hardcoded constant (not user-controllable). Added file size cap (10MB), auto-trim on overflow. Invalid JSON returns `[]`. Invalid timestamps rejected. |
| 6 | Alert deduplication | PASS | `addAlert()` checks Set of existing IDs before writing. Duplicates silently skipped. |
| 7 | Alert cap | PASS | `MAX_ALERTS = 10000` enforced via `.slice(0, MAX_ALERTS)` on every write. |
| 8 | Timestamp validation | FIXED | Added `isNaN(new Date(alert.timestamp).getTime())` check in `addAlert()`. |
| 9 | `.gitignore` | FIXED | Added bare `.env` to gitignore (previously only `.env*.local` was covered). |
| 10 | Dependencies (npm audit) | NOTE | 2 advisories in transitive deps: `form-data` (via `pikud-haoref-api` -> `request`) and `glob` (via `eslint-config-next`). Neither is exploitable in production — `pikud-haoref-api` is only used server-side, `glob` is dev tooling only. |

## Performance

- **Build size:** 136 KB first load JS (main page), 87.4 KB shared
- **Lazy chunks:** `SafeNapGraph` and `CalculationPanel` dynamically imported — separate chunks, loaded on demand
- **Timer isolation:** 1s `tickTime` only triggers `StatsCards` re-render (via `void tickTime`). Expensive risk/graph calcs use separate 30s `calcTime`.
- **Weight slider:** Debounced at 150ms via `useRef` callback — no jank
- **Alert fetch:** Compares JSON string to avoid unnecessary state updates when data hasn't changed

## Issues Found & Fixed

1. **Graph inverted** — Changed from risk % (high = dangerous) to safety % (high = safe). Green gradient, green line stroke. Tooltip shows "Safety: X%".
2. **Dual front card** — Added zone-specific alert counts when a city is selected. Added "(national)" label on counts. Added "last 30 min" label near status badge.
3. **Duration precision** — Risk calculation now preserves one decimal place (e.g., 97.2% vs 97%). RiskDial shows decimal when risk > 90% to make duration changes visible at high risk levels.
4. **Auto-fetch** — Created `/api/fetch-history` route for one-time history sync on startup. Added startup fetch call + immediate poll in `page.tsx`.
5. **API input validation** — `/api/alerts` now validates `hours` param (positive number, max 168).
6. **Alert store hardening** — Added 10MB file size cap with auto-trim. Added timestamp validation. Added corruption recovery (returns `[]`).
7. **`.gitignore`** — Added bare `.env` pattern.
8. **Production comments** — Added `PRODUCTION TODO` comments to SSE route (connection limits), poll route (single poller), alert store (database migration), alerts route (rate limiting).

## Production TODOs

- [ ] Rate limiting on API routes (per-IP throttling)
- [ ] Database instead of file-based store (Supabase/PostgreSQL)
- [ ] Single poller server (not per-client polling against Oref API)
- [ ] SSE connection limits per IP
- [ ] HTTPS enforcement
- [ ] Content Security Policy headers
- [ ] Upgrade `pikud-haoref-api` or replace with direct API calls to resolve `form-data` advisory
- [ ] Upgrade `eslint-config-next` to resolve `glob` advisory
