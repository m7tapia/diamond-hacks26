# Belfort Tips — PRD (Combined: Python & TypeScript Stacks)

---

## Tech Stack Options

### Option A — Python Stack
- **Frontend:** Next.js 15+ (App Router) + React + TypeScript
- **Styling:** Tailwind CSS + shadcn/ui
- **Backend:** FastAPI (Python)
- **Database:** Supabase Postgres
- **Browser Automation:** Browser Use Cloud SDK v3
- **Job Scheduling:** APScheduler or Celery Beat (Python background workers)
- **Email Delivery:** Resend
- **Validation:** Pydantic
- **Icons:** Lucide React

### Option B — TypeScript Stack
- **Frontend:** Next.js 15+ (App Router) + React + TypeScript
- **Styling:** Tailwind CSS + shadcn/ui
- **Backend:** Next.js server actions / route handlers (TypeScript)
- **Database:** Supabase Postgres
- **Browser Automation:** Browser Use Cloud SDK v3
- **Job Scheduling:** Trigger.dev or Vercel Cron Jobs
- **Email Delivery:** Resend
- **Validation:** Zod
- **Icons:** Lucide React

> Both stacks share the same product spec, UX flow, data model, and email format described below.
> The only differences are the backend language, validation library, and job scheduler noted above.

---

## 1) Product Summary

Belfort Tips is a set-it-and-forget-it deal-scouting service built for buyers and flippers who are always hunting for good deals across multiple categories at once. The user registers their email, then adds as many search alerts as they want — each with its own item, location, radius, and check-in interval. The app runs each alert on its own schedule, scraping Facebook Marketplace, OfferUp, Craigslist, and eBay, scoring every listing with a Scout Score, and emailing the user a rich per-item digest of the best-value finds. No marketplace login is required. There is no in-app review queue. The entire experience lives in the email.

---

## 2) Target Users
- Casual buyers looking for good local deals on specific items
- Serious flippers and resellers monitoring multiple product categories simultaneously
- Deal hunters who want zero ongoing effort after initial setup

---

## 3) Core Value Proposition
The app does the hard work of:
- searching four local marketplaces automatically across multiple items on user-defined schedules
- scoring and ranking every listing by value using the Scout Score model
- giving new listings a score boost so fresh deals rise to the top naturally
- delivering a rich, skimmable per-item email digest so the user never has to visit each platform manually
- letting users stop any individual item's emails instantly with one click, without affecting their other alerts

The main success metric is **email open-to-click-through rate** — the user should be able to evaluate every listing directly from the email without visiting any platform.

---

## 4) Platforms
Version 1 searches all four platforms by default on every run. No platform login or connection is required:
- Facebook Marketplace
- OfferUp
- Craigslist
- eBay

All platforms are always searched for every alert. The user does not configure which platforms to include.

---

## 5) UX / Product Flow

### 5.1 Registration (First Visit)
When a user visits the app for the first time, they enter only their **email address** and click **Get Started**. The app:
1. Creates a user record tied to that email
2. Generates a unique **master token** for that email (used for the manage page — no password ever required)
3. Sends a **welcome email** containing:
   - A link to their personal **Manage My Alerts** page (secured by master token)
   - Instructions to add their first alert
4. Redirects them to the **Add Alert** form

If the email already exists in the system, the app instead sends a **magic sign-in link** to that email which takes them directly to their Manage My Alerts page. No passwords.

### 5.2 Adding an Alert
From the Manage My Alerts page (or immediately after registration), the user fills out the **Add Alert** form:

| Field       | Description                                             | Default   |
|-------------|---------------------------------------------------------|-----------|
| Item        | What they are looking for (free text, e.g. "road bike") | —         |
| Location    | City or ZIP code                                        | —         |
| Radius      | Search radius in miles                                  | 20 miles  |
| Interval    | How often to run: Hourly / Every 6 hrs / Daily / Weekly | Daily     |

The primary action button is branded: **Start Scouting**

After submission:
- The alert is created and immediately queued for its first run.
- A first-run digest email is sent as soon as results are available.
- The alert then runs on the chosen interval automatically.
- There is no limit on the number of active alerts per user in v1.

### 5.3 Manage My Alerts Page
Every user has a personal Manage My Alerts page, accessible at a URL containing their unique master token (e.g. `/manage/{master_token}`). No login or password is required — the token IS the credential.

The page displays a list of all the user's alerts, each showing:
- Item name
- Location + radius
- Interval
- Status (Active / Paused / Cancelled)
- Date created
- Last run timestamp
- Next scheduled run timestamp
- Buttons: **Pause**, **Resume**, **Edit**, **Cancel**

From this page the user can also click **+ Add New Alert** to create another.

**Edit** opens an inline form to change the item, location, radius, or interval for that alert.
**Pause** stops the scheduler without deleting the alert or its seen-listing history.
**Resume** restarts the scheduler from where it left off.
**Cancel** permanently deletes the alert and clears its seen-listing history. A confirmation prompt is shown before cancellation.

### 5.4 Stopping a Specific Item's Emails (Option C)
There are two paths to stop receiving emails for any individual item:

#### Path 1 — One-Click Unsubscribe Per Item (in every digest email)
Every digest email for a given item contains a footer with two links:
- **"Stop [item name] emails"** — one-click link that immediately cancels only that item's alert. No confirmation page, no login. The user sees a simple "Done — you've been unsubscribed from [item] alerts" page. All other alerts for that email continue running unaffected.
- **"Manage all my alerts"** — link to the master Manage My Alerts page where the user can see and control everything.

#### Path 2 — Master Manage My Alerts Page
The user navigates to their Manage My Alerts page (via the link in any email or the welcome email) and cancels, pauses, or edits individual alerts from there.

Both paths operate on individual alerts only. Cancelling one item never affects any other item.

---

## 6) Scoring Model

### 6.1 Score Name
The combined score is called: **Scout Score**. Displayed as a number from 0–100.

### 6.2 Score Meaning
Scout Score is a blend of two equally weighted components:
- **Value score** — how underpriced the listing is relative to estimated market value for that item
- **Match score** — how closely the listing matches the user's exact item request

### 6.3 New Listing Recency Boost
Listings that were NOT present in the previous run receive a **heavy recency boost** applied on top of their raw Scout Score. Newness is treated as a first-class signal — not a minor tiebreaker. The intent is that the digest should almost always lead with new listings, and a user skimming the email should be able to immediately identify the freshest opportunities at a glance.

Boost rules:
- The boost is **large and additive**: +25 points on top of the raw Scout Score (on a 0–100 scale)
- A new listing with a below-average raw score (e.g., 45/100) becomes competitive (70/100 effective) and appears near the top
- A new listing with an average raw score (e.g., 60/100) becomes a top-tier result (85/100 effective)
- Only a genuinely exceptional older listing with a very high raw score (e.g., 90+/100) can naturally outrank a new listing — this should be rare
- The effective score is capped at 100 — a new listing cannot score above 100 even if raw + boost exceeds it
- The boost applies **only once**, on the first run the listing is detected. On all subsequent runs it is scored on raw Scout Score alone with no boost
- If every listing in a run is new (e.g., the first run of a fresh alert), the boost applies to all of them equally and raw score determines their relative order

### 6.4 Ranking Inputs
Scout Score (raw, before recency boost) considers:

| Signal                  | Weight        | Notes                                                           |
|-------------------------|---------------|-----------------------------------------------------------------|
| **Recency (new listing)**| **Very High** | **+25 pt additive boost — heaviest single signal in the system**|
| Price vs. market value  | High          | Estimated market value sourced from comparable listings         |
| Item match quality      | High          | How well the listing title/description matches the query        |
| Photo quality           | Medium        | Clarity, number of photos, presence of cover photo             |
| Description quality     | Medium        | Completeness, detail, absence of red flags                      |
| Seller reputation       | Low           | Visible on-platform rating/review info only                    |
| Radius                  | Hard cap      | Listings outside radius are excluded entirely, not penalized    |

### 6.5 Deal Explanation Bullets
Each listing in the email shows short factual bullets explaining why it scored the way it did.
Positive signal examples:
- strong local price discount (~40% below market)
- close match to requested item
- clear photos, multiple angles
- complete and detailed description
- good seller reputation (4.8★, 47 reviews)
- 🆕 new since last scan

Warning signal examples (shown when score is lower or confidence is low):
- ⚠️ price only slightly below market (~8% discount)
- ⚠️ partial match — listing may include unwanted extras
- ⚠️ low confidence — only one blurry photo
- ⚠️ low confidence — very short description
- ⚠️ new seller, no reviews

---

## 7) Email Digest Format

### 7.1 One Email Per Alert Per Run
Each alert produces its own separate email digest. If a user has 5 active alerts, they receive up to 5 separate emails per scheduled run (one per item). Emails are not bundled together in v1.

### 7.2 Email Subject Line
```
 Market-Alchemy: [X] deals found for "[item]" near [location]
```
Example: ` Market-Alchemy: 12 deals found for "road bike" near Bakersfield, CA`

### 7.3 Email Contents
The digest contains **all good-value listings** found in that run that meet the minimum Scout Score threshold. Listings are sorted by effective Scout Score (raw + recency boost), highest first.

### 7.4 Per-Listing Block
Every listing card in the email contains:

| Element                  | Description                                                                                      |
|--------------------------|--------------------------------------------------------------------------------------------------|
| **Cover photo**          | Inline image from the listing (first photo). Falls back to a placeholder if unavailable.         |
| **Rank & Title**         | e.g., `#1 — Specialized Allez Road Bike 56cm`                                                   |
| **Scout Score**          | Displayed prominently, e.g., `Scout Score: 91`                                                  |
| **🆕 NEW badge**         | Shown if the listing was not present in the previous run                                         |
| **Price**                | Listed price, e.g., `$320`                                                                       |
| **Platform**             | Source platform: Facebook Marketplace / OfferUp / Craigslist / eBay                             |
| **Distance**             | Miles from the search center, e.g., `4.1 miles away`                                            |
| **Score reason bullets** | 3–6 factual short bullets explaining why this listing scored well (or any warnings)              |
| **Description summary**  | 2–4 sentence plain-language summary of the seller's actual listing description. Written so the user can evaluate the item without clicking through. Includes condition, relevant specs, and anything notable the seller mentioned. |
| **Direct link**          | Clearly labeled button/link: `→ View on [Platform]`                                             |

### 7.5 Full Email Structure
```
────────────────────────────────────────────
   MARKET-ALCHEMY DEAL DIGEST
  Road Bike · Bakersfield, CA · April 4, 2026 · 9:00 AM
────────────────────────────────────────────

[Cover Photo — 600px wide]

#1 — Specialized Allez Road Bike 56cm                Scout Score: 91  🆕 NEW
Price: $320  |  OfferUp  |  4.1 miles away
• strong local price discount (~44% below market avg of ~$570)
• close match to requested item — road bike, correct frame size
• clear photos, 6 angles including drivetrain and frame
• detailed description — mentions year, components, and recent tune-up
• 🆕 new since last scan

Summary: Seller describes this as a 2019 Specialized Allez in excellent condition, used for
casual weekend rides. Includes Shimano Claris groupset, recently tuned up at a local shop.
No damage or repairs noted. Selling because upgrading to carbon.

→ View on OfferUp: https://offerup.com/item/detail/...

────────────────────────────────────────────

[Cover Photo — 600px wide]

#2 — Trek Road Bike 54cm — Excellent Condition       Scout Score: 86  🆕 NEW
Price: $275  |  Facebook Marketplace  |  7.8 miles away
• strong local price discount (~38% below market)
• good match — road bike, close frame size
• clear photos, 4 angles
• moderate description — condition and size mentioned but limited detail
• 🆕 new since last scan

Summary: Seller lists this as a Trek road bike in excellent condition, size 54cm.
Mentions it has been stored indoors and is ready to ride. Limited additional detail provided.

→ View on Facebook Marketplace: https://facebook.com/marketplace/item/...

────────────────────────────────────────────

#3 — Giant Contend Road Bike                         Scout Score: 79
Price: $250  |  Craigslist  |  12.3 miles away
• moderate price discount (~25% below market)
• good match to requested item
• ⚠️ only 2 photos, low resolution
• complete description

Summary: Seller describes a Giant Contend aluminum road bike, adult size medium.
Recently replaced tires and cables. Asking $250 firm, local pickup only.

→ View on Craigslist: https://bakersfield.craigslist.org/...

────────────────────────────────────────────

... [remaining listings] ...

────────────────────────────────────────────

Stop road bike emails  |  Manage all my alerts
Sent by Belfort Tips · You're receiving this because you set up a "road bike" alert.
```

### 7.6 Minimum Quality Threshold
Listings with a Scout Score (after boost) below a minimum threshold are excluded from the digest entirely. The threshold is configurable internally and not exposed to the user in v1. If no listings meet the threshold in a given run, no email is sent for that alert in that run (silent skip — no "nothing found" email).

---

## 8) Scheduled Job Behavior

### 8.1 Per-Run Steps
Each scheduled job run for an alert does the following in order:
1. Scrape all four platforms for the configured item + location + radius
2. For each listing found, check the `seen_listings` table to determine if it is new
3. Apply recency boost to new listings
4. Score and rank all listings by effective Scout Score
5. Filter out listings below the minimum quality threshold
6. If at least one listing passes the threshold, send the digest email
7. If no listings pass the threshold, skip silently (no email)
8. Write all newly seen listing IDs to the `seen_listings` table
9. Update `last_run_at` on the alert record

### 8.2 Job States

| State     | Behavior                                                                 |
|-----------|--------------------------------------------------------------------------|
| active    | Runs on schedule, emails sent as normal                                  |
| paused    | Job exists in scheduler but skips all execution until resumed            |
| cancelled | Job removed from scheduler, alert and seen_listing records deleted       |

### 8.3 Interval Options

| Label        | Actual cadence                  |
|--------------|---------------------------------|
| Hourly       | Every 60 minutes                |
| Every 6 hrs  | Every 6 hours                   |
| Daily        | Once every 24 hours             |
| Weekly       | Once every 7 days               |

---

## 9) Data Model (Supabase Postgres)

### users table
| Column       | Type        | Description                                         |
|--------------|-------------|-----------------------------------------------------|
| id           | uuid PK     |                                                     |
| email        | text UNIQUE | User's email address                                |
| master_token | text UNIQUE | Secure token for manage page access (no password)   |
| created_at   | timestamptz |                                                     |

### alerts table
| Column        | Type        | Description                                         |
|---------------|-------------|-----------------------------------------------------|
| id            | uuid PK     |                                                     |
| user_id       | uuid FK     | References users.id                                 |
| alert_token   | text UNIQUE | Per-alert secure token for one-click unsubscribe    |
| item          | text        | Search item (e.g., "road bike")                     |
| location      | text        | City or ZIP code                                    |
| radius_miles  | int         | Search radius                                       |
| interval      | text        | hourly / 6h / daily / weekly                        |
| status        | text        | active / paused / cancelled                         |
| created_at    | timestamptz |                                                     |
| last_run_at   | timestamptz | Timestamp of last completed run                     |
| next_run_at   | timestamptz | Timestamp of next scheduled run                     |

### seen_listings table
| Column         | Type        | Description                                        |
|----------------|-------------|----------------------------------------------------|
| id             | uuid PK     |                                                    |
| alert_id       | uuid FK     | References alerts.id                               |
| platform       | text        | facebook / offerup / craigslist / ebay             |
| listing_id     | text        | Platform-specific listing identifier               |
| first_seen_at  | timestamptz |                                                    |

---

## 10) API Endpoints

### Python Stack (FastAPI)

| Method | Endpoint                        | Description                                               |
|--------|---------------------------------|-----------------------------------------------------------|
| POST   | `/users`                        | Register email, create user + master_token, send welcome  |
| POST   | `/users/signin`                 | Send magic sign-in link to existing email                 |
| GET    | `/manage/{master_token}`        | Load manage page — returns all alerts for this user       |
| POST   | `/alerts`                       | Create new alert (requires master_token in body/header)   |
| PATCH  | `/alerts/{alert_token}`         | Update item, location, radius, interval, or status        |
| DELETE | `/alerts/{alert_token}`         | Cancel alert (unsubscribe) — used by one-click link       |
| GET    | `/unsubscribe/{alert_token}`    | One-click unsubscribe handler (GET for email link compat) |

### TypeScript Stack (Next.js route handlers)

Same endpoints, implemented as Next.js App Router route handlers under `/app/api/`.

---

## 11) Technical Requirements
- Stateless scraping — no marketplace logins required for any platform
- Each alert runs as an independent scheduled job
- Per-alert and per-user tokens generated using cryptographically secure random bytes
- Previously seen listing IDs tracked in Supabase to determine new vs. old on each run
- Cover photos fetched and either embedded inline (base64) or served as hosted image URLs in email
- Description summarization done via LLM call per listing (brief, factual, 2–4 sentences)
- Scout Score computation done server-side before email generation
- Resend used for all transactional email delivery
- All user-facing links in emails use tokens — no session cookies or auth headers needed

**Python-specific:**
- Pydantic models for all request/response validation
- APScheduler (in-process) or Celery + Redis for distributed job scheduling
- Background workers handle scraping + scoring + email send asynchronously

**TypeScript-specific:**
- Zod schemas for all input validation
- Trigger.dev jobs (or Vercel Cron + queue) handle scraping + scoring + email send
- Server actions used for form submissions on the frontend

---

## 12) Non-Goals for v1
- No in-app listing review queue
- No messaging or contacting sellers through the app
- No user passwords or traditional auth
- No extra search filters beyond item, location, and radius
- No sorting controls exposed to the user
- No platform selection — all four platforms always searched
- No bundled multi-item digest (one email per alert)
- No mobile-first design requirement (setup form must be functional on mobile but not optimized)
- No price history tracking
- No push/SMS notifications

---

## 13) Acceptance Criteria
The MVP is successful when:
- a new user can register with just their email and immediately receive a welcome email with their manage page link
- the user can add multiple alerts (different items, locations, radii, intervals) from the manage page
- each alert runs independently on its own schedule without any user action
- each digest email contains all qualifying listings with: cover photo, rank, Scout Score, 🆕 NEW badge (where applicable), price, platform, distance, reason bullets, description summary, and a direct platform link
- new listings are visually flagged (🆕 NEW) and naturally appear near the top of the digest via the recency boost, unless outscored by an exceptional older listing
- every digest email contains a **"Stop [item] emails"** one-click link that immediately cancels only that item's alert, with no effect on other alerts
- every digest email contains a **"Manage all my alerts"** link to the master manage page
- the manage page (secured by master token) correctly shows all alerts with their status, last run time, and next run time
- the user can pause, resume, edit, or cancel any individual alert from the manage page
- cancelling an alert from either path (one-click or manage page) stops all future runs for that alert only
- if no qualifying listings are found in a run, no email is sent and the next run schedules as normal
- the app correctly identifies new listings on each run using the seen_listings table
- the recency boost is only applied on a listing's first appearance, not on subsequent runs
