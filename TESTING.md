# Can I Nap? — Testing Guide

## What is this?
A web app that calculates the probability your nap will be interrupted by a rocket alert in Israel.

## How to test it

### If you're on the SAME WiFi as the host:
1. Open your phone browser
2. Go to: `http://10.100.102.11:3000`
3. That's it — the app loads immediately

### What to test:

**Basic flow:**
- [ ] Page loads with a risk percentage dial
- [ ] The amber rocket animation plays in the background
- [ ] Language toggle (עב / EN) switches between Hebrew and English

**Location:**
- [ ] Tap "All of Israel" — shows national risk
- [ ] Tap "Tel Aviv - Center" — shows Tel Aviv specific risk
- [ ] Tap "Haifa - Carmel" — shows Haifa specific risk
- [ ] Try searching for your city in the search bar
- [ ] Tap "Use location" — asks for GPS permission, finds nearest city

**Nap duration:**
- [ ] Drag the slider — risk dial updates smoothly
- [ ] Tap 20m / 45m / 90m presets — slider snaps to value
- [ ] Risk should be higher for longer naps

**Scroll down to see:**
- [ ] Stats cards (time since last alert, average interval, 24h count, trend)
- [ ] Iran / Hezbollah front activity bars
- [ ] "When is the safest time to nap?" graph (higher = safer)
- [ ] "How it's calculated" panel — tap to expand and adjust weights

**Edge cases:**
- [ ] Rotate phone — layout adjusts
- [ ] Switch language while scrolled down — no layout jump
- [ ] Go back to top and switch city — everything updates

### Bugs to report:
If you find something broken, note:
1. What you did
2. What you expected
3. What actually happened
4. Screenshot if possible

### Technical notes:
- Data is real — pulled from Pikud HaOref alert history (Feb 28 - today)
- Risk is calculated using a Poisson statistical model
- The app runs on a local machine — if it stops working, the host's PC may be off
