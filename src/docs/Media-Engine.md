---
title: Media Engine — Processing Pipeline
description: How every photo uploaded to Travingat becomes a small, web-ready AVIF with a thumbnail and blurhash — ingestion paths, data model, encoding settings, queues, scheduled scans, live status and recovery.
category: Architecture
author: Travingat Engineering
updatedAt: 2026-11-09
---

# Media Engine — Processing Pipeline

The Media Engine turns uploaded media into compact, web-ready files. Photos become AVIF with a 720px thumbnail and a blurhash placeholder. Job progress is shown live on the devportal **Media Engine** dashboard (`/media-engine`), and the **Media Portal** (`/media-portal`) is a sandbox for testing the pipeline.

> **Video:** the backend can encode video (AV1 + Opus, WebM), but creators can only upload images today, and production has no worker for the `videos` queue. Add one before video is switched on.

---

## 1. Where the code lives

| Backend app | Role | Key files |
| :--- | :--- | :--- |
| `media_engine/` | The production pipeline | `models.py`, `tasks.py`, `views.py`, `consumers.py`, `services/image_processor.py`, `services/video_processor.py`, `services/storage.py` |
| `devportal/` | The Media Portal sandbox and storage accounting | `models.py` (`DevportalImageUpload`, `UserStorage`, `ServiceSubscription`), `views.py`, `tasks.py`, `services.py` |

Queue routing (`CELERY_TASK_ROUTES`) and the schedule (`CELERY_BEAT_SCHEDULE`) are in `core/settings.py`; the Celery app is `core/celery.py`.

---

## 2. Three ways in, one pipeline

```mermaid
flowchart TD
    subgraph P1["1. Direct upload (internal tools)"]
        A1["File POSTed to the API"] --> A2["Stored, then image or video task queued"]
    end
    subgraph P2["2. Remote optimisation (creator photos)"]
        B1["Photo already in R2\n(uploaded by the browser)"] --> B2["API action or scheduled scan"]
        B2 --> B3["MediaAsset created"] --> B4["process_remote_media_task"]
        B4 --> B5["Download, encode,\nupload .avif, remove original"]
    end
    subgraph P3["3. Media Portal sandbox"]
        C1["Presigned PUT to\ntravingat-assets"] --> C2["Browser uploads to R2"] --> C3["Process request"] --> C4["DevportalImageUpload"]
    end
    A2 --> Q["Celery queues"]
    B4 --> Q
    C3 --> Q
```

- **Remote optimisation** is the main path for creators. Photos for profiles, country folders, collections and Explorer Cards are uploaded straight from the browser to R2. The upload screens then call `POST /api/media-engine/optimize`, and submitting an Explorer Card queues its two photos. The 2-hourly scan catches anything missed. The optimised file replaces the original.
- **Direct upload** is used by internal tooling that posts a file to the API.
- **The Media Portal** is a separate presign-and-process flow, so the pipeline can be tested without touching production media.

---

## 3. Data model

```mermaid
erDiagram
    users_user ||--o{ MediaAsset : uploads
    MediaAsset ||--o{ MediaVariant : produces
    MediaAsset ||--o{ MediaJob : processes
    MediaJob ||--o{ JobLog : records

    MediaAsset {
        uuid id PK
        uuid user_id FK "nullable"
        string original_filename
        string media_type "IMAGE or VIDEO"
        string status "UPLOADING, PROCESSING, DONE, ERROR"
        bigint original_size
        int original_width
        int original_height
        string blurhash
        string remote_key "R2 key, indexed"
        datetime deleted_at "recycle bin"
        text delete_reason
    }
    MediaVariant {
        uuid id PK
        uuid media_id FK
        string variant_type "OPTIMIZED or THUMBNAIL_720, unique per asset"
        string storage_path
        bigint file_size
        int width
        int height
    }
    MediaJob {
        uuid id PK
        uuid media_id FK
        string job_type "IMAGE, VIDEO, THUMBNAIL processing or RAW_CLEANUP"
        string status "PENDING, PROCESSING, SUCCESS, FAILURE, RETRYING"
        int attempts
        text error_message
    }
    JobLog {
        uuid id PK
        uuid job_id FK
        string stage
        text message
        datetime timestamp
    }
```

- **Soft delete:** the default `MediaAsset` manager hides deleted assets, and `all_objects` includes them.
- **Variants:** each asset has at most one `OPTIMIZED` variant and one `THUMBNAIL_720`.
- **Live updates:** every `MediaJob` and `JobLog` save is broadcast over WebSockets (§6).
- **Links into profiles:** profile and card photos are stored as URLs, not foreign keys. An asset is matched to them by its `remote_key`. See [Data Model](/tech-docs/Data-Model).

---

## 4. Encoding

### Images (libvips → AVIF)

- **Resize:** fit within 1920×1080, never upscaled.
- **Quality ladder:** decreasing quality is tried until the output is under the size budget (2 MB by default).
- **Profile media:** avatars, covers and profile images use a fixed high quality instead of the ladder.
- **Small files:** images under 250 KB skip resizing but are still converted to AVIF.
- **Thumbnail:** one 720px AVIF (`THUMBNAIL_720`).
- **Blurhash:** generated for every image. It is copied onto the matching profile image rows when a profile's media is linked.

### Video (ffmpeg → WebM)

AV1 (libsvtav1) and Opus, capped at 1920×1080. Files under 2 MB are stored as-is, and an encode that would come out larger than the original is discarded. (Not enabled for creators; see the note at the top.)

### Limits (environment-configurable)

| Setting | Default |
| :--- | :--- |
| Max image upload | 25 MB (the product's upload screens limit photos to 20 MB) |
| Max video upload | 500 MB |
| Max optimised image | 2 MB |
| Max optimised video | 50 MB |
| Image optimisation threshold | 250 KB |
| Video optimisation threshold | 2 MB |
| Raw file retention | 24 hours |

---

## 5. Queues and retries

| Queue | Handles | Production worker |
| :--- | :--- | :--- |
| `images` | Image processing, remote processing, reprocessing | `travingat-celery-image` (2 processes) |
| `thumbnails` | Thumbnail generation | `travingat-celery-thumbnail` (2 processes) |
| `videos` | Video processing | **none** |
| `maintenance` | Raw cleanup, scans, restore, database backup, storage reconciliation, sandbox cleanup | `travingat-celery-maintenance` |

**Retries:** up to 3 attempts with exponential backoff. Two cases are not retried:
- a corrupt or unreadable source is moved to the recycle bin;
- a source that is missing from R2 is marked as such.

```mermaid
sequenceDiagram
    autonumber
    participant Trigger as Upload path
    participant Redis as Redis
    participant Worker as Celery worker
    participant R2 as Cloudflare R2
    participant DB as PostgreSQL
    participant WS as WebSocket
    actor Dash as Media Engine dashboard

    Trigger->>Redis: queue job
    Redis->>Worker: worker picks it up
    Worker->>DB: MediaJob PROCESSING
    DB-->>WS: broadcast
    WS-->>Dash: live status
    Worker->>R2: download source
    Worker->>Worker: encode (libvips / ffmpeg)
    Worker->>R2: upload optimised + thumbnail
    Worker->>DB: MediaJob SUCCESS, JobLog rows
    DB-->>WS: broadcast
    WS-->>Dash: done
```

---

## 6. Reliability and live status

- **Statuses:** an asset goes `UPLOADING → PROCESSING → DONE | ERROR`; a job goes `PENDING → PROCESSING → SUCCESS | FAILURE | RETRYING`, with an attempt count and a log per job.
- **Idempotent:** a job checks for an existing variant first, so re-running it never processes the same file twice.
- **Stale jobs:** jobs stuck in `PROCESSING` for over 30 minutes can be reconciled from the dashboard. They're marked done if the output exists, otherwise failed with a reason.
- **WebSockets:** the `media_jobs_updates` channel group pushes every job and log change. Connections are allowed only from the internal network or with a signed admin session.

---

## 7. Scheduled jobs

| Job | Schedule | Purpose |
| :--- | :--- | :--- |
| Raw media cleanup | hourly | Removes processed raw uploads older than 24 hours |
| Unoptimised media scan | every 2 hours | Queues any profile, collection or card photo that isn't AVIF yet |
| Missing thumbnail scan | nightly, 04:00 | Queues 720px thumbnails for optimised images that lack one |
| Storage reconciliation | nightly, 03:00 | Compares per-user storage counters with R2 (dry run) |
| Sandbox cleanup | every 5 minutes | Purges legacy Media Portal uploads that still have an expiry; current sandbox uploads are kept permanently |
| Database backup | hourly | See [Architecture](/tech-docs/Techstack) |

---

## 8. Delete, restore and storage accounting

```mermaid
flowchart LR
    Asset["MediaAsset"] -->|soft delete| Bin["Recycle bin\n(hidden from normal views)"]
    Bin -->|restore| Asset
    Bin -->|permanent delete| Purge["Raw file and every variant\nremoved from R2, then the row"]
    Asset -.->|delete / restore / processed| Counter["UserStorage counters"]
```

- **Soft delete and restore** are instant and keep the files.
- **Permanent delete** removes the raw file and all variants from R2 before deleting the row.
- **Storage counters:** `devportal_userstorage` keeps per-user byte counts. They're updated on delete, restore and successful processing, and reconciled nightly.

> **Orphan cleanup:** the orphan scanner (Profiles → Orphans in admin, and the devportal Orphans tab) lists R2 objects that no profile, card or user references. Its delete **permanently** removes them from R2, so check the list first. Photos of soft-deleted profiles and users count as referenced.

---

## 9. Package versions (backend)

| Package | Version |
| :--- | :--- |
| Django | 4.2.30 |
| djangorestframework | 3.16.1 |
| Celery | ≥ 5.3.4 |
| pyvips | ≥ 2.2.3 |
| Pillow | ≥ 10.1.0 |
| blurhash-python | 1.2.2 |
| channels / channels_redis | 4.3.2 / 4.3.0 |
| daphne | 4.2.3 |
| boto3 / django-storages | 1.34.0 / ≥ 1.14.2 |
