# Market-Alchemy AI — Implementation Plan

## Context
Building a deal-scouting web app for DiamondHacks hackathon. Users register with email, create search alerts for items on local marketplaces, and receive rich email digests with scored listings. Priority: working end-to-end demo, hackathon speed.

## Stack
- Next.js 15 (App Router) + TypeScript + Tailwind + shadcn/ui + Zod + Lucide React
- Supabase Postgres (DB) + Resend (email) + Browser Use Cloud SDK v3 (scraping) + Gemini 2.0 Flash (scoring/summarization)
- node-cron (local scheduler) + Next.js instrumentation hook for bootstrap

## Directory Structure
```
src/
├── app/
│   ├── layout.tsx, page.tsx              # Root layout + landing/registration
│   ├── manage/[masterToken]/page.tsx     # Manage alerts page
│   ├── unsubscribed/page.tsx             # Unsubscribe confirmation
│   └── api/
│       ├── users/route.ts                # POST register
│       ├── users/signin/route.ts         # POST magic link
│       ├── alerts/route.ts               # POST create alert
│       ├── alerts/[alertToken]/route.ts  # PATCH update, DELETE cancel
│       ├── manage/[masterToken]/route.ts # GET load alerts
│       ├── unsubscribe/[alertToken]/route.ts # GET one-click unsub
│       └── cron/trigger/route.ts         # POST manual trigger for testing
├── lib/
│   ├── supabase.ts       # Supabase service-role client
│   ├── tokens.ts         # crypto.randomBytes token gen
│   ├── validators.ts     # Zod schemas
│   ├── scraper.ts        # Browser Use Cloud — scrape 4 marketplaces
│   ├── scorer.ts         # Gemini 2.0 Flash — score + summarize
│   ├── email.ts          # Resend wrapper
│   ├── scheduler.ts      # node-cron job manager
│   ├── pipeline.ts       # Orchestrator: scrape → score → email
│   └── constants.ts      # Intervals, thresholds
├── components/
│   ├── ui/               # shadcn primitives
│   ├── registration-form.tsx
│   ├── alert-form.tsx
│   ├── alert-card.tsx
│   └── alert-list.tsx
├── emails/
│   ├── welcome.tsx       # Welcome email template
│   ├── magic-link.tsx    # Magic sign-in template
│   └── digest.tsx        # Deal digest template
├── types/index.ts
└── instrumentation.ts    # Starts scheduler on server boot
```

## Environment Variables (.env.local)
```
NEXT_PUBLIC_SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
BROWSER_USE_API_KEY=
GEMINI_API_KEY=
RESEND_API_KEY=
APP_BASE_URL=http://localhost:3000
RESEND_FROM_EMAIL=Market-Alchemy <alerts@yourdomain.com>
MIN_SCOUT_SCORE=40
```

## Database Schema (run in Supabase SQL editor)
```sql
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  master_token TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  alert_token TEXT UNIQUE NOT NULL,
  item TEXT NOT NULL,
  location TEXT NOT NULL,
  radius_miles INT NOT NULL DEFAULT 20,
  interval TEXT NOT NULL DEFAULT 'daily'
    CHECK (interval IN ('hourly', '6h', 'daily', 'weekly')),
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'paused', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT now(),
  last_run_at TIMESTAMPTZ,
  next_run_at TIMESTAMPTZ
);

CREATE TABLE seen_listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_id UUID NOT NULL REFERENCES alerts(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  listing_id TEXT NOT NULL,
  first_seen_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (alert_id, platform, listing_id)
);

CREATE INDEX idx_alerts_user_id ON alerts(user_id);
CREATE INDEX idx_alerts_status ON alerts(status);
CREATE INDEX idx_alerts_alert_token ON alerts(alert_token);
CREATE INDEX idx_seen_listings_alert_id ON seen_listings(alert_id);
CREATE INDEX idx_users_master_token ON users(master_token);
```

## Build Phases

### Phase 1: Project Skeleton (~30 min)
1. `npx create-next-app@latest` with TypeScript, Tailwind, App Router, src dir
2. `npx shadcn@latest init` + add button, input, card, badge, select, label, separator
3. Install: `@supabase/supabase-js resend @react-email/components browser-use @google/genai node-cron zod lucide-react`
4. Dev deps: `@types/node-cron`
5. Create `.env.local`, `src/lib/supabase.ts`, `src/lib/tokens.ts`, `src/lib/validators.ts`, `src/types/index.ts`, `src/lib/constants.ts`

### Phase 2: Registration + Manage Page (~1 hr)
6. `POST /api/users` — register or send magic link if email exists
7. `POST /api/users/signin` — send magic link
8. Email templates: `welcome.tsx`, `magic-link.tsx`
9. `src/lib/email.ts` — Resend wrapper (sendWelcome, sendMagicLink, sendDigest)
10. Landing page (`page.tsx`) + `registration-form.tsx`
11. `GET /api/manage/[masterToken]` — fetch user's alerts
12. Manage page + `alert-list.tsx` + `alert-card.tsx`

**Checkpoint: Register → welcome email → manage page works.**

### Phase 3: Alert CRUD (~45 min)
13. `POST /api/alerts` — create alert
14. `PATCH /api/alerts/[alertToken]` — update fields/status
15. `DELETE /api/alerts/[alertToken]` — cancel
16. `GET /api/unsubscribe/[alertToken]` — one-click unsub → redirect to confirmation
17. `unsubscribed/page.tsx` — confirmation page
18. `alert-form.tsx` — add/edit form on manage page

**Checkpoint: Full alert CRUD through UI.**

### Phase 4: Scraping Pipeline (~1.5 hr)
19. `src/lib/scraper.ts` — Browser Use Cloud wrapper
    - `scrapeAll(item, location, radius)` runs 4 platforms in parallel via `Promise.allSettled`
    - Each platform: construct URL, send Browser Use prompt to extract structured listing data
    - Returns `RawListing[]`
20. `src/lib/scorer.ts` — Gemini 2.0 Flash
    - Single batch call per alert with all listings
    - Returns value_score + match_score + reason bullets + summary per listing
    - Apply +25 recency boost for new listings (not in seen_listings)
    - Cap at 100
21. `src/lib/pipeline.ts` — orchestrator
    - Load alert → scrapeAll → load seen_listings → scoreListings → filter by threshold → sendDigest → upsert seen_listings → update timestamps

### Phase 5: Email Digest (~45 min)
22. `src/emails/digest.tsx` — React Email template
    - Header: item, location, date
    - Per listing: cover photo, rank+title, Scout Score, NEW badge, price/platform/distance, reason bullets, summary, "View on [Platform]" link
    - Footer: "Stop [item] emails" + "Manage all my alerts" links
23. Wire sendDigest in `email.ts`

### Phase 6: Scheduler (~30 min)
24. `src/lib/scheduler.ts` — node-cron job manager
    - `scheduleAlert`, `pauseAlert`, `resumeAlert`, `cancelAlert`
    - `bootstrapScheduler` — load all active alerts on boot
    - Interval map: hourly=`0 * * * *`, 6h=`0 */6 * * *`, daily=`0 9 * * *`, weekly=`0 9 * * 1`
25. `src/instrumentation.ts` — calls `bootstrapScheduler()` on server start
26. Enable in `next.config.ts`: `experimental: { instrumentationHook: true }`
27. Manual trigger route: `POST /api/cron/trigger` for testing

### Phase 7: Polish (~30 min)
28. Dark theme with gold/amber accents ("Alchemy" branding)
29. Loading states, toasts, error handling
30. First-run-on-create behavior (fire pipeline immediately when alert created)
31. End-to-end test of full flow

## Pipeline Flow
```
node-cron fires → pipeline.ts:
  1. Load alert from DB
  2. scraper.ts: scrapeAll() — 4 platforms in parallel via Browser Use Cloud
  3. Load seen_listings from Supabase
  4. scorer.ts: scoreListings() — single Gemini batch call
  5. Apply +25 recency boost for new listings, cap at 100
  6. Filter below MIN_SCOUT_SCORE
  7. If listings remain → email.ts: sendDigest() via Resend
  8. Upsert new listings into seen_listings
  9. Update alert.last_run_at + next_run_at
```

## Key Design Decisions
- **Browser Use prompts**: each marketplace gets a specific URL + extraction prompt. Use `Promise.allSettled` so one failure doesn't block others
- **Gemini batch scoring**: all listings in one API call per alert (not per-listing) for speed
- **Cover photos**: direct `<img src>` to marketplace CDN URLs (no download/base64 for demo)
- **Token auth**: 64-char hex from `crypto.randomBytes(32)`, no middleware needed
- **node-cron in-process**: jobs lost on restart but `bootstrapScheduler` reloads from DB on boot

## Verification
1. Register with email → check Resend dashboard for welcome email
2. Visit manage page via link in email → see empty alert list
3. Add alert (e.g. "road bike", "San Diego, CA", 20mi, daily) → verify in Supabase
4. Hit manual trigger endpoint → check server logs for scrape results + Gemini scores
5. Check inbox for digest email with scored listings
6. Click "Stop [item] emails" in digest → verify alert cancelled
7. Pause/resume/edit alerts from manage page → verify status changes
8. Restart dev server → verify scheduler picks up active alerts
