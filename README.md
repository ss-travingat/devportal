# devportal

Travingat's internal developer portal at `devportal.travingat.com`:

- **Media Engine** dashboards (`/media-engine`) and the Media Portal sandbox (`/media-portal`)
- **Service payments** tracking (`/service-payments`)
- **Tech Docs** (`/tech-docs`): architecture, data model, Media Engine, product flows, and the Runbook for outages, database restores and server moves. Sources are in [`src/docs/`](src/docs).

It is a thin Next.js client over the Django backend (`travingat-backend`), which owns all data.

## Run locally

```bash
bun install
bun dev            # http://localhost:3000
```

Set `BACKEND_URL` (default `http://127.0.0.1:8000`) and, for server-to-server calls, `DEVPORTAL_API_TOKEN`. Sign in at `/login` with the admin password; the session cookie is issued by the backend.

```bash
bun run lint
bun run build
```

## Deploy

Hosted on **Vercel**. Pushing to `main` deploys; `.github/workflows/ci.yml` runs checks. Production env vars are set in the Vercel project.

## Editing docs

Add or edit a Markdown file in `src/docs/` with this frontmatter:

```yaml
---
title: Page title
description: One sentence for the docs index.
category: Overview | Architecture | Product | Operations
author: Travingat Engineering
updatedAt: YYYY-MM-DD
---
```

Mermaid diagrams go in ```` ```mermaid ```` blocks. In flowchart labels, use `\n` for line breaks. Headings have no anchor ids, so link to pages, not sections.
