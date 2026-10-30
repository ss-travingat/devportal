# Travingat — Tech Stack & Architecture Overview

Welcome to the technical overview of the **Travingat** landing and web application. This document outlines the technology stack, external services, internal modules, and key architectural patterns—explaining **what** we use, **where** it is used, and **why**.

---

## 1. High-Level System Architecture

Travingat is a travel creator platform allowing travel influencers and explorers to showcase itineraries, passport cards (Explorer Cards), travel statistics, and media portfolios.

```
                              [ User Browser / Client ]
                                          │
                                          ▼
                             Cloudflare CDN / Edge
                       (SSL, Caching, DDoS Protection)
                                          │
                                          ▼
                      Next.js App Router (Landing / Web)
                      ├── Server Components (RSC - Data fetching)
                      ├── Client Components ("use client" - Interactivity)
                      └── Route Handlers (/api/*)
                                    │
         ┌──────────────────────────┼──────────────────────────┐
         ▼                          ▼                          ▼
  Neon PostgreSQL             Cloudflare R2            Travingat Django API
(Serverless Database)       (S3 Media Storage)         (Async Media Engine & Celery)
```

---

## 2. Core Tech Stack

| Technology | Role / Category | Version | Why We Use It |
| :--- | :--- | :--- | :--- |
| **Next.js** | Full-Stack React Framework | `16.4.x` (App Router) | High-performance Server Components (RSC), built-in image optimization, fast edge routing, SEO-friendly SSR, and route handlers. |
| **React** | UI Library | `19.2.x` | Modern component architecture, server actions, concurrent features, and fast rendering. |
| **TypeScript** | Language | `5.9.x` | Strict type safety across database schemas, API payloads, and UI component props. |
| **Tailwind CSS** | Styling System | `v4.x` (`@tailwindcss/postcss`) | High-fidelity utility-first styling with modern features (e.g. `bg-linear-to-*`), arbitrary values for pixel-perfect Figma reproduction, and zero runtime CSS overhead. |
| **PostgreSQL (Neon)** | Primary Database | Serverless Driver | Cloud-native serverless PostgreSQL with instant autoscaling, branching, and low-latency connection pooling via `@neondatabase/serverless`. |

---

## 3. External Services & Cloud Infrastructure

| Service | Category | Purpose & Implementation Details |
| :--- | :--- | :--- |
| **Cloudflare R2** | Object Storage | S3-compatible cloud storage for creator photos, card exports, and profile media. Uploads are handled via direct presigned URLs (`@aws-sdk/s3-request-presigner`) to offload server bandwidth. |
| **Cloudflare Edge / CDN** | CDN & Security | Provides edge caching (`cdn.travingat.com`), SSL termination, and DDoS mitigation. Remote images are delivered with aggressive cache policies (`minimumCacheTTL: 31536000`). |
| **Neon Database** | Serverless SQL DB | Hosts profile data, waitlist submissions, blogs, testimonials, and user metadata over secure connection pools (`DATABASE_URL`). |
| **Gmail SMTP / Nodemailer** | Transactional Email | Delivers waitlist confirmation emails, magic links, and OTP notifications (`src/lib/otp-email.ts` and `src/emails/`). |
| **Django ASGI & Celery** *(External Backend)* | Heavy Media Processing | Dedicated microservice cluster running Daphne and Celery workers to handle asynchronous video processing and multi-size thumbnail generation (`src/app/api/media-engine/optimize`). |
| **Contabo VPS & Docker** | Hosting & Runtime | Production Docker containerization (`docker-compose.prod.yml`) coordinated behind an automated `nginx-proxy` container on a dedicated Linux VPS. |

---

## 4. Key Packages & Modules

### UI, Layout & Interaction
| Package | Where Used | Why & What For |
| :--- | :--- | :--- |
| `@radix-ui/react-dialog` | Modals, context sheets (`CountryMobileMenuModal`, `ExplorerCardDownloadMobileModal`) | Headless, accessible dialog primitives providing seamless focus trapping and screen reader support. |
| `@radix-ui/react-popover` | Menus and dropdown actions | Unstyled floating popover primitive for contextual toolbars. |
| `@radix-ui/react-tabs` | Profile sections (`src/features/profilepages`) | Accessible tab navigation switching between Trips, About, and Collections. |
| `@radix-ui/react-tooltip` | Country flags & card info (`FlagsGrid`, `cards.tsx`) | Lightweight interactive tooltips for displaying visited country names. |
| `clsx` & `class-variance-authority` | Throughout `src/components/ui` | Composing conditional and variant-based CSS class strings cleanly. |
| `@tailwindcss/typography` | Blog articles (`src/app/blog/[slug]`) | Elegant typographic styling for markdown and CMS rich text. |

### Media Processing & Rendering
| Package | Where Used | Why & What For |
| :--- | :--- | :--- |
| `sharp` | Server-side image operations (`src/lib/image-compress.ts`) | High-speed server-side image resizing, metadata extraction, and format conversion (WebP/AVIF). |
| `blurhash` / `react-blurhash` | Image placeholders (`<LoadedImage />`) | Displays compact, aesthetic blur placeholder representations while high-resolution media streams in. |
| `react-easy-crop` | Profile and card photo crop tools (`src/lib/cropImage.ts`) | Touch- and mouse-friendly image framing/cropping canvas for avatars and banners. |
| `modern-screenshot` | Explorer Card preview exports (`src/features/explorercard`) | High-fidelity DOM-to-canvas image generation used to snapshot and export traveler cards. |
| `react-player` | Video players on landing & creator pages | Unified video player supporting responsive video embeds and direct MP4/HLS streams. |

### Geography & Localization
| Package | Where Used | Why & What For |
| :--- | :--- | :--- |
| `countries-list` | `src/lib/countries.ts`, Explorer Card | Provides ISO country codes, country names, continents, and metadata for travel statistics. |
| `flag-icons` | Country flags across profiles & cards | Crisp SVG/CSS country flag library for rendered destination pins and lists. |

### Data, Utilities & Networking
| Package | Where Used | Why & What For |
| :--- | :--- | :--- |
| `@neondatabase/serverless` | `src/lib/db.ts` | Direct serverless PostgreSQL client designed for edge runtimes and fast SQL queries. |
| `@aws-sdk/client-s3` | `src/lib/r2-upload.ts` | Standard S3 client used to communicate with Cloudflare R2 for asset uploads and deletions. |
| `@aws-sdk/s3-request-presigner` | `src/lib/r2-upload.ts` | Generates secure pre-signed URLs allowing client browsers to upload media directly to R2. |
| `jszip` | Explorer Card downloads | Bundles multiple generated card images or asset packs into a single zip file for user download. |
| `nodemailer` | `src/lib/otp-email.ts` | Sends waitlist verifications, magic links, and OTP credentials via SMTP. |
| `uuid` | ID generation across features | Generates RFC-compliant UUIDs for unique media keys, cards, and transaction records. |

---

## 5. Codebase Structure & Feature Modules

The application is structured inside `src/` to separate global concerns from domain features:

```
src/
├── app/               # Next.js App Router (pages and API route handlers)
│   ├── (public)       # Public-facing routes (profiles, blog, waitlist, templates, etc.)
│   ├── admin/         # Internal CMS & administrative dashboard
│   └── api/           # Backend HTTP route handlers
├── features/          # Domain-specific modules
│   ├── profilepages/  # User portfolio page, timeline, albums, and country drawers
│   ├── explorercard/  # Interactive card builder, card templates, scaling, and exports
│   ├── featured-profiles/ # Curated creator discovery carousel
│   └── getfeatured/   # Creator onboarding and submission flow
├── components/        # Reusable shared UI blocks
│   ├── ui/            # Atomic primitives (<LoadedImage />, toasts, buttons, loaders)
│   ├── layout/        # Shell layout components (Header, Footer, Navigation)
│   └── sections/      # Landing page sections (Hero, Features, Testimonials)
├── lib/               # Shared backend clients, database, and pure utility functions
├── db/                # Database migrations and schema definitions
└── assets/            # Static local typography (Inter, Righteous, Open Sauce) & icons
```

### Core Feature Breakdown
- **`profilepages` (`src/features/profilepages`)**:
  - Powers user profiles (`/[username]` or `/profiles/[id]`).
  - Implements **Component Viewport Isolation**: separates rigid desktop hero layouts (`ProfileDesktopHero.tsx`) from mobile drawer layouts (`MobileProfile.tsx`, `CountryMobileMenuModal.tsx`) to avoid responsive CSS collisions.
  - Custom SVG social icons and profile tab navigation.
- **`explorercard` (`src/features/explorercard`)**:
  - Generates travel cards in three styles: *Classic*, *Minimal*, and *Adventure*.
  - Includes `ExplorerCardScaler.tsx` for responsive viewport fitting and DOM screenshot capture via `modern-screenshot` and `jszip`.
  - Features interactive country flag tooltips (`FlagsGrid`).
- **`api` handlers (`src/app/api`)**:
  - `/api/media-engine/optimize`: Delegates heavy media transformations to the backend Celery cluster.
  - `/api/image-proxy`: Proxies remote images to bypass cross-origin restrictions for canvas exports.
  - `/api/locations/search`: Destination and city search autocomplete.
  - `/api/revalidate`: On-demand ISR revalidation triggers.
  - `/api/health`: Healthcheck endpoint for Docker and uptime monitoring.

---

## 6. Architectural Patterns & Guidelines

1. **Pixel-Perfect Figma Fidelity**: Spacing, typography, and color values are locked to Figma specifications using arbitrary Tailwind values (e.g. `pt-[48px]`, `gap-[20px]`).
2. **Desktop & Mobile Component Isolation**: Complex views with conflicting layout requirements between desktop and mobile are separated into dedicated components rather than overloaded with conditional CSS breakpoints.
3. **Asset Resolution via Centralized CDN**: Image paths are resolved via `toLandingAssetUrl` and rendered through `<LoadedImage />` with blurhash skeletons for optimal LCP (Largest Contentful Paint).
4. **Direct-to-Storage Upload Flow**: Media files do not pass through the Next.js Node server memory; presigned R2 URLs are used for direct client uploads, reducing server load and upload latency.

