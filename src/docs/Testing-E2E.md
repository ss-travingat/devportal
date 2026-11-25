---
title: Frontend E2E Tests (Playwright)
description: What the landing and admin Playwright suites cover, flow by flow, how to run them, what they can't catch, and the prioritised list of flows that still have no end-to-end test.
category: Operations
author: Travingat Engineering
updatedAt: 2026-11-25
---

# Frontend E2E Tests (Playwright)

Two Playwright suites drive a real browser against the two Next.js apps:

| Suite | App | Specs | Last full run (2026-11-25) |
| --- | --- | --- | --- |
| `travingat-landing/e2e` | app.travingat.com | `waitlist`, `explorercard`, `explorercard-extras` | chromium **100 passed**; mobile-safari **81 passed, 19 skipped** (desktop-only layouts) |
| `travingat-admin/e2e` | admin.travingat.com | `waitlist`, `featured-requests`, `dashboard`, `explorercard` | chromium **96 passed**; mobile-safari **95 passed, 1 skipped** |

Every test runs twice: Desktop Chrome (**chromium**) and an iPhone 14 profile on WebKit (**mobile-safari**). Tests that only make sense on the desktop layout skip themselves on mobile with a reason.

The unit tests are described in [Frontend Unit Tests](/tech-docs/Testing-Unit).

> **E2E is not in CI.** Both deploy pipelines run lint, unit tests, typecheck and build, then deploy. The Playwright suites are run by hand before a release or after touching one of the flows below. Visual baselines are macOS-only, so they would not pass on the Linux CI runner without regenerating them there.

## How it works

- Each suite starts its **own** `next dev` on a dedicated port (landing **3100**, admin **3101**) and never reuses a running server. That is deliberate: a `bun run dev` on :3000 would be picked up with whatever `BACKEND_URL` it was started with, and `.env.local` points that at production. The config pins `BACKEND_URL` to `http://localhost:8000`. **The suites must never run against production.**
- Two kinds of test:
  - **Mocked**: `page.route` stubs the API. Used for the UI states that are awkward to produce for real (errors, lockouts, empty lists, slow responses).
  - **Real backend**: a local Django + Postgres + Redis stack (`backend/docker-compose.test.yml`, throwaway, tmpfs). Needed wherever the page fetches **server-side** inside the Next.js server, which `page.route` cannot intercept: the Explorer Card pages (`/join/explorercard`, `/edit/explorercard`, `/explorercard`, `/ec/[id]`, `/view/explorercard/[id]`), the waitlist confirmation journey, and a few admin checks that read back what the backend stored.
- Email-code sign-in has no debug bypass. The one-time code is written to `users_otp` before the email is queued, so the helpers read it straight out of the throwaway Postgres (`docker exec ... psql`). The same helper clears the DRF throttle keys in the throwaway Redis, because OTP and admin login are rate limited for real.
- Setup, `.env.test` lines and the stop commands are in `travingat-landing/e2e/README.md` and `travingat-admin/e2e/README.md`. If the backend isn't up, the suites fail at once and say how to start it.

```bash
bunx playwright install chromium webkit           # first time on a machine
bunx playwright test                              # both projects
bunx playwright test --project=chromium e2e/waitlist.spec.ts
PWSLOWMO=500 bunx playwright test --headed        # watch it (screenshot comparisons are skipped when headed)
bunx playwright test --update-snapshots           # after an intended UI change; look at the images before committing
```

## Landing: flows covered

### Explorer Card: public share pages (`explorercard.spec.ts`)

| Flow | What is checked |
| --- | --- |
| Malformed ids | Bad `/ec/...` and `/view/explorercard/...` ids redirect to the 404 page. |
| Seeded card | The Classic, Minimal and Adventure cards each render the seeded name, country count and photos (backend-seeded, real fetch). `?style=minimal` forces a style; no `style` falls back to the saved one; a well-formed id with no card redirects to 404. Visual baseline per style. |
| Auth redirects | Signed out: `/edit/explorercard` and `/explorercard` send you to `/join/explorercard`. Signed in without a card: `/explorercard` and `/join/explorercard` send you to the editor. |
| Sign in with an emailed code | A new user lands in the editor with their email filled in; a user who already has a card lands on their card. |

### Explorer Card: create, edit, ready screen (`explorercard.spec.ts`)

| Flow | What is checked |
| --- | --- |
| Create, mobile wizard | Three steps end to end and the backend stores the card; validation and back/forward navigation between steps; visual baseline per step. |
| Create, desktop form | Creates a card in each chosen style and the backend stores it; submitting an empty form flags every field and sends nothing; a failed save (several HTTP statuses) shows the matching toast and stays in the editor. |
| Edit an existing card | Desktop: fields prefilled, **Update** disabled until something changes, the change saved. Mobile: the wizard starts from the saved card and saves the change. |
| Users with a Featured Profile | Adding a country asks "Add to your profile too?" (Cancel aborts, Yes saves to both); a country that already has photos on the profile is locked in the picker. |
| Ready screen, desktop | Share links per style (`a` Classic, `b` Minimal, `c` Adventure) and **Copy link**; single-style download is a real PNG; **All 3 styles** is a zip; **Edit** returns to the editor; visual baseline. |
| Ready screen, mobile | Share sheet builds the link and Copy confirms; download sheet lists the three styles and the zip option; visual baseline. |

### Explorer Card: extras (`explorercard-extras.spec.ts`)

| Flow | What is checked |
| --- | --- |
| Founding Explorer badge | For each style: no badge until an admin switches it on; it disappears when switched off; visual baseline with the badge; the full-UUID link shows it too; **the owner cannot switch their own badge on**, even straight against the API. |
| Privacy of the public card | Neither the share page nor the card API reveals the owner's email; the owner still gets their own email back but another signed-in user doesn't; a deleted account's card stops resolving. |
| Link previews | OpenGraph and Twitter tags for both URL shapes: with a handle the preview names the owner; the 1200x630 preview image; without a handle the generic invitation; `@name` is shown without `@@`. |
| Clicking a shared card | With a handle in the link the card opens the owner's profile; "Join me on Travingat" goes to the marketing site and does not also open the profile; no handle means the card isn't clickable. |
| Mobile share and save | Hands the PNG to the native share sheet and closes; cancelling keeps the modal open and downloads nothing; a failing share falls back to a download; no share API falls back to a download; the close button dismisses without sharing. |
| Zip download (desktop) | The zip holds all three cards as real PNG images. |
| Photo upload problems (desktop) | A file over 20 MB is refused with a message and no cropper opens; presign / storage failures and an expired session tell the user and save no card; a successful upload still saves (control). |
| Sign-in failures | Wrong code says so and stays on sign-in; the right code still works afterwards; an expired code asks for a new one; five wrong codes lock the code out, even the correct one. |

### Waitlist (`waitlist.spec.ts`)

| Flow | What is checked |
| --- | --- |
| WaitlistBar form | Valid email shows success; invalid email never calls the API; 409 shows the duplicate message; 500 shows a generic error; loading label with the button disabled while in flight. |
| WaitlistPopup | Copy and images from the landing assets folder; closes on Escape, the close button and a backdrop click (not a click on the card); locks body scroll while open and restores it; submits inside the popup; layout (close button not covered, input usable); visual baseline. |
| "Join waitlist." toast entry point | The coming-soon toast opens the popup and signs up. |
| Confirmation pages | `/waitlist/confirmed` success, `already=true`, `error=expired`, `error=invalid`, `error=server`, page title, visual baselines for success / expired / invalid. `/waitlist/confirm` without a token goes to `?error=invalid`. |
| Signup to confirm (real backend) | The emailed link confirms the spot and opening it again says already confirmed; signing up again after confirming shows the duplicate message; an expired link shows the expired page and leaves the spot unconfirmed; a token the backend never issued shows the invalid page; signing up again before confirming replaces the link and the old one stops working. |

## Admin: flows covered

| Spec | Backend | Flows |
| --- | --- | --- |
| `waitlist.spec.ts` | mocked | **Login**: empty password never calls the API, field masked, server error on a wrong password, 429 lockout countdown, success leaves `/login`, visual. **Access control**: `/users` without a session goes to `/login`. **Waitlist dashboard**: exact metric counts, every entry listed, search (email, country, city, case-insensitive) with an empty state, confirmed / unconfirmed / all filters, advanced filters (Explorer Card, Get Featured, Country, Source; Clear all), resend email for confirmed and unconfirmed users (success, failure, cancel, profile invitation variant), delete (confirm, decline, failed delete rolls back rows and counts), Explorer card section only when the entry has a card, Edit links (by handle, or create-with-email), the list is fetched once; empty and load-error states with **Retry**; visual baselines for the dashboard, filters modal and row menu. **Details panel**: person details and links, the badge switch PATCHes `show_badge` (and a failure leaves it off), Approve / Reject / Revoke / Resend invite per application state, live-profile and review-queue links, the badge switch is disabled without an Explorer Card, the panel fits a phone viewport, close button, visual. |
| `featured-requests.spec.ts` | mocked | Redirect to `/login` without a session; a failed load shows the error (not an empty list); empty state; **Sign out**; tab counts and tab filtering; card contents (name, email, country, visited count, "Unknown Name"); status pills and lifecycle links; one header only; link verification (tick for a real link, none for a missing one, socials not checked); **Approve** (sends `status=draft`, moves the applicant; failure leaves them in place); resend for approved cards (accept posts `type=featured`, decline sends nothing, failure alerts); **Reject** (reason required; Cancel clears it; failure keeps the modal and the card); visual baselines. |
| `dashboard.spec.ts` | mocked, plus one real | Home tiles (Explorer Cards, Get Featured, Profiles): counts with thousands separators, zero shown as `0`, loading dots, a dash for every kind of failure with the other tiles still loading, each tile failing independently, no session goes to login. One test reads the real count from the backend. |
| `explorercard.spec.ts` | mocked (dropdown) + **real** (editor) | Waitlist row's Explorer card menu: View link per style, Resend request, Edit opens the editor in a new tab (by handle, or a new profile for the email), an entry without a user id only offers Resend. Profile editor Step 6: one badge switch and the card style select; the switch reflects what is stored; turning the badge on/off and changing the style saves through the real `PUT /api/profiles/<id>` and is **read back from the backend**; badge-only and style-only changes; saving with no change sends nothing and says so; a real text edit and a new social link are still detected; a failed save explains why and saving again works. |

## Visual baselines

`e2e/*.spec.ts-snapshots/`, one PNG per project, macOS only (`-chromium-darwin`, `-mobile-safari-darwin`).

- Landing: shared card (3 styles, plus 3 with the badge), wizard steps (step 1 empty / filled, step 2, step 3), ready screen (desktop, mobile), editor with an existing card, waitlist popup, confirmed pages (success, expired, invalid).
- Admin: login, users dashboard, filters modal, row menu (desktop only), details panel, featured requests (new, approved, reject modal).

Review the image before committing a regenerated baseline. A baseline of a spinner passes forever.

## Helpers and traps

- `waitForHydrated` waits for React's `__reactProps$` marker. Without it a click can submit the form natively and a file input's `change` goes nowhere.
- `expectScreenshot` waits for the landing **splash** (a logo overlay shown for 0.6 to 2.5 s) to disappear and fails if it never saw one, so the wait can't pass by accident. It also hides the Next dev badge.
- The Playwright `request` fixture **keeps cookies**. After `loginViaOtp` or `loginAsAdmin` it is authenticated whatever headers you pass. For anything about what an anonymous visitor or only the owner may do, use `playwright.request.newContext()`.
- An `alert()` blocks `setInputFiles` until a dialog handler is registered.
- The local test Postgres and Redis are tmpfs: they lose all data on a Docker restart or a Mac sleep. Re-run `migrate`.
- No hard sleeps anywhere; everything waits on a condition.
- Admin pins `timezoneId: "UTC"` and `locale: "en-US"` so screenshots and dates don't depend on the machine.

## What the E2E suites do not cover

These are the flows with **no browser test today**, in the order I would add them.

### Landing

1. **Get Featured create flow** (`/get-featured/create`): email, OTP, profile, about, countries, photos, collections, submit, "under review". The most valuable product flow and it has no end-to-end test; the 1,100+ unit tests mock the hooks and the network. Needs the real backend and a fixture photo set. Include: draft autosave and resume, the "another tab is editing" lock, the requirements gate on submit (the backend returns a 400 with reasons), and a failed upload.
2. **Public profile pages** (`/<handle>`, `/profiles/<id>`, country and collection sub-pages, photo lightbox, mobile photo viewer). The `/:username` rewrite is what makes these reachable and it is only exercised indirectly. Unit coverage of this area is about 7%.
3. **Get Featured status pages**: `/get-featured` status step by state (applied, approved, draft, published, changes requested), `/get-featured/saved`, `/confirmed`, `/success` and their sign-out behaviour.
4. **Routing rules in `next.config.ts` and `proxy.ts`**: the reserved-path regex (a new top-level route must be added or it is swallowed by the profile rewrite), the production redirects to travingat.com, `/api` proxying. A single spec asserting each reserved path resolves to its own page, and an unknown path to a profile, would catch the easiest regression.
5. **Local API routes**: `upload/presign`, `image-proxy`, `locations/search`, `media-engine/optimize`, `revalidate`, `health`. Today they are only hit incidentally.
6. **Chrome around the pages**: header, footer, `404`, `global-error`, the new `ErrorProvider` / `ErrorScreen` as a user sees them.
7. **Explorer Card gaps**: cropper gestures (zoom, drag) and the saved crop per style; the country picker (search, minimum of five countries, remove); a 429 on create; the "card ready" email link back to the editor (needs a mail catcher).
8. `/featured-profiles`, `/designsystem`, `/pricing`, `/templates` render without errors (smoke only).

### Admin

1. **Profile editor, steps 1 to 5**: basics, about, photos (hero, about, per-collection, per-country), countries and per-country locations, interests, languages, collections, social links. Only Step 6 and the save/diff logic are covered; the rest of the largest screen in the app has no test.
2. **Profile review queue** (`/profiles/review`): approve, request changes, reject, and what the applicant is emailed.
3. **Profiles directory** (`/profiles`): list, search, open, bulk upload, orphan-media scanner.
4. **Recycle bin**: restore and permanent delete.
5. **Profile preview routes** (`/profiles/view/<handle>`, country, collection).
6. **`admin-profiles`** and the session middleware in `proxy.ts` (only "no cookie goes to login" is checked, via the pages above).
7. The proxied API routes (`/api/[...path]`, `check-link`, `locations`, `revalidate`).

### Across both

- **No CI run.** The most useful single change: run the Explorer Card and waitlist specs (chromium only) in GitHub Actions against `docker-compose.test.yml`, with Linux baselines.
- **No accessibility checks** (for example axe on the main pages) and **no Firefox**.
- **No real email.** Everything stops at "the backend queued it"; the content of emails is covered by backend tests only.
- Visual baselines exist for the Explorer Card and waitlist only; the profile pages, which are the most pixel-sensitive part of the product (see `handoff.md` in the landing repo), have none.

## Keeping this doc current

When you add a spec, add its flows to the table above and, if it is the first test of a flow in the gap list, delete the line from the gap list. The README in each `e2e/` folder is the runbook (setup, `.env.test` lines, helpers); this page is the map of what is covered.
