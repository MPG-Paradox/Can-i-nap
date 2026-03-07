# Can I Nap? 

**Calculate the probability your nap will be interrupted by a rocket alert.**

## The Problem

Israeli civilians during the Iran war (Feb 28, 2026 – present) need to know if they can safely nap without being woken by a Pikud HaOref rocket alert. Inspired by [canishower.com](https://canishower.com) but for longer sleep windows (10–120 min), where risk compounds non-linearly with duration.

## How It Works

The app polls the Pikud HaOref real-time alert API and calculates interruption probability using a **Poisson-based risk model**:

1. **Alert frequency** — average interval between recent alerts in your zone
2. **Recency** — exponential decay from the last alert (recent = higher risk)
3. **Trend** — is alert frequency increasing or decreasing?
4. **Dual-front escalation** — simultaneous Iran (ballistic missiles) + Hezbollah (rockets) activity multiplies risk

The core formula uses the exponential CDF: `P = 1 - e^(-duration/avgInterval)`, then applies context-aware multipliers. Result is clamped to 0–99%.

## Features

- **Real-time risk calculation** based on live Pikud HaOref data
- **Dual-front tracking** — Iran vs Hezbollah with escalation levels
- **Optimal nap window finder** — scans next 24h for the safest time
- **3-language support** — Hebrew, English, Arabic with full RTL/LTR
- **Active threat override** — visual-only alert screen (no audio, users may be sleeping)
- **Pre-alert detection** — category 14 early warnings (~2 min before impact)
- **Mobile-first dark UI** — designed for phones, calming sleep-friendly theme

## Tech Stack

- **Next.js 14** (App Router) with TypeScript (strict mode)
- **Tailwind CSS** — dark theme, RTL utilities
- **Recharts** — risk timeline visualization (planned)
- **Pikud HaOref API** — real-time + historical alerts
- **File-based alert store** (Supabase migration planned)

## Getting Started

```bash
git clone <repo-url>
cd CaniNap
npm install
npx tsx scripts/seed.ts   # Seed sample alert data
npm run dev               # Start dev server at localhost:3000
```

> **Note:** The Pikud HaOref API is geo-blocked to Israeli IPs. For local dev in Israel it works out of the box. For production, you need an Israeli VPS or GCP `me-west1` VM as a polling proxy.

## Project Structure

```
src/
├── app/
│   ├── layout.tsx              # Root layout — RTL, dark theme, Noto Sans Hebrew
│   ├── page.tsx                # Landing page (location picker placeholder)
│   ├── dashboard/page.tsx      # Dashboard (placeholder)
│   └── api/
│       ├── alerts/route.ts     # GET stored alerts by time range
│       ├── poll/route.ts       # Poll Oref API and store new alerts
│       └── sse/route.ts        # SSE heartbeat stub
├── lib/
│   ├── types.ts                # All TypeScript interfaces
│   ├── zones.ts                # 33 zone definitions + fuzzy matching
│   ├── risk.ts                 # Poisson risk engine + optimal window
│   ├── dual-front.ts           # Dual-front escalation detection
│   ├── oref-client.ts          # Pikud HaOref API client
│   ├── alert-store.ts          # File-based JSON alert store
│   └── i18n/                   # Hebrew, English, Arabic translations
├── components/                 # UI components (upcoming)
data/
├── alerts.json                 # Alert store (seeded)
└── seed.csv                    # Sample seed data
scripts/
└── seed.ts                     # Seed script
__tests__/                      # Jest test suite (25 tests)
```

## API Routes

| Route | Method | Description |
|---|---|---|
| `/api/alerts?hours=24` | GET | Returns stored alerts from the last N hours |
| `/api/poll` | GET | Polls Oref API for active alerts + syncs history |
| `/api/sse` | GET | SSE endpoint (heartbeat stub, real-time planned) |

## Roadmap

- [x] Project structure, risk engine, zones, poller, i18n, tests
- [ ] Landing page UI (location picker with geolocation)
- [ ] Dashboard (risk dial, duration slider, stats cards)
- [ ] Recharts safe-nap timeline graph
- [ ] Real-time SSE + active threat overlay
- [ ] Full i18n wiring + language toggle
- [ ] PWA + offline support
- [ ] Supabase migration
- [ ] Deploy to Vercel + Israeli poller server

## Disclaimer

**For informational purposes only. Always follow Pikud HaOref / Home Front Command instructions. Download the official Pikud HaOref app.**

למידע בלבד. תמיד פעלו לפי הנחיות פיקוד העורף. הורידו את אפליקציית פיקוד העורף.

لأغراض إعلامية فقط. اتبع دائمًا تعليمات قيادة الجبهة الداخلية. حمّل تطبيق بكود هعوريف الرسمي.

## License

MIT
