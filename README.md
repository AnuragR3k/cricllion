# Cricllion

The daily cricket dive. Seven cricket questions, twenty-five seconds each, one innings per day. The rarer your answer, the deeper it goes — say what everyone says and you get a single; find the answer nobody remembers and you've hit a Six.

A from-scratch clone of the Krillion.io mechanics, re-themed for all-time cricket. No accounts, no payments, no archive, no party mode. One daily game only.

## Rules

- 7 prompts per day (one per ball), answered in order.
- 25 seconds per prompt (client timer; the run is capped server-side at 10 minutes).
- Each answer is matched against a curated bank and scored by rarity:
  - Duck 0 🦆 — no answer in time (a miss or a time-out)
  - Single 1 🏃 — the obvious answer everyone gives
  - Leg Bye 10 🦵 — a run nobody meant to score
  - Slog 50 💥 — the famously clever pick everyone swings at
  - Two 100 ✌️ — solid, keeps the innings moving
  - Four 200 🏏 — genuinely uncommon
  - Six 500 🏆 — the rare gem, one in a million
- Max score 3500 (7 × Six).
- Score bands: 0–700 Duck, 701–1400 Slog, 1401–2100 Four, 2101–3500 Six.
- Resets at midnight IST (18:30 UTC). Day 1 was 2026-11-24.
- Spelling is forgiven: normalised exact match, alias match, and transposition-aware fuzzy matching with an ambiguity guard.

## Quick start

Requires Node 24 (uses the built-in `node:sqlite`, no native module).

```bash
npm install          # install dependencies
npm run seed         # optional: seed/re-seed the SQLite content DB
npm run dev          # start dev server on port 4310
```

Open http://localhost:4310.

Scripts:
- `npm run dev` — Next.js dev on port 4310
- `npm run build` — production build
- `npm run start` — production server on port 4310
- `npm run seed` — (re)seed `.data/cricllion.db`
- `npm test` — content, normalisation, matching, and schedule checks

## How it works

**Answer matching** (`lib/normalize.ts`, `lib/db.ts`)
Answers are normalised (case-folded, accents and articles stripped, punctuation flattened). Matching tries, in order: exact normalised key, alias, then transposition-aware fuzzy match within an edit budget that grows with answer length (0 for short keys, 1 for medium, 2 for long). If two candidates tie at the best distance, the answer is treated as a miss (ambiguity guard).

**Signed receipts** (`lib/receipts.ts`)
Every accepted answer issues an HMAC-SHA256-signed receipt (secret in `.data/receipt-secret`, or `RECEIPT_SECRET` env var). On completion, every receipt is re-verified before the scorecard is filed, so a run can't be forged client-side.

**SQLite** (`lib/db.ts`)
`.data/cricllion.db` (gitignored). Tables: `meta`, `prompts`, `answers`, `answer_keys`, `days`, `day_prompts`, `runs`, `submissions`, `popularity`. Content is seeded from `lib/content.ts` and re-seeded automatically when the content version hash changes.

**Daily scheduler** (`lib/schedule.ts`)
Day boundary is midnight IST. The prompt bank is deterministically shuffled (mulberry32) and walked seven prompts at a time, re-shuffled each cycle, so no prompt repeats within a cycle and the deck reshuffles before prompts come back around.

**API routes** (all in `app/api/`)

| Method | Path | Request | Response |
|--------|------|---------|----------|
| GET | `/api/today?date=` | optional `date` (YYYY-MM-DD) | `{ date, dayNumber, resetsAt, prompts: [{id, text}] }` |
| POST | `/api/submit` | `{ date, promptId, answer, playerId, runId }` | `{ accepted, slot, tier, answer, displayAnswer, score, quip, receipt, nextPromptId }` |
| POST | `/api/today/complete` | `{ date, playerId, runId }` | `{ completed, runId, date, dayNumber, score, results[], streak, band, completedAt }` |
| GET | `/api/status?date=&playerId=` | query params | `{ completed }` or `{ completed, ...summary }` |
| GET | `/api/reveal?date=` | optional `date` | `{ date, dayNumber, prompts: [{ id, slot, text, answers[] }] }` |
| GET | `/api/answer-popularity?date=` | optional `date` | `{ date, prompts: { [promptId]: { [answer]: count } } }` |

All routes are force-dynamic and return `cache-control: no-store`.

**Content model**
- Curated prompts: add to `CURATED_PROMPTS` in `content/prompts.ts` (`{ id, text, category, answers: [{ answer, tier, aliases, quip? }] }`). Exactly one `superover` answer per prompt.
- Generated player prompts: add players to `content/players.ts` (`{ name, country, teams, role, fame, flags?, bat?, style?, aliases?, note? }`) and a spec to `lib/content.ts`. `fame` 5→duck, 4→two, 3→four, 2→six, 1→superover; the lowest-fame player becomes the gem.
- Run `npm run seed` to (re)seed the DB; `npm test` validates every prompt has exactly one superover.

## Project layout

```
cricllion/
  app/
    layout.tsx, page.tsx, globals.css
    api/
      today/route.ts
      submit/route.ts
      today/complete/route.ts
      status/route.ts
      reveal/route.ts
      answer-popularity/route.ts
  components/
    Game.tsx
  content/
    players.ts      (~300 all-time players)
    prompts.ts      (12 hand-curated banks)
  lib/
    tiers.ts        (tier ladder, score bands, constants)
    normalize.ts    (normalisation, edit distance, fuzzy budget, variants)
    content.ts      (prompt bank build, version, validation)
    schedule.ts     (IST date, seeded deck, day number)
    db.ts           (SQLite schema, seed, matching, runs, receipts)
    receipts.ts     (HMAC signed receipts)
    constants.ts    (slots, run TTL, max answer length)
    summary.ts      (run summarisation, score bands)
    client-types.ts (shared TS types)
    api.ts          (route helpers)
  scripts/
    test.ts         (content + matching + schedule checks)
    api.test.ts     (API flow integration test)
    seed.ts         (DB seed smoke test)
  .data/            (gitignored: SQLite DB + HMAC secret)
```

## Limitations and next steps

- Daily game only: no archive/unlimited UI, no accounts, no payments, no party mode. (Past days are readable via the `?date=` query, but there's no archive shell.)
- The prompt deck reshuffles every cycle; with ~39 prompts you get roughly 5-6 unique days before a cycle repeats. Extending content is pure data work.
- The client-side 25s timer is not server-authoritative per prompt; the run is capped server-side at 10 minutes.
- `npm test` covers content, normalisation, matching and scheduling. `scripts/api.test.ts` exercises every route against the real handlers.

## Credits

Mechanics inspired by Krillion.io. All cricket data curated for this project. Not affiliated with Krillion.io or any cricket league or board.
