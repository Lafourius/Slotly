# Slotly

A mobile-first booking product for independent Indian service businesses. Owners publish a booking page, customers book without an account, and every appointment is managed from one dashboard.

Built for the pilot segment: tutors and small education businesses.

## What works

- **Owner accounts** — email/password sign up, sign in, password reset, session refresh and route protection via Supabase Auth.
- **Onboarding** — business name, category, city, timezone and a unique public booking slug.
- **Services** — create, edit, reorder-free CRUD with durations, prices, buffers, activation and safe deletion (services with appointment history must be deactivated).
- **Availability** — weekly opening hours per weekday, recurring breaks, date exceptions (closed, blocked hours, extra hours) and atomic saving.
- **Public booking** — service → date → slot → details, with live server-generated slots, timezone-aware display, rate limiting and duplicate protection. No customer account and no payment.
- **Appointment workflow** — pending → confirmed → completed, plus reject and cancel, each recorded in an activity feed.
- **Dashboard** — today's schedule, pending approvals, upcoming confirmed appointments and setup checklist.
- **Calendar and customers** — month calendar with day agenda, plus customer summaries and booking history.
- **Settings** — business profile, logo upload, booking mode (manual approval or instant confirmation) and share tools.

## Stack

- Next.js 16 (App Router, server actions), React 19, TypeScript strict
- Tailwind CSS v4 with custom design tokens
- Supabase: Postgres, Auth, RLS, Storage
- Zod validation, Luxon timezone handling, Vitest

## Local setup

Requirements: Node.js 20+ and npm.

```bash
npm ci
cp .env.example .env.local   # then fill in your Supabase values
npm run db:push              # applies supabase/migrations/*.sql
npm run db:seed              # optional demo data
npm run dev
```

Open <http://localhost:3000>.

### Environment variables

| Variable | Where it is used |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Browser and server Supabase clients |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Browser and server Supabase clients |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only admin client (seeding, storage, booking writes). Never expose or commit it. |
| `SUPABASE_DB_URL` | Migration and test scripts only. Session pooler connection string from Supabase → Connect. |
| `NEXT_PUBLIC_APP_URL` | Public origin used in share links. No trailing slash. |

`ALLOWED_DEV_ORIGINS` is optional and only needed when running the dev server behind a proxy (comma-separated origins).

## Database and security model

Migrations live in `supabase/migrations`:

1. `20260101000000_init.sql` — tables, indexes, RLS policies, the `appointments_no_overlap` GiST exclusion constraint.
2. `20260101000100_public_booking.sql` — security-definer public read RPCs; all `anon` table access revoked.
3. `20260101000200_owner_functions.sql` — transactional availability saving and the `create_public_booking` RPC.
4. `20260101000300_storage.sql` — logo bucket and storage policies.

Key guarantees:

- Every owner table is protected by RLS scoped through `auth.uid()` → `businesses.owner_id`. One business per owner.
- `anon` cannot select any table directly. It can only call public RPCs that return business details, active services, busy intervals and booking context — never customer names, contact details, notes or analytics.
- Public booking writes are granted only to `service_role`. The Next.js server validates the requested slot against generated availability, then calls `create_public_booking`.
- `create_public_booking` takes a per-business advisory lock and relies on the exclusion constraint over `[start_at, buffer_end_at)`, so concurrent requests for the same slot produce exactly one appointment. Buffer time is part of the blocked range.
- Analytics events contain no PII. Public rate limits are stored as hashed keys in the database.

## Scripts

```bash
npm run dev          # development server
npm run build        # production build
npm start            # production server
npm run typecheck    # tsc --noEmit
npm test             # booking engine unit tests (Vitest)
npm run db:push      # apply pending SQL migrations
npm run db:seed      # seed demo businesses (requires service role + DB URL)
npm run test:security # live RLS, public-surface, overlap and concurrency checks
```

`npm run db:seed` creates two confirmed demo owners, each with a business, services and weekly hours:

| Booking page | Owner | Mode |
| --- | --- | --- |
| `/book/bright-tuition` | `demo@slotly.app` | Manual approval |
| `/book/canvas-and-co` | `priya@canvasco.example` | Instant confirmation |

Both demo accounts use the password `SlotlyDemo2026`. This is sample data only — never keep these credentials in a production project.

## Deployment (Vercel)

1. Push the repository to GitHub and import it in Vercel. The default Next.js build settings work.
2. Add the environment variables above to the Vercel project (Production and Preview). Use the deployed origin for `NEXT_PUBLIC_APP_URL`.
3. Run `npm run db:push` against the production Supabase project before the first deployment.
4. In Supabase → Authentication → URL Configuration, set the Site URL to the deployed origin and add `https://<your-domain>/auth/callback` to the redirect allow list.
5. Deploy. The service-role key must stay server-only; it is never sent to the browser.

No payment gateway, calendar sync, WhatsApp/SMS automation or marketplace is part of this scope.

## Booking engine tests

`tests/booking-engine.test.ts` covers slot generation: working hours, breaks, date exceptions, service duration, buffer, past-slot exclusion, timezone/DST boundaries and conflict handling.

```bash
npm test
```
