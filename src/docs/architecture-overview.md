---
title: Architecture Overview
description: High-level system architecture and component relationships for the Dev Portal platform.
category: Architecture
author: Platform Engineering Team
updatedAt: 2026-10-30
---

# Architecture Overview

This document describes the high-level architecture of the **Dev Portal** platform, including the relationships between core services, data stores, and external vendors.

## System Components

```mermaid
flowchart TD
    User["👤 Developer / Admin"] --> DevPortal["Dev Portal (Next.js)"]

    DevPortal --> ServicePayments["Service Payments Module"]
    DevPortal --> TechDocs["Tech Documentation Module"]

    ServicePayments --> API["REST API Layer\n/api/subscriptions"]
    API --> JSONStore["📄 subscriptions.json\n(Local JSON File Store)"]
    API --> ZodValidator["Zod Validation Schema"]

    TechDocs --> DocsAPI["REST API Layer\n/api/docs"]
    DocsAPI --> MDFiles["📁 /src/docs/*.md\n(Markdown Files)"]
```

## Module Breakdown

### 1. Service Payments Module
Manages recurring vendor subscriptions with full CRUD operations.

| Layer | Technology |
|-------|-----------|
| UI | React + Tailwind CSS v4 |
| Validation | Zod v4 |
| Storage | JSON File (`subscriptions.json`) |
| API | Next.js App Router Route Handlers |

### 2. Tech Documentation Module
Stores and renders Markdown documentation with Mermaid diagram support.

| Layer | Technology |
|-------|-----------|
| Renderer | react-markdown + remark-gfm |
| Diagrams | Mermaid.js |
| Storage | `.md` files in `/src/docs/` |
| API | Next.js App Router Route Handlers |

## Data Flow

```mermaid
sequenceDiagram
    participant U as User
    participant FE as Frontend (Next.js)
    participant API as API Route
    participant Store as JSON / MD Files
    participant Zod as Zod Validator

    U->>FE: Fill subscription form
    FE->>Zod: Validate form data
    Zod-->>FE: Validation result
    FE->>API: POST /api/subscriptions
    API->>Zod: Re-validate server-side
    API->>Store: Write to subscriptions.json
    Store-->>API: Confirm write
    API-->>FE: 201 Created
    FE-->>U: Updated subscription list
```

## Deployment Architecture

```mermaid
flowchart LR
    Dev["Local Dev\nnpm run dev"] --> Build["next build\nTurbopack"]
    Build --> Deploy["Deployment\n(Vercel / Node)"]
    Deploy --> Users["End Users"]

    Deploy --> APIR["API Routes\n(Server-side)"]
    Deploy --> Static["Static Pages\n(ISR / SSG)"]
```

