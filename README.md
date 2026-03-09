# 🛏️ Can I Nap? | ?אפשר לנמנם

Real-time nap risk calculator for Israelis during the Iran war (Feb 28, 2026 – present).

**Live:** [caninap.online](https://caninap.online)

Calculates the probability that a nap of X minutes will be interrupted by a Pikud HaOref rocket alert, based on your location and real alert data.

Inspired by [canishower.com](https://canishower.com) — same concept, different math. Naps (10–120 min) compound risk non-linearly compared to showers.

## How It Works

The app polls real Pikud HaOref alert data and applies Poisson statistics to estimate interruption probability.

**Risk model:** P(interruption) = 1 - e^(-duration/avgInterval)

Five weighted factors feed into the final risk score:

- **Base Poisson model** (40%) — exponential CDF from average alert interval
- **Trend** (15%) — compares last 3h vs prior 3h alert frequency
- **Recency** (20%) — exponential decay from time since last alert
- **Dual-front escalation** (15%) — tracks Iran ballistic missiles and Hezbollah rockets simultaneously
- **Time-of-day bias** (10%) — historical hourly distribution of alerts

The dual-front system classifies alerts by source using pre-alert correlation: cat:14 early warnings (which always precede Iranian ballistic missiles but are physically impossible for Hezbollah rockets) are used to definitively identify Iranian attacks.

## Features

- Risk dial with color-coded severity (green → yellow → orange → red)
- Duration slider (10–120 min) with instant risk recalculation
- 1,450+ Israeli cities from the Pikud HaOref database, plus 8 regional aggregates
- "All of Israel" national view
- 24-hour safety timeline graph showing optimal nap windows
- Live-ticking "time since last alert" counter
- Pre-alert banner for cat:14 early warnings
- Full-screen active threat overlay with shelter countdown
- Adjustable risk factor weights
- Hebrew (RTL) + English (LTR) language toggle
- PWA with offline support
- WebGL animated background

## Tech Stack

- **Framework:** Next.js 14 (App Router), TypeScript (strict), Tailwind CSS
- **Charts:** Recharts (lazy-loaded)
- **3D:** Three.js/WebGL (lazy-loaded)
- **Data:** Pikud HaOref API (real-time + archive endpoints)
- **Hosting:** Kamatera VPS, Tel Aviv (Israeli IP required for Oref API)
- **Process manager:** PM2 (3 processes: app, poller, cron)

## Architecture

```
Oref API (alerts.json) → poll-live.ts (every 3s) → data/alerts.json
Oref Archive API → cron-fetch.ts (every 2m) → data/alerts.json
Browser ← /api/alerts ← alert-store.ts ← data/alerts.json
Browser ← /api/sse (EventSource) ← real-time push
```

## Project Structure

```
src/
├── app/ — Next.js pages + API routes (page.tsx, api/alerts, api/poll, api/fetch-history, api/sse)
├── components/ — 13 React components (RiskDial, StatsCards, SafeNapGraph, CalculationPanel, ActiveThreatOverlay, AnimatedBackground, etc.)
└── lib/ — 14 modules (risk.ts, zones.ts, zones-generated.ts, oref-client.ts, alert-store.ts, dual-front.ts, pre-alert-tracker.ts, parse-israel-date.ts, i18n/)

scripts/ — 9 utility scripts (cron-fetch, poll-live, fetch-oref-history, fetch-tzofar-history, etc.)
__tests__/ — 8 test files, 78 tests
```

## Data

- **Source:** Pikud HaOref (oref.org.il)
- **Coverage:** Feb 28, 2026 – present
- **Volume:** 6,500+ alerts (2,000+ threat alerts, 4,000+ pre-alerts)
- **996 unique cities** affected since war start

## Running Locally

Requires an Israeli IP for the Oref API.
```bash
git clone https://github.com/MPG-Paradox/Can-i-nap.git
cd Can-i-nap
npm install
npm run dev
```

## Production Deployment
```bash
npm run build
pm2 start ecosystem.config.js
pm2 save
```

The ecosystem.config.js runs 3 processes:
- caninap — Next.js app on port 3000
- caninap-poller — Real-time 3s poll
- caninap-cron — Archive sync every 2 minutes

## Tests
```bash
npm test
# 78 tests across 8 suites
```

## Disclaimer

For informational purposes only. This is a statistical model based on historical alert data. Always follow Pikud HaOref instructions.

## Credits

- **Inspiration:** [canishower.com](https://canishower.com)
- **Data source:** [Pikud HaOref](https://www.oref.org.il/)


## Author

**Emil El Asmar** — Data Science Student
- [LinkedIn](https://www.linkedin.com/in/emil-el-asmar-59a4a629a/)
- [GitHub](https://github.com/MPG-Paradox)
