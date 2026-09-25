# Betora — Sports Betting UI/UX MVP (v7)

A mobile-first sports betting platform built with React, TypeScript, and Tailwind CSS, backed by a small Express server that proxies real sports data and odds from The Odds API. See **[INTEGRATION.md](./INTEGRATION.md)** for the full details of the live-data integration — architecture, files changed, environment variables, and how to test each sport.

## Getting started

Two processes:

```bash
# Backend — proxies The Odds API, keeps the API key server-side
cd server
npm install
cp .env.example .env.local   # fill in ODDS_API_KEY, or leave USE_MOCK_DATA=true for local dev
npm run dev                   # http://localhost:8787

# Frontend — in a second terminal, from the project root
npm install
npm run dev                   # http://localhost:5173
```

Without a configured `ODDS_API_KEY`, the backend automatically serves bundled mock data so the app is fully usable for local development without an API key.

## Build for production

```bash
# Backend
cd server && npm run build && npm start

# Frontend
npm run build && npm run preview
```

## What's included (v6 — fixed bottom nav & bet slip sheet on mobile)

- **Fixed the bottom nav and bet slip sheet not staying fixed on mobile**: the horizontal-overflow guard added in v4 had `overflow-x: hidden` on `#root`, which breaks `position: fixed` on descendant elements in mobile browsers (the fixed element gets bound to the nearest overflow-clipped ancestor instead of the viewport). Moved the overflow guard to `html`/`body` only — the bottom nav, floating bet slip button, and bet slip bottom sheet now correctly stay pinned to the bottom of the screen on mobile.

## Previous revisions (v5 — guest browsing, banner, toggle-off odds)

- Guest browsing mode (Home/Sports/Match Detail/Search/My Bets/Profile all viewable without login; Deposit/Withdraw/Place Bet prompt login); Header shows Login/Sign Up when logged out; odds now toggle off when tapped again; "View Match" link on Live Now cards; new Crypto Deposit Bonus banner on Home; guest login prompts on My Bets/Profile

## Previous revisions (v4 — floating slip, booking codes, crypto withdrawals)

- Floating circular bet slip button visible everywhere; booking codes to share/load a set of selections; crypto-only withdrawals (BTC/USDT) mirroring the deposit flow; fixed mobile horizontal overflow on match cards

## Previous revisions (v3 — sportsbook density refinement)

- Compact, dense sportsbook UI; team crests (generated initials, no real logos); odds change indicators; Live Now/Featured Match/Popular Events sections; league headers; green-selected sports pills; more sports (Racing, Table Tennis)

## Earlier revisions (v2)

- USD currency, no phone/OTP auth, 4-tab bottom nav (no Wallet tab), Profile as account hub with balance card, crypto-only deposits (Bitcoin/USDT with official brand icons), Transaction History under Profile, Promo Code section on Home

## Notes for connecting real data later

- All mock data lives in `src/data/mockData.ts` — swap this for real API calls.
- Crypto deposit addresses are in `cryptoAddresses` in `mockData.ts` — replace with addresses generated per-user by your payment processor.
- Global state (balance, bet slip, placed bets, notifications, promo codes) is in `src/context/AppContext.tsx` — this is the seam where you'd wire in a real backend, auth, and a crypto payment provider.
- Deposits are recorded as `pending` and do not credit the balance automatically — wire this to real webhook/confirmation events from your payment processor.
- Authentication is currently a mock toggle (`login()`/`logout()` in context) with no real backend — replace with real session/token handling.
