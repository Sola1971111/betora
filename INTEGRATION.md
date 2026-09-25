# Betora — The Odds API Integration

This document covers what changed when Betora was upgraded from mock/static
matches to real sports data via [The Odds API](https://the-odds-api.com).

## Architecture

Betora's frontend was a static Vite/React SPA with no backend, which meant
there was nowhere to safely hold an API key — anything shipped to the
browser is fully readable by any visitor. To satisfy the requirement that
`ODDS_API_KEY` never reach the browser, a small **Express backend** was added
at `/server`. It is the only thing that ever talks to The Odds API; the
frontend only ever talks to this backend.

```
Browser (Betora UI)  →  Express server (/server)  →  The Odds API
  no API key ever            holds ODDS_API_KEY         api.the-odds-api.com
  here                       here, never sent to
                              the browser
```

---

## 1. Files created

### Backend (`/server`)
- `server/package.json`, `server/tsconfig.json` — new Node/Express/TypeScript project
- `server/.env.example` — placeholder env vars (safe to commit)
- `server/src/config.ts` — loads `.env.local`/`.env`, exposes typed config
- `server/src/rawTypes.ts` — raw The Odds API v4 response shapes
- `server/src/types.ts` — normalized, provider-independent internal shapes
- `server/src/sportMapping.ts` — Betora sport ↔ Odds API sport-key mapping, competition friendly names, market metadata (title + category)
- `server/src/normalize.ts` — `normalizeEvent`, `normalizeSports`, `normalizeCompetitions`, plus the bookmaker-selection strategy (configured bookmaker, or best-price aggregation across all returned bookmakers)
- `server/src/cache.ts` — in-memory TTL cache with request de-duplication
- `server/src/mockData.ts` — bundled fallback data used only when `USE_MOCK_DATA=true` or no API key is configured
- `server/src/oddsApiService.ts` — the single service every route calls; owns caching, timeouts, and the mock/live switch
- `server/src/teamLogos.ts` — team crest lookup via TheSportsDB's free API, with 24h caching (round 2)
- `server/src/index.ts` — Express app and routes

### Frontend
- `.env.example` — `VITE_API_BASE_URL` placeholder
- `src/services/apiTypes.ts` — shapes returned by the Betora backend
- `src/services/oddsApi.ts` — API client + adapter converting backend responses into Betora's existing `Match`/`Sport`/`Competition` types
- `src/hooks/useSports.ts` — sports + competitions list (cached in memory for the session)
- `src/hooks/useEvents.ts` — upcoming events for one sport, tracks odds changes across refetches
- `src/hooks/useLiveEvents.ts` — polls live events on an interval
- `src/hooks/useEvent.ts` — single event detail by id, polls every 15s once the match is live (round 2)
- `src/components/MatchListStatus.tsx` — shared loading/error/empty state for match lists
- `src/utils/liveTime.ts` — approximate live match elapsed time, since the API doesn't report an exact clock (round 2)
- `INTEGRATION.md` — this file

## 2. Files modified

- `src/types/index.ts` — `MarketSelection.odds` is now `number | null` (null = suspended market, never rendered as bettable); added `marketKey`, `point`, `previousOdds`, `category` to `Market`/`MarketSelection`; added `marketKey`, `point`, `sport`, `league`, `startTime`, `oddsChanged` to `BetSelection`; added `lastUpdate`, `bookmakerTitle` to `Match`
- `src/components/OddsButton.tsx` — renders "Suspended" instead of a button when odds are `null`; shows an "Odds changed" state
- `src/components/MatchCard.tsx`, `LiveMatchCard.tsx`, `FeaturedMatchCard.tsx` — guard against `null` odds and empty markets; pass through `marketKey`/`point` when adding to the bet slip
- `src/components/PopularEventsScroller.tsx` — now takes `competitions` as a prop instead of importing mock data directly
- `src/context/AppContext.tsx` — `addToSlip` now only replaces a conflicting selection within the **same market** on the same match (previously it cleared any selection on the same match, which would have wrongly evicted a Total Goals pick when a Match Result pick was added); added `updateSlipOdds` for the odds-recheck flow
- `src/components/BetSlipContent.tsx` — periodically re-fetches the odds for matches currently in the slip and flags any selection whose price has moved ("Odds changed" banner + per-row indicator) instead of silently keeping the stale price
- `src/pages/main/Home.tsx`, `Sports.tsx`, `Competition.tsx`, `Search.tsx`, `MatchDetail.tsx` — rewritten to fetch real data via the new hooks instead of importing mock `matches`/`sports`/`competitions`; `MatchDetail` adds market-category tabs (Main/Goals/Handicap/etc., only shown when non-empty) and an "Updated moments ago" timestamp
- `src/data/mockData.ts` — removed the mock `sports`/`competitions`/`matches` (no longer used anywhere); kept everything unrelated to live odds (bet history seed data, transactions, notifications, promotions, crypto addresses, user profile) exactly as before
- `.gitignore` — added `server/node_modules`, `server/dist`, `server/.env`

## 3. What was NOT changed

Per the brief: authentication (email/password, no OTP), USD currency, Bitcoin/USDT deposit and withdrawal, Profile-based balance, Deposit/Withdraw/Transaction History inside Profile, Personal Information, Wallet Addresses, Security, Notifications, Responsible Betting, Help & Support, Home Promo Code section, My Bets, the bet slip UI/UX, the 4-tab bottom nav (Home/Sports/My Bets/Profile, no Wallet tab), and the full Betora visual identity (colors, fonts, card styles, animations).

---

## 4. Environment variables

### `server/.env.local` (create this — copy from `server/.env.example`)
```
ODDS_API_KEY=your_key_here
ODDS_API_BASE_URL=https://api.the-odds-api.com
DEFAULT_ODDS_REGION=eu
DEFAULT_BOOKMAKER=
ODDS_FORMAT=decimal
LIVE_ODDS_REFRESH_INTERVAL=15000
USE_MOCK_DATA=false
PORT=8787
CORS_ORIGIN=http://localhost:5173,http://localhost:5174
```

### `.env.local` at the project root (create this — copy from `.env.example`)
```
VITE_API_BASE_URL=http://localhost:8787
```

Neither `.env.local` file is committed (both are covered by `.gitignore`).

---

## 5. Exact commands to run the project

Two processes, in two terminals:

```bash
# Terminal 1 — backend
cd server
npm install
npm run dev          # starts on http://localhost:8787

# Terminal 2 — frontend
npm install
npm run dev           # starts on http://localhost:5173
```

For production: `npm run build && npm start` in `server/`, and `npm run build` at the root (serve the resulting `dist/` as static files, e.g. via Vercel/Netlify/Nginx). The backend needs to run somewhere persistent (Railway/Render/Fly/a VPS) since it's a long-running Node process, not a static build.

---

## 6. How to test the API connection

With no `ODDS_API_KEY` set (or `USE_MOCK_DATA=true`), the server automatically serves bundled mock data and logs a warning on startup:
```
[ODDS API] Running in MOCK DATA mode (no ODDS_API_KEY configured) — do not use this configuration in production.
```

Once a real key is in `server/.env.local` and `USE_MOCK_DATA=false`:
```bash
curl http://localhost:8787/api/health
# {"ok":true,"mockMode":false}

curl http://localhost:8787/api/sports
# real sport keys and competitions currently in season
```
If the key is invalid or the quota is exhausted, `/api/sports` returns `502` with `{"error":"Unable to load matches", ...}` — check the server console for `[ODDS API] upstream error: ...`.

## 7. How to test football

```bash
curl "http://localhost:8787/api/events?sport=football"
```
In the app: Home page → "Today's Football" section, or Sports tab → Football (selected by default) → competitions list → tap a competition.

## 8. How to test basketball

```bash
curl "http://localhost:8787/api/events?sport=basketball"
```
In the app: Sports tab → tap Basketball → competitions and events for basketball load.

## 9. How to test tennis

```bash
curl "http://localhost:8787/api/events?sport=tennis"
```
In the app: Sports tab → tap Tennis. Tennis events typically only return `h2h` (match winner) from The Odds API — set/game markets depend on what the upstream bookmakers publish for that tournament, so the match-detail category tabs will only show what's actually available (per spec item 13: never show an empty category).

## 10. How live events are refreshed

- `useLiveEvents` polls `GET /api/events/live` on an interval, default 15 seconds, configurable via `LIVE_ODDS_REFRESH_INTERVAL` in `server/.env.local` (the server reports this value back through `/api/sports`, and the frontend reads it rather than hard-coding it).
- The server itself caches live data for 10 seconds internally, so a burst of frontend polling (multiple tabs, multiple components) never causes more than one upstream call per 10-second window per sport.
- The server considers an event genuinely live only if the Odds API's `/scores` endpoint reports it as not completed and has score data — an upcoming fixture is never mislabeled as LIVE.
- Bet-slip odds are separately re-checked every 20 seconds while the slip has selections (`ODDS_RECHECK_INTERVAL_MS` in `BetSlipContent.tsx`) — if a price has moved since the user selected it, the slip shows an "Odds changed" warning rather than silently keeping the old number.

## 11. API limitations encountered

- **No single-event-by-id endpoint for pre-match odds.** The Odds API's v4 `/odds` endpoint returns all events for a sport/competition at once; there's no `/events/{id}` for upcoming odds. `getEventById` works around this by fetching (cached) upcoming events for the sport and finding the match by id — cheap in practice since the upcoming-events cache is already warm from list views.
- **Scores endpoint has no odds.** `/scores` returns live score data but not bookmaker markets, so live event detail is built by merging the scores response with a separate odds fetch for the same competition.
- **Rate limits.** The Odds API's free/lower tiers have a monthly request quota, and every competition is a separate upstream call. The server keeps this in check with per-sport caching (upcoming: 60s, live: 10s, sports list: 10 min) and request de-duplication, but pulling many competitions at once (e.g. searching across all three sports) will use quota faster than a single-sport view — worth watching usage if running on a low-tier plan.
- **Regional odds availability varies.** `DEFAULT_ODDS_REGION` (default `eu`) determines which bookmakers are queried; some competitions have far more bookmaker coverage in `us` or `uk` than `eu`. If a competition or market seems sparse, trying a different region is the first thing to check.
- **Tennis and lower-tier competitions often expose fewer markets** than top football/basketball leagues — this is upstream bookmaker behavior, not a bug in the normalization layer, and the UI already handles it correctly by only showing categories/markets that exist.
- **No exact live match minute/clock.** The Odds API's `/scores` endpoint reports score and in-progress status but not elapsed match time. The frontend derives an approximate elapsed time from kickoff instead of showing nothing or fabricating false precision (see round 2 fixes below).

## 12. Follow-up fixes (round 2)

After the initial integration, three issues were reported and fixed:

1. **Basketball competitions appearing under the Home page's "Today's Football" section.** `Home.tsx` was picking `competitions[0]` from the combined, cross-sport competitions list without filtering — so the "View All" link and Popular Events row could show whatever sport happened to be first. Fixed by deriving a football-only competitions list on Home and using that everywhere the football section needs a competition reference.

2. **Team logos.** The Odds API doesn't provide team crest images. Added `server/src/teamLogos.ts`, which looks up team badges by name via [TheSportsDB](https://www.thesportsdb.com)'s free API (`searchteams.php`, public test key `123`, no signup required), with a 24-hour server-side cache. Logos are attached to events during normalization (`homeTeamLogo`/`awayTeamLogo`), so the frontend gets them for free with each events request — no extra round-trip. `TeamCrest` renders the real image with an `onError` fallback to the existing colored-initials badge, so a missing or failed logo lookup never breaks the UI (per spec item 27). **Note:** verify outbound access to `www.thesportsdb.com` is allowed in whatever environment runs the server — some sandboxed/firewalled hosts restrict outbound domains by default.

3. **Match cards only showing Home/Draw/Away, and the live-match experience being thin.** `MatchCard` now shows up to two additional markets inline (e.g. Total Goals, BTTS) below the main Match Result row, with "+N Markets" for anything further — matching a real bookie's dense listing style. Separately, live match badges were rendering a broken bare `'` because the Odds API's live-scores endpoint doesn't report an exact match minute; added `src/utils/liveTime.ts`, which derives an honest, clearly-approximate elapsed time from kickoff (`~34'` for football, `~Live` for basketball/tennis) rather than showing broken or fabricated precision. `useEvent` (the match-detail hook) now also polls every 15 seconds once a match is confirmed live, so scores and odds actually update in place instead of being a one-time snapshot.

