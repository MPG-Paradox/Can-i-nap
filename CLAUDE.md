# CLAUDE.md — Can I Nap? (אפשר לישון?)

## What Is This Project

"Can I Nap?" is a web app that calculates the risk of your nap being interrupted by a rocket alert (Pikud HaOref / פיקוד העורף). It's built specifically for the Iran war that started February 28, 2026. Think canishower.com but for naps — longer duration windows (10-120 min) with smarter math.

This is a side project by a data science student in Ashdod, Israel. Keep it practical — no overengineering.

## Tech Stack

- **Framework:** Next.js 14 (App Router) with TypeScript
- **Styling:** Tailwind CSS (mobile-first, RTL support)
- **Charts:** Recharts
- **Database:** Supabase (PostgreSQL) — or SQLite if simpler
- **Real-time:** Server-Sent Events (SSE)
- **Deployment:** Vercel (frontend) + Israeli-IP server (alert poller)
- **Languages:** Hebrew (primary), English, Arabic — full i18n with RTL/LTR

## Project Structure

```
can-i-nap/
├── app/                          # Next.js App Router
│   ├── layout.tsx                # Root layout with RTL/LTR, fonts, theme
│   ├── page.tsx                  # Landing page — location picker
│   ├── dashboard/
│   │   └── page.tsx              # Main dashboard after location selected
│   ├── api/
│   │   ├── alerts/
│   │   │   ├── route.ts          # GET current alerts + history
│   │   │   └── stream/
│   │   │       └── route.ts      # SSE endpoint for real-time alerts
│   │   └── risk/
│   │       └── route.ts          # Risk calculation API (optional, can be client-side)
│   └── globals.css
├── components/
│   ├── LocationPicker.tsx        # Geolocation + fuzzy search dropdown
│   ├── RiskDial.tsx              # Big animated percentage circle
│   ├── DurationSlider.tsx        # 10-120 min slider with presets
│   ├── DualFrontIndicator.tsx    # Iran vs Hezbollah status card
│   ├── StatsCards.tsx            # 4 metric cards
│   ├── SafeNapGraph.tsx          # 24h risk timeline chart
│   ├── ActiveThreatOverride.tsx  # Full-screen red alert overlay
│   ├── LanguageToggle.tsx        # he/en/ar switcher
│   └── PreAlertBanner.tsx        # Yellow banner for cat:14 pre-alerts
├── lib/
│   ├── alert-engine/
│   │   ├── risk.ts               # Core risk calculation
│   │   ├── dual-front.ts         # Iran vs Hezbollah classification
│   │   ├── optimal-window.ts     # Find safest nap window
│   │   └── types.ts              # TypeScript interfaces
│   ├── data/
│   │   ├── zones.ts              # All Pikud HaOref zone mappings
│   │   └── constants.ts          # Time-to-shelter values, thresholds
│   ├── i18n/
│   │   ├── he.ts                 # Hebrew strings
│   │   ├── en.ts                 # English strings
│   │   ├── ar.ts                 # Arabic strings
│   │   └── index.ts              # i18n hook/context
│   ├── supabase.ts               # Supabase client
│   └── poller.ts                 # Alert polling logic
├── scripts/
│   └── seed-war-data.ts          # Seed historical alerts from Feb 28+
├── public/
│   ├── manifest.json             # PWA manifest
│   └── icons/                    # App icons
├── CLAUDE.md                     # THIS FILE
└── package.json
```

## The Data Source — Pikud HaOref API

### Real-time alerts
```
GET https://www.oref.org.il/WarningMessages/alert/alerts.json
```

**Required headers (MUST include or you get blocked):**
```
Referer: https://www.oref.org.il/
X-Requested-With: XMLHttpRequest
User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36
```

**Response when alert is active:**
```json
{
  "id": "132944072580000000",
  "cat": "1",
  "title": "ירי רקטות וטילים",
  "data": ["אשדוד - יא,יב,טו,יז,מרינה", "סעד"],
  "desc": "היכנסו למרחב המוגן"
}
```

**Response when no alert:** empty string or `[]`

**Category codes:**
- `1` = Rockets and missiles (ירי רקטות וטילים) — main threat
- `6` = Hostile aircraft intrusion (חדירת כלי טיס עוין)
- `13` = End of alert / safe to leave shelter
- `14` = Pre-alert / early warning (Iran missiles get this ~2 min before impact)

**Poll every 3 seconds. Geo-blocked to Israeli IPs only.**

### Alert history (last 24h)
```
GET https://www.oref.org.il/WarningMessages/History/AlertsHistory.json
```
Same headers required. Response:
```json
[
  {
    "alertDate": "2026-03-07 14:30:00",
    "title": "ירי רקטות וטילים",
    "data": "תל אביב - מרכז העיר",
    "category": 1
  }
]
```

### Existing npm package (optional helper)
`pikud-haoref-api` — Node.js wrapper. Install: `npm install pikud-haoref-api`
Includes: cities.json (all city names), polygons.json (map data), alert type classification.
Note: the `earlyWarning` type was renamed to `newsFlash` in v4.0.0.

## Iran vs Hezbollah Classification

The API does NOT label the attack source. We classify by geography:

**Iran** (ballistic missiles) → targets central/southern Israel:
Tel Aviv (all zones), Jerusalem (all zones), Ramat Gan, Beit Shemesh, Ashdod, Be'er Sheva, Rishon LeZion, Petah Tikva, Netanya, Rehovot, Modiin

**Hezbollah** (rockets from Lebanon) → targets northern Israel:
Haifa (all zones), Kiryat Shmona, Nahariya, Tiberias, Safed, Acre, Karmiel, Galilee settlements

**Dual front:** When BOTH northern AND central/southern zones have active alerts within 30 minutes, flag as dual front and apply risk multiplier.

## Risk Calculation

### Base formula (exponential CDF)
```typescript
baseRisk = 1 - Math.exp(-napDurationMinutes / (avgIntervalMinutes))
```
This is the probability of at least one alert during the nap, assuming alerts follow a Poisson process.

### Multipliers applied to base risk
- **trendMultiplier:** 1.4 (increasing), 0.6 (decreasing), 1.0 (stable)
- **recencyMultiplier:** 2.0 (alert just happened) → decays to 0.5 (6+ hours quiet). Formula: `0.5 + 1.5 * Math.exp(-timeSinceLastAlert / (60 * 60))`
- **dualFrontMultiplier:** 1.0 (single front), 1.5 (dual front active), 2.0 (heavy barrage from either), 2.5 (heavy barrage from both)
- **timeOfDayMultiplier:** calculated from historical pattern of this war

**Final = clamp(baseRisk × allMultipliers × 100, 0, 99)**

### Optimal window finder
Scan next 24 hours in 15-minute increments. For each start time, calculate risk for the selected nap duration. Return the window with lowest risk.

## Design Guidelines

- **Theme:** Dark navy (#0a0e1a) background, NOT pure black
- **Colors:** Green (#22c55e) = safe, Amber (#f59e0b) = caution, Red (#ef4444) = danger
- **Typography:** Heebo font for Hebrew/Arabic (Google Fonts), system sans-serif fallback
- **Mobile-first:** 85%+ users will be on phones. Design for 375px width first.
- **RTL:** Hebrew and Arabic are RTL. Use `dir="rtl"` and Tailwind's RTL utilities.
- **Tone:** Calm and reassuring, slightly playful. Moon/sleep/pillow motif. NOT scary or clinical.
- **Active Threat Override:** Full-screen red overlay, NO AUDIO (users may be sleeping, avoid panic)

## i18n Structure

Three languages: Hebrew (he), English (en), Arabic (ar).
Hebrew and Arabic are RTL. English is LTR.
Store current language in localStorage. Default to Hebrew.
All user-facing strings must come from the i18n files, never hardcoded.

## Coding Standards

- TypeScript strict mode
- Functional components with hooks
- Name files in kebab-case, components in PascalCase
- Use `async/await` not callbacks
- Error boundaries around API calls
- All risk calculation functions must have unit tests
- Comments in English
- Commit messages in English

## War Context (for accurate modeling)

This app is for the Iran-Israel war starting February 28, 2026:
- Feb 28: War begins. Iran fires ~90 missile barrages at Israel on day 1.
- Mar 1: Rate decreases to ~65 barrages.
- Mar 2: Hezbollah joins, firing rockets at northern Israel. Now two fronts.
- Mar 3-4: Iran barrages decline to ~6/day. Hezbollah continues.
- Mar 5+: Ongoing but declining Iranian missile rate. Hezbollah active.

The data window for this app is Feb 28, 2026 → present. NOT older conflicts.

## Important Constraints

1. **The oref.org.il API is geo-blocked.** Backend polling MUST run from an Israeli IP.
2. **Alert data is in Hebrew.** City names in the API are Hebrew strings. Zone matching must handle Hebrew.
3. **This is a side project.** Keep it simple. Use free tiers. Don't overengineer.
4. **Pre-alerts (cat 14) are important.** Iran ballistic missile attacks come with a ~2 min pre-alert before the main alert. This is valuable signal — show it in the UI.
5. **No audio alerts.** The Active Threat Override is visual only. Users might be sleeping.
