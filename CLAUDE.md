# Market-Alchemy AI

## Project Overview
Deal-scouting web app that scrapes Facebook Marketplace, OfferUp, Craigslist, and eBay, scores listings with a "Scout Score", and emails users rich digests of the best deals. Built for DiamondHacks hackathon.

## Tech Stack
- **Framework:** Next.js 15 (App Router) + TypeScript
- **Styling:** Tailwind CSS + shadcn/ui
- **Validation:** Zod
- **Database:** Supabase Postgres
- **Scraping:** Browser Use Cloud SDK v3 (Claude Sonnet 4.6)
- **LLM:** Groq (Llama 3.3 70B) for scoring + summarization
- **Email:** Resend + React Email
- **Scheduling:** node-cron (in-process)
- **Icons:** Lucide React

## Key Commands
```bash
npm run dev          # Start dev server (also boots scheduler via instrumentation.ts)
npm run build        # Production build
npm run lint         # ESLint
```

## Architecture
- `src/lib/pipeline.ts` — Core orchestrator: scrape → score → email
- `src/lib/scraper.ts` — Browser Use Cloud integration (Claude Sonnet 4.6 agents, 3 marketplaces in parallel)
- `src/lib/scorer.ts` — Groq (Llama 3.3 70B) batch scoring + summarization
- `src/lib/scheduler.ts` — node-cron job manager, bootstraps from DB on server start
- `src/lib/email.ts` — Resend wrapper for all email types
- `src/emails/` — React Email templates (welcome, magic-link, digest)
- `src/instrumentation.ts` — Next.js hook that starts scheduler on boot

## Auth Model
No passwords. Token-based only:
- `master_token` — per-user, grants access to manage page
- `alert_token` — per-alert, used for one-click unsubscribe and alert mutations

## Environment Variables
All keys go in `.env.local`:
- `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
- `BROWSER_USE_API_KEY`
- `GROQ_API_KEY`
- `RESEND_API_KEY`
- `APP_BASE_URL` (default: http://localhost:3000)
- `RESEND_FROM_EMAIL`
- `MIN_SCOUT_SCORE` (default: 40)

## Database
Schema in `supabase/schema.sql`. Three tables: `users`, `alerts`, `seen_listings`.

## Conventions
- API routes under `src/app/api/`
- Server components by default; client components only where interactivity needed
- Zod validation on all API inputs
- All tokens are 64-char hex strings from `crypto.randomBytes(32)`
