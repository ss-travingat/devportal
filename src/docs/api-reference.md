---
title: API Reference
description: Complete reference for all Dev Portal API endpoints including request and response schemas.
category: API
author: Backend Engineering
updatedAt: 2026-10-30
---

# API Reference

This document provides complete documentation for all REST API endpoints available in the Dev Portal.

## Base URL

All API routes are served under:
```
http://localhost:3000/api
```

---

## Subscriptions API

### `GET /api/subscriptions`
Returns all subscription records from the JSON store.

**Response**
```json
[
  {
    "id": "sub-1",
    "purpose": "Cloud Hosting",
    "vendor": "AWS",
    "amount": "1240.50",
    "currency": "USD",
    "billingFrequency": "Monthly",
    "nextBillingDate": "2026-11-01",
    "status": "Active",
    "createdAt": "2024-01-15T00:00:00.000Z",
    "updatedAt": "2026-10-01T00:00:00.000Z"
  }
]
```

---

### `POST /api/subscriptions`
Creates a new subscription record. Validates payload using Zod before persisting.

**Request Body**
```json
{
  "purpose": "APM Monitoring",
  "vendor": "Datadog",
  "amount": "450.00",
  "currency": "USD",
  "billingFrequency": "Monthly",
  "nextBillingDate": "2026-11-05",
  "status": "Active",
  "owner": "SRE Team",
  "ownerEmail": "sre@company.com",
  "ownerMobile": "+1234567890"
}
```

**Response**
```json
{ "success": true, "subscription": { "id": "sub-1234", ... } }
```

**Validation Rules**
| Field | Rule |
|-------|------|
| `purpose` | Required, non-empty string |
| `vendor` | Required, non-empty string |
| `amount` | Decimal ≥ 0 |
| `currency` | 3-letter ISO 4217 code |
| `billingFrequency` | Enum: Monthly, Quarterly, Yearly, Weekly, One-time, Custom |
| `nextBillingDate` | Required date string |
| `status` | Enum: Active, Cancelled, Paused, Trial, Pending Review |
| `vendorUrl` | Must be `https://` if provided |
| `ownerEmail` | Valid email format if provided |
| `endDate` | Required when status is `Cancelled` |

---

### `PUT /api/subscriptions`
Updates an existing subscription record. The `id` field is required in the body.

**Request Body**
```json
{
  "id": "sub-1",
  "purpose": "Updated Hosting",
  "vendor": "AWS",
  "amount": "1500.00",
  "currency": "USD",
  "billingFrequency": "Monthly",
  "nextBillingDate": "2026-12-01",
  "status": "Active"
}
```

---

### `DELETE /api/subscriptions?id=<id>`
Removes a subscription record from the JSON store.

**Query Parameters**
| Param | Required | Description |
|-------|----------|-------------|
| `id` | Yes | ID of the subscription to delete |

**Response**
```json
{ "success": true }
```

---

## Docs API

### `GET /api/docs`
Returns a list of all available documentation files.

**Response**
```json
[
  {
    "slug": "architecture-overview",
    "title": "Architecture Overview",
    "description": "High-level system architecture...",
    "category": "Architecture",
    "author": "Platform Engineering Team",
    "updatedAt": "2026-10-30"
  }
]
```

### `GET /api/docs?slug=<slug>`
Returns the full Markdown content and frontmatter for a specific document.

**Response**
```json
{
  "slug": "architecture-overview",
  "title": "Architecture Overview",
  "content": "# Architecture Overview\n...",
  "category": "Architecture",
  "author": "Platform Engineering Team",
  "updatedAt": "2026-10-30"
}
```

