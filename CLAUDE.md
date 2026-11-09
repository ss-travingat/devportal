# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

`dev-portal` is Travingat's internal developer portal (`devportal.travingat.com`): a Next.js (App Router) app for monitoring the Media Engine pipeline, tracking service/cloud subscriptions and spend, and hosting technical documentation. It is a thin client/BFF in front of the sibling Django backend (`../backend`), not a standalone app — most data lives in and is mutated through that backend's API.

**Hosting:** unlike the other Travingat apps (Docker on the Contabo VPS), devportal is hosted on **Vercel**. `.github/workflows/ci.yml` only runs checks; deploys come from Vercel's GitHub integration. Production env vars (`BACKEND_URL`, `DEVPORTAL_API_TOKEN`) are set in the Vercel project.

## Commands

Package manager is bun (`bun.lock` present alongside a stale `package-lock.json` — prefer `bun`).

- `bun dev` — start dev server (Next.js, Turbopack via config)
- `bun run build` — production build
- `bun start` — run production build
- `bun run lint` — ESLint (flat config: `eslint-config-next` core-web-vitals + typescript)

There is no test setup and no separate type-check script; `tsc` runs implicitly as part of `next build` (`noEmit: true` in tsconfig, path alias `@/*` → `src/*`).

## Architecture

### Routing
Next.js App Router (Next 16, React 19) under `src/app/`. Pages: `/` (dashboard), `/login`, `/signin`, `/service-payments` (subscriptions), `/media-portal`, `/media-engine` and `/media-engine/[id]`, `/tech-docs` and `/tech-docs/[slug]`.

### Backend integration
The app talks to the Django backend at `BACKEND_URL` (env, defaults to `http://127.0.0.1:8000`):
- `src/lib/backend-client.ts` (`backendFetch`) is the shared fetch wrapper used by most `/api/media-engine/*` route handlers. It forwards the browser's `admin_session`/`cms_session` cookies to Django when present, and otherwise falls back to a static `Authorization: Bearer ${DEVPORTAL_API_TOKEN}` for server-to-server calls. It also special-cases `/api/media` to avoid a 301 (Django router trailing-slash redirect).
- `src/app/api/admin/login/route.ts` posts credentials directly to Django's `/api/admin/login` and relays Django's `Set-Cookie` (the `admin_session` cookie) back to the browser — this cookie is the actual auth session, issued by Django, not by Next.js.
- Most routes under `src/app/api/media-engine/**` and `src/app/api/subscriptions/**` are proxy/BFF handlers: they accept the Next.js request, call the Django backend via `backendFetch`, and reshape/relay the response (with graceful offline fallbacks, e.g. `is_offline: true` when the backend is unreachable).
- `src/app/api/docs/route.ts` is the one exception that is *not* backend-proxied: it reads/serves Markdown files with YAML frontmatter directly from `src/docs/` on disk (used by the `/tech-docs` pages).

### Auth
Custom cookie-based session, not NextAuth/JWT-in-this-app. `src/proxy.ts` (Next.js 16's proxy/middleware convention) gates almost all routes: it checks for the `admin_session` cookie (set by Django on successful login), allows `/api/admin/*` and `/api/health` through unauthenticated, allows `/login` and `/signin`, and otherwise redirects unauthenticated page requests to `/login?next=...` or returns 401 JSON for API requests. `/logout` clears the cookie for both the apex domain (`.travingat.com`) and the current host.

### State management & data fetching
- Server-ish data (media engine stats, queue, assets, subscriptions) is fetched through the Next.js API routes above; `@tanstack/react-query` (wired up in `src/components/Providers.tsx`, a client component wrapping the app in `layout.tsx`) is used for client-side caching/refetching of that data.
- Subscriptions (`/service-payments`) are **not** persisted on the backend — `src/lib/storage.ts` persists them to `localStorage` client-side only (`devportal_service_payments_v2` key), despite there also being `src/app/api/subscriptions/**` routes; check which is actually wired up before assuming one or the other is the source of truth for a given feature.
- `src/types/` holds the shared TypeScript types (`subscription.ts`, `media.ts`, `docs.ts`) used across components, routes, and lib code.

### Key directories under `src/`
- `app/` — routes and route handlers (App Router)
- `components/` — shared UI; `components/media-engine/` holds the tab/panel components for the Media Engine dashboard (queue, orphans, benchmarks, recycle bin, etc.)
- `lib/` — `backend-client.ts` (Django fetch wrapper), `storage.ts` (localStorage persistence), `media-utils.ts`, `validations/subscription.ts`
- `docs/` — Markdown source files (with frontmatter: `title`, `description`, `category`, `author`, `updatedAt`) served by `/api/docs` and rendered at `/tech-docs/[slug]` via `MarkdownViewer`/`react-markdown` (+ `MermaidBlock` for Mermaid diagrams). These are the team's source of truth for the whole platform: `0-Tech-Stack-Glance`, `Techstack` (architecture/infra), `Data-Model`, `Media-Engine`, `Explorer-Cards`, `Get-Featured`, `Waitlist`, `Admin-Platform`, `Runbook` (outages, DB restore, server moves). All were re-verified against the code on 2026-11-09 — when backend/landing/admin behaviour changes, update the matching page and its `updatedAt`. Authoring notes: headings get no `id`s, so `#section` links don't work; in Mermaid flowchart labels use `\n` for line breaks (not `<br/>`), matching the existing diagrams.
- `types/` — shared TS types

### Styling
Tailwind CSS v4 via the Turbopack loader (`@tailwindcss/turbopack`, configured in `next.config.ts`), dark theme hardcoded in `layout.tsx` (`bg-[#121212]`), icons from `lucide-react`.

### Relation to other repos
Sibling repo `../backend` is a Django project (apps: `core`, `users`, `profiles`, `waitlist`, `media_engine`, `devportal`, `system`) that owns the actual data and business logic (accounts, profiles and Explorer Cards, media processing pipeline, waitlist). This devportal app is purely an internal admin/ops client for it — treat Django as the source of truth and this repo's API routes as a proxy/auth layer, not a separate data layer (aside from the docs and the localStorage-only subscriptions noted above).

## Notes

- `AGENTS.md` in this repo is Next.js's auto-generated boilerplate (regenerated by `next dev` from `node_modules/next/dist/server/lib/generate-agent-files.js`), not project-specific guidance — ignore it.
- No `.cursor/rules/`, `.cursorrules`, or `.github/copilot-instructions.md` exist in this repo.
## Git Commit Rules

- Never add AI attribution to commit messages.
- Never add Co-Authored-By trailers.
- Never add Generated with Claude Code.
- Never add Claude-Session trailers.
- Keep commit messages clean and conventional.