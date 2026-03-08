# Can I Nap?

**Calculate the probability your nap will be interrupted by a rocket alert.**

## The Problem

Israeli civilians during the Iran war (Feb 28, 2026 -- present) need to know if they can safely nap without being woken by a Pikud HaOref rocket alert. Inspired by [canishower.com](https://canishower.com) but for longer sleep windows (10--120 min), where risk compounds non-linearly with duration.

## How It Works

The app polls the Pikud HaOref real-time alert API and calculates interruption probability using a **Poisson-based risk model**:

1. **Alert frequency** -- average interval between recent alerts in your zone
2. **Recency** -- exponential decay from the last alert (recent = higher risk)
3. **Trend** -- is alert frequency increasing or decreasing?
4. **Dual-front escalation** -- simultaneous Iran (ballistic missiles) + Hezbollah (rockets) activity multiplies risk
5. **Time-of-day bias** -- historical attack patterns (night hours riskier)

The core formula uses the exponential CDF: `P = 1 - e^(-duration/avgInterval)`, then applies weighted context-aware multipliers. Result is clamped to 0--99%.

## Features

- **Real-time risk calculation** based on live Pikud HaOref data
- **Animated shader background** -- subtle aurora effect via Three.js WebGL
- **Glass morphism UI** -- frosted glass cards with backdrop blur
- **Dual-front tracking** -- Iran vs Hezbollah with escalation levels
- **Safety timeline graph** -- 24h safety % chart with best nap time
- **Adjustable risk weights** -- tune each factor's contribution
- **3-language support** -- Hebrew, English, Arabic with full RTL/LTR
- **Active threat override** -- visual-only alert screen (no audio)
- **Pre-alert detection** -- category 14 early warnings (~2 min before impact)
- **PWA installable** -- add to home screen, service worker caching
- **Mobile-first dark UI** -- designed for 375px+, calming sleep-friendly theme
- **Share button** -- native share on mobile, clipboard copy on desktop

## Tech Stack

- **Next.js 14** (App Router) with TypeScript (strict mode)
- **Tailwind CSS** -- dark theme, glass morphism, RTL utilities
- **Three.js** -- WebGL shader background (lazy-loaded, 30fps cap)
- **Recharts** -- safety timeline visualization
- **Pikud HaOref API** -- real-time + historical alerts
- **SSE** -- Server-Sent Events for real-time alert streaming
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
│   ├── layout.tsx              # Root layout -- RTL, dark theme, PWA, SEO
│   ├── page.tsx                # Single-page dashboard
│   ├── error.tsx               # Error boundary -- catches crashes gracefully
│   └── api/
│       ├── alerts/route.ts     # GET stored alerts by time range
│       ├── fetch-history/      # One-time Oref history sync
│       ├── poll/route.ts       # Poll Oref API and store new alerts
│       └── sse/route.ts        # SSE endpoint for real-time alerts
├── components/
│   ├── RiskDial.tsx            # Animated ring with color-coded glow
│   ├── RiskMessage.tsx         # Contextual risk description
│   ├── StatsCards.tsx          # Time since last, avg interval, 24h count, trend
│   ├── DualFrontCard.tsx       # Iran vs Hezbollah escalation status
│   ├── SafeNapGraph.tsx        # 24h safety % timeline (Recharts)
│   ├── CalculationPanel.tsx    # Expandable weight sliders
│   ├── DurationButtons.tsx     # 20/45/90/custom nap duration
│   ├── InlineLocationPicker.tsx # Fuzzy search + quick chips + geolocation
│   ├── ActiveThreatOverlay.tsx # Full-screen red alert overlay
│   ├── ShareButton.tsx         # Native share / clipboard copy
│   ├── ConnectionStatus.tsx    # Connection + data freshness indicator
│   ├── LanguageToggle.tsx      # he/en language switch
│   └── ui/
│       └── AnimatedBackground.tsx # Three.js WebGL aurora shader
├── lib/
│   ├── types.ts                # All TypeScript interfaces
│   ├── zones.ts                # Zone definitions + fuzzy matching
│   ├── risk.ts                 # Poisson risk engine + optimal window
│   ├── dual-front.ts           # Dual-front escalation detection
│   ├── oref-client.ts          # Pikud HaOref API client
│   ├── alert-store.ts          # File-based JSON alert store
│   ├── use-sse.ts              # SSE React hook
│   ├── utils.ts                # Formatting helpers
│   └── i18n/                   # Hebrew + English translations
public/
├── manifest.json               # PWA manifest
├── sw.js                       # Service worker (network-first API, cache-first static)
└── icon.svg                    # Moon/stars app icon
```

## API Routes

| Route | Method | Description |
|---|---|---|
| `/api/alerts?hours=24` | GET | Returns stored alerts from the last N hours (max 168) |
| `/api/poll` | GET | Polls Oref API for active alerts + syncs history |
| `/api/fetch-history` | GET | One-time history sync from Oref 24h endpoint |
| `/api/sse` | GET | SSE endpoint for real-time alert streaming |

## Roadmap

- [x] Project structure, risk engine, zones, poller, i18n, tests
- [x] Single-page dashboard (risk dial, duration, stats, location picker)
- [x] Safety timeline graph with best nap time
- [x] Real-time SSE + active threat overlay + pre-alert banner
- [x] Full i18n wiring + language toggle (he/en)
- [x] Dual-front tracking with zone-specific counts
- [x] Auto-fetch data on startup
- [x] Security audit + QA report
- [x] Animated shader background (Three.js WebGL)
- [x] Glass morphism cards + staggered load animations
- [x] Risk dial glow effects
- [x] PWA (manifest, service worker, installable)
- [x] SEO (Open Graph, Twitter Card, meta tags)
- [x] Share button (native share + clipboard)
- [x] Error boundary
- [ ] Arabic language support
- [ ] Supabase migration (replace file store)
- [ ] Deploy to Vercel + Israeli poller server

## Disclaimer

**For informational purposes only. Always follow Pikud HaOref / Home Front Command instructions. Download the official Pikud HaOref app.**

MIT
