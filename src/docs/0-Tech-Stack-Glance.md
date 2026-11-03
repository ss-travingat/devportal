---
title: Tech Stack at a Glance
description: A plain-English, one-page summary of every technology and service Travingat runs on, and why each one was chosen — written for founders, investors, and anyone doing technical due diligence.
category: Overview
author: Travingat Engineering
updatedAt: 2026-11-03
---

# Tech Stack at a Glance

This page is the quick answer to "what technology does Travingat use, and why?" — a one-page summary anyone on the team can use to explain the stack confidently, without needing to be an engineer. For deeper technical detail (exact versions, architecture diagrams, data models), see the companion docs: [Tech Stack & Architecture](/tech-docs/Techstack), [Media Engine](/tech-docs/Media-Engine), [Get Featured](/tech-docs/Get-Featured), [Explorer Cards](/tech-docs/Explorer-Cards), [Waitlist](/tech-docs/Waitlist), and [Admin Platform](/tech-docs/Admin-Platform).

| Part | Technology | What it does in simple terms | Why we chose it |
| :--- | :--- | :--- | :--- |
| **Marketing website** | Framer | Runs our public landing page, pricing, blog, and waitlist pages | Lets the team publish and update marketing pages quickly, without needing an engineer for every content change |
| **Web app** | Next.js, React, TypeScript | Runs the screens travelers use to apply, build their profile, and browse Explorer Cards | A modern, widely-adopted framework that's fast for users, strong for search visibility, and backed by a large talent pool |
| **Admin dashboard** | Next.js, React, TypeScript | The internal tool our team uses to review applications, manage the waitlist, and moderate content | Shares the same stack and patterns as the main web app, so the team builds and maintains everything with one set of skills |
| **Developer portal** | Next.js, React, TypeScript | Internal tool for monitoring media processing, tracking cloud spend, and hosting our technical documentation | Keeps internal tooling consistent with the rest of the stack, built and maintained by the same team |
| **Backend & API** | Python, Django | Handles core application logic — accounts, profiles, applications — and serves data to every app | A mature, security-focused framework with a long production track record, letting the team build on proven foundations instead of reinventing the basics |
| **Database** | PostgreSQL | Stores user accounts, profile details, visited countries, and photo collections | The most widely trusted open-source database for this kind of structured, relational data, with no licensing cost |
| **Photo & video storage** | Cloudflare R2 | Stores every photo and video travelers upload, plus database backups | Charges nothing for data leaving storage (egress), which keeps serving media to a growing user base cost-predictable |
| **Media optimization** | Celery, Redis | Automatically compresses and resizes every uploaded photo and video for fast loading on any device | A proven, widely-used pattern for handling heavy work in the background without slowing down the app for users |
| **Hosting** | Contabo VPS, Docker | Runs our applications, database, and background workers | Dedicated, predictably-priced infrastructure with full control, which is more cost-efficient than usage-based cloud pricing at our current stage |
| **Content delivery & security** | Cloudflare | Protects the platform from malicious traffic and delivers it quickly to users anywhere in the world | An industry-standard edge network that adds enterprise-grade security and speed with minimal engineering overhead |
| **Authentication** | JWT (JSON Web Tokens) | Keeps users securely signed in across the web app and admin dashboard | A widely-adopted, stateless standard for secure sessions that works cleanly across multiple separate apps |
| **Automated emails** | Gmail SMTP | Sends verification codes, confirmations, and notification emails | A reliable, no-added-cost way to handle current email volume, with a straightforward path to a dedicated provider as volume grows |
| **Location search** | Komoot Photon (OpenStreetMap) | Powers city and country search when creators log where they've traveled | A free, open-data geocoding service that avoids ongoing paid API costs for a feature used throughout the product |
| **Error monitoring** | Sentry | Gives the engineering team real-time visibility into application health in production | The industry-standard tool for this, so the team can monitor quality proactively as the platform scales |
| **Code management & deployment** | GitHub, GitHub Actions | Stores our full code history and automatically deploys updates when the team ships changes | Automated deployments remove manual steps from shipping, so the team can release updates often and consistently |

---

### How to read this table

- **Technology** names the specific tool or service — the deeper docs linked above go into exact versions and configuration.
- **Why we chose it** reflects the reasoning behind each choice: cost-efficiency, reliability, team velocity, or industry-standard practice — the same criteria any growing engineering team weighs.

Travingat's stack is intentionally built on mature, widely-adopted technology rather than exotic or unproven tools — the goal is a foundation the team can scale confidently as the platform grows.
