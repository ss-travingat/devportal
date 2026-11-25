---
title: Frontend Unit Tests (Vitest)
description: What the landing and admin Vitest suites test, area by area, with measured coverage, how to run them, and the prioritised list of code that still has no unit test.
category: Operations
author: Travingat Engineering
updatedAt: 2026-11-25
---

# Frontend Unit Tests (Vitest)

The two Next.js apps each have a Vitest suite (jsdom, React Testing Library, `@testing-library/jest-dom`). They run on **every deploy**: the GitHub workflows run lint, `bun run test`, `tsc --noEmit` and (landing) `next build` before the deploy job starts, so a failing unit test blocks a release.

| Suite | Test files | Tests | Result (2026-11-25) | Line coverage |
| --- | --- | --- | --- | --- |
| `travingat-landing/tests` | 68 | **2,711** | all pass | **37.0%** (branches 33.3%) |
| `travingat-admin/tests` | 7 | **195** | all pass | **3.8%** (branches 5.0%) |

Coverage is from a V8 run, lines of `src/**`, **unit tests only**: the Playwright suites ([Frontend E2E Tests](/tech-docs/Testing-E2E)) are not counted. The headline numbers understate real protection (the Explorer Card pages, waitlist and admin dashboards are exercised by E2E), and they say nothing about test quality. Use them to find the files nothing exercises.

The backend has its own Django suite (463 tests) and is not described here.

## Running

```bash
bun run test                    # vitest run (what CI runs)
bun run test:watch              # watch mode
bunx vitest run tests/explorercard   # one folder
bunx vitest run -t "badge"           # by test name
npx tsc --noEmit                # typecheck (also a CI step)
```

Config (`vitest.config.ts`, same in both repos): environment `jsdom`, `globals: true`, setup file `tests/setup.ts` (loads jest-dom matchers), `e2e/` excluded, alias `@` to `src` (landing also `@landing`).

**Measuring coverage.** The coverage provider is deliberately not a dependency. To get numbers, install it temporarily and put the files back:

```bash
bun add -d @vitest/coverage-v8@5.1.0
bunx vitest run --coverage --coverage.provider=v8 --coverage.reporter=text --coverage.include='src/**/*.{ts,tsx}'
git checkout package.json bun.lock
```

## Landing (`travingat-landing/tests`)

| Area | Files | Tests | What it checks |
| --- | --- | --- | --- |
| `getfeatured/create` (the `/get-featured/create` flow) | 37 | 1,168 | Every step and modal of the Get Featured create flow, one file per component: email, OTP, profile, about, countries, add-photos, collections, status/"under review"; the about / interests / languages / location / social-links modals; photo selection and upload modals, progress, context menus, the sortable photo grid; delete and upload confirmations; session notices (another-tab banner, syncing overlay, interaction shield); the stepper and modal tabs. Also the form validation schemas (profile, about, countries, email, OTP), the requirements constants, and the hooks: request/verify OTP, prefill, save profile. The flow component test (`get-featured-create-flow`, 69 tests) drives the steps together. Feature coverage is about **89%** of lines. |
| `getfeatured` (the older `/get-featured` form) | 7 | 348 | The email-verification form (99 tests), form step (108), OTP step, email step, **status step** (53: what the applicant sees per application state), and the two page shells. |
| `explorercard` | 9 | 329 | **Cards** (`cards-pixel`, 143): Classic, Minimal and Adventure render the right name, country count, flags, notches and watermarks, including the empty-flags state and the Founding Explorer badge on all three styles. **Editor page** (`expcard-page`, 51). **Mobile share and download modals** (34 and 26): link building, copy, native share and fallbacks, which sheet options appear. **Country sync confirm** modal (27), **country resolution** (21: name or code to flag/country info), **both pickers list every country** (8), **link-preview metadata** (9: handle parsing, `@name` handling, title/description), **click wrapper** (10: handle trimming, opens the profile only when there is a handle, "Join me" doesn't also open it). |
| `lib` | 4 | 572 | `countries-resolution` (552): every country offered by the pickers resolves by name, alias and code, plus the specific bugs reported in production; `user-session` (15: the `access_token` cookie, `/api/auth/me`, trying each token the browser sent); `media-resolver` (3); upload size limit (2). |
| `waitlist` | 5 | 246 | `WaitlistBar` (46), `WaitlistPopup` (69), the Framer variants of both (76), the confirmation page states (39), the `useWaitlistForm` hook (16): validation, loading, duplicate (409) and error states. |
| `errors` | 3 | 30 | The error model: HTTP status to error kind, message from a response body, `requestJson`; the `ErrorProvider` and `ErrorScreen`. |
| `profilepages` | 2 | 12 | Only two narrow behaviours: country folders on the Countries tab and the Explorer Card link on the About tab; the "currently in" flag and location. |
| `layout` | 1 | 6 | `usePageLoadGate` (splash minimum 0.6 s, maximum 2.5 s). |

### Landing coverage by area (lines)

| Area | Covered | Notes |
| --- | --- | --- |
| `features/getfeatured` | 89% (2,383 / 2,679) | The best covered area; the create flow component itself is 76%. |
| `features/explorercard` | 36% (469 / 1,287) | Cards, modals, metadata and the click wrapper are well covered. The editor forms are **0%** (`DesktopExplorerForm`, `MobileExplorerForm`, `ExplorerCardScaler`, `SharedExplorerCardView`) and `expcard-page` is 25%. These are the parts covered by E2E instead. |
| `lib` | 32% (270 / 835) | `countries` 86%, `media-resolver` 62%. `upload-client` 15%, `profiles.ts`, `editor-lock.ts`, `cropImage.ts`, `safe-history.ts`: **0%**. |
| `features/profilepages` | **7.5%** (168 / 2,243) | The public profile pages, the biggest untested surface (see gaps). |
| `components/ui`, `components/*` | 0 to 25% | Mostly presentational. |
| `app/api` | **0%** (0 / 339) | None of the local API routes. |
| `emails/` | 0% | Email HTML templates. |

## Admin (`travingat-admin/tests`)

| File | Tests | What it checks |
| --- | --- | --- |
| `waitlist/WaitlistDetailsCard.test.tsx` | 71 | The details panel: fields and links, the Founding Explorer badge switch (on, off, disabled without a card, failure), and the per-state action buttons for each application status. |
| `waitlist/WaitlistTable.test.tsx` | 54 | Rows, status badges, the row action menu including the Explorer card View / Edit / Resend entries. |
| `waitlist/WaitlistMetricsCards.test.tsx` | 31 | The metric tiles. |
| `waitlist/format.test.ts` | 19 | Date, number and label formatting helpers. |
| `lib/explorer-card-links.test.ts` | 7 | The one place that turns a card style into a share path and URL (Classic `a`, Minimal `b`, everything else `c`). |
| `profiles/country-picker-modal.test.tsx` | 7 | The editor's country picker. |
| `ui/card-upload-progress.test.tsx` | 4 | The upload progress card. |

Admin line coverage is **3.8%**, which looks alarming but is mostly one fact: about 2,700 of the lines are `src/landing/**`, a copy of the landing profile-page components used by the profile preview. They have no unit tests in either repo. The admin screens that do carry weight (the profile editor, featured requests, recycle bin) are covered only by Playwright, not by unit tests: `useProfileEditor` is **0%** at unit level even though its save/diff logic is exercised through the browser.

## What is not unit tested, in priority order

"Not tested" below means no unit test imports it and measured coverage is at or near 0%. Some of it is covered by E2E (noted).

### Landing

1. **Public profile pages** (`features/profilepages`, ~2,100 untested lines): `CollectionDetailComponent` (339), `CountryDetailComponent` (256), `MobilePhotoViewer` (223), `CountryMobileMenuModal` (197), `MediaLightbox` (179), `MobileProfile`, `ProfileComponent`, `CollectionHeader`, hooks `useTabNavigation`, `usePhotoCarousel`, `useColumnCount`. This is the product's public face and the most pixel-sensitive code (see `handoff.md` in the landing repo). Not covered by E2E either. Start with the hooks and the pure `utils.ts`, then the lightbox and tab navigation.
2. **Pure helpers with no test** (cheap and high value): `lib/profiles.ts` (`normalizeProfile`, snake_case to camelCase, image URL resolution: the contract with the backend), `lib/editor-lock.ts` (the "another tab is editing" lock, 126 lines), `lib/upload-client.ts` (presign, upload, retry, size limits; 15%), `lib/cropImage.ts`, `lib/safe-history.ts`, `lib/landing-assets.ts`, `lib/blurhash-client.ts`.
3. **Explorer Card editor forms**: `MobileExplorerForm` (135 lines, 0%), `DesktopExplorerForm`, `ExplorerCardScaler`, `SharedExplorerCardView`, and the uncovered 75% of `expcard-page`. E2E covers the happy paths and validation; unit tests would pin field-level rules (names, five-country minimum, crop state) cheaply.
4. **Local API routes** (`src/app/api`, 339 lines at 0%): `locations/search` (107), `revalidate` (65, `x-revalidate-secret` check), `upload/presign`, `image-proxy` (host allow-list: exact host or strict subdomain only), `media-engine/optimize`, `check-link`, `health`, and the dev catch-all proxy. Test them as plain functions with a `Request`.
5. **Routing config**: the reserved-path regex in `next.config.ts` and `src/proxy.ts` (59 lines). A table test (each reserved path is not rewritten to a profile) would catch the most likely regression: a new top-level route being swallowed by `/:username`.
6. **Email templates** (`src/emails`, 7 files): render each with sample data and assert the key links and no unreplaced placeholders.
7. **Chrome and shared UI**: `LandingHeader` (632 lines), `FeaturedProfiles`, `ImageCropperModal` and `ProfileCropModal`, masonry hooks, `MobileComingSoonToast`, `WarningModal`.
8. **`components/framer/getfeaturedMono.tsx`** (2,500 lines, 14%): generated Framer export. Not worth testing line by line; keep an eye on the wrapper that mounts it.

Skip: `components/designsystem/*` showcases and `components/loaders/*` (visual only).

### Admin

1. **`profiles/editor/hooks/useProfileEditor.ts`** (623 lines, 0% unit): `buildPatch`, `sameScalar`, `normImages`, `normSocials`, `withContent` decide what a save sends. They are pure and had real bugs (untouched fields producing a noisy PUT). E2E covers the main cases; unit tests are the cheap way to cover every field type.
2. **`proxy.ts`** (148 lines): the session-cookie gate in front of every admin page and API call. Test that each protected path redirects or returns 401 without the cookie and that the public paths stay public.
3. **Hooks and data layer**: `useProfileUploads` (289), `useWaitlist` (179), `useProfilesList`, `useOrphanScanner`, `lib/api.ts` (177), `lib/auth.ts`, `lib/revalidate.ts`.
4. **Screens with logic and no unit test**: `featured-requests/page.tsx` (479 lines; E2E covers it well), `recycle-bin/RecycleBinClient`, `profiles/review/page.tsx` (684, **no test of any kind**), `BulkUploadModal`, `OrphanMediaScanner`, the editor steps and their image sections.
5. **API routes** (`src/app/api`, 262 lines at 0%): `locations/search`, `locations/detect`, `check-link`, `revalidate`, the catch-all proxy.
6. **`src/landing/**`**: the duplicated profile-page code. Better to stop duplicating it than to test both copies.

## Conventions

- One test file per component or hook, named after it, in a folder matching the feature (`tests/getfeatured/create/get-featured-about-step.test.tsx`).
- Components are rendered with React Testing Library and driven through the accessible roles and text, the way a user sees them. Network calls, hooks and Next.js modules (`next/navigation`, `next/image`) are mocked at the module boundary.
- Prefer parameterising over copy-pasting: `countries-resolution` runs 543 cases from the same list the pickers use, so a new country can't be added without being tested.
- A bug fix should come with a test that fails without it (examples: `SharedExplorerCardClickWrapper` handle trimming, `explorerCardMetadata` `@name`, `usePageLoadGate`).
- A unit test can't catch layout, real navigation, cookies or anything the Next.js server fetches itself. That is what the E2E suite is for; don't try to cover it here.

## Keeping this doc current

After a meaningful change in test count or coverage, update the two summary tables and the matching row in the gap list. If you add the first test for something in "What is not unit tested", delete it from the list.
