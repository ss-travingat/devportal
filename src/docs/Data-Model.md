---
title: Data Model — Users, Profiles & Explorer Cards
description: The PostgreSQL schema behind every person on Travingat — which table owns which field, how profiles and Explorer Cards share one user record, the photo and country rules, and what is safe to delete.
category: Architecture
author: Travingat Engineering
updatedAt: 2026-11-09
---

# Data Model — Users, Profiles & Explorer Cards

Every person on Travingat is **one row in `users_user`**. That row holds who they are: name, home country, avatar and cover photo, visited countries, and their status flags. The two things a person can make sit on top of it:

- a **Featured Profile** (`profiles_featuredprofile`) holds only the profile's *content*: handle, bio, socials, photo folders and collections;
- an **Explorer Card** (`profiles_explorercard`) holds only what is specific to the card: its crops and any photos uploaded on the card itself.

Nothing about a person is stored twice. A profile and a card read the person's name, country, countries and flags from the same `users_user` row, so editing them in one place updates both.

> This layout has been in place since 9 Nov 2026. Before that, name, country, photos, visited countries and flags were copied separately onto the user, the profile and the card. See [Migration history](#migration-history).

---

## 1. Entity relationship diagram

```mermaid
erDiagram
    users_user ||--o| profiles_featuredprofile : "has (required, PROTECT)"
    users_user ||--o| profiles_explorercard : "has (required, CASCADE)"
    users_user ||--o{ waitlist_waitlistentry : "matched by email (SET_NULL)"
    users_user ||--o{ users_identityconflict : "archived values"
    users_user ||--o| devportal_userstorage : "storage counters"
    users_user ||--o{ media_engine_mediaasset : uploads

    profiles_featuredprofile ||--o{ profiles_profilegalleryimage : gallery
    profiles_featuredprofile ||--o{ profiles_profileaboutimage : about
    profiles_featuredprofile ||--o{ profiles_profilecountrygroup : "country folders"
    profiles_profilecountrygroup ||--o{ profiles_profilecountryimage : photos
    profiles_featuredprofile ||--o{ profiles_profilecollection : collections
    profiles_profilecollection ||--o{ profiles_profilecollectionimage : photos

    users_user {
        uuid id PK
        string email UK "login; sample+handle@travingat.internal for sample accounts"
        string first_name
        string last_name
        string country "home country name"
        string flag
        string flag_code "ISO code of home country"
        string currently_in
        string currently_in_flag_code
        string avatar_url "profile photo"
        string avatar_blurhash
        string cover_photo_url "cover photo"
        string cover_blurhash
        string_array visited_countries "ISO codes, one list for profile and card"
        int visited_count
        string_array links
        bool is_featured "live as a Featured Profile"
        bool has_explorer_card
        bool show_badge "one badge flag for profile and card"
        bool is_sample "shows the sample badge"
        string explorer_card_variant "classic, minimal or adventure"
        datetime created_at
        datetime updated_at
        datetime deleted_at "soft delete"
    }

    profiles_featuredprofile {
        uuid id PK
        uuid user_id FK "NOT NULL, unique"
        string handle UK "e.g. @mayaroams"
        string review_status "draft, ready_for_review, changes_requested, published"
        text rejection_reason
        datetime reviewed_at
        text bio
        string align
        json socials "x, instagram, linkedin, youtube, tiktok, facebook"
        json interests
        json languages
        json avatar_crop_data "profile-page crop of the user's avatar"
        json cover_crop_data "profile-page crop of the user's cover"
        int countries "counter"
        int media "counter"
        int collections "counter"
        datetime created_at
        datetime updated_at
        datetime deleted_at "soft delete"
    }

    profiles_explorercard {
        uuid id PK "sample cards share their profile's id"
        uuid user_id FK "NOT NULL, unique"
        json profile_crop "one profile-photo crop for every style"
        json classic_cover_crop
        json minimal_cover_crop
        json adventure_cover_crop
        text own_avatar_url "column profile_image_url; NULL = use the user's"
        string own_avatar_blurhash "column profile_blurhash"
        text own_cover_url "column cover_image_url; NULL = use the user's"
        string own_cover_blurhash "column cover_blurhash"
        datetime created_at
        datetime updated_at
    }

    profiles_profilecountrygroup {
        uuid id PK
        uuid profile_id FK
        string country_code "unique per profile"
        string country_name
        text cover_photo
        string cover_blurhash
        text about
        int order
    }

    profiles_profilecollection {
        uuid id PK
        uuid profile_id FK
        string name
        json country_codes
        text cover_photo
        json header_images "up to 3 URLs"
        text about
        int order
    }

    profiles_profilecountryimage {
        uuid id PK
        uuid group_id FK
        text url "R2 URL"
        int width
        int height
        string blurhash
        int order
    }

    profiles_profilecollectionimage {
        uuid id PK
        uuid collection_id FK
        text url "R2 URL"
        string country_code
        int width
        int height
        string blurhash
        int order
    }

    profiles_profilegalleryimage {
        uuid id PK
        uuid profile_id FK
        text url
        int order
    }

    profiles_profileaboutimage {
        uuid id PK
        uuid profile_id FK
        text url
        int order
    }

    waitlist_waitlistentry {
        int id PK
        string email UK
        uuid user_id FK "nullable; set once the person has an account"
        string get_featured_status
        string explorer_card_status
        json featured_application "frozen snapshot of the Get Featured submission"
        bool confirmed
        datetime deleted_at
    }

    users_identityconflict {
        uuid id PK
        uuid user_id FK
        string field
        string source "user, featured_profile or explorer_card"
        text value "the copy that was not kept"
        text chosen "what ended up on the user"
    }

    devportal_userstorage {
        int id PK
        uuid user_id FK
        bigint original_bytes
        bigint optimized_bytes
        bigint thumb_bytes
        int object_count
    }

    media_engine_mediaasset {
        uuid id PK
        uuid user_id FK "nullable"
        string remote_key "R2 object key"
        string status
        string blurhash
        datetime deleted_at "recycle bin"
    }
```

Media processing (`MediaVariant`, `MediaJob`, `JobLog`) and the devportal tables are covered in [Media Engine](/tech-docs/Media-Engine) and [Tech Stack & Architecture](/tech-docs/Techstack).

---

## 2. Where each piece of data lives

| Data | Stored on | Read by |
| :--- | :--- | :--- |
| Name, home country, flag, "currently in" | `users_user` | profile page, Explorer Card, admin, waitlist list |
| Visited countries | `users_user.visited_countries` (ISO codes) | profile (as codes), Explorer Card (as display names) |
| Profile photo & cover (the profile's) | `users_user.avatar_url` / `cover_photo_url` | profile page; the card when it has no photo of its own |
| Card's own photo & cover | `profiles_explorercard.own_avatar_url` / `own_cover_url` | Explorer Card only |
| Featured / badge / sample / card style | `users_user` flags | profile page, card, admin review queue |
| Handle, bio, socials, interests, languages | `profiles_featuredprofile` | profile page |
| Review workflow | `profiles_featuredprofile.review_status` | admin review, Get Featured status |
| Country folders, collections, photos | `profiles_profile*` image tables | profile page |
| Profile-page crops | `profiles_featuredprofile.avatar_crop_data` / `cover_crop_data` | profile page |
| Card crops | `profiles_explorercard` crop columns | Explorer Card |

The API responses (`/api/profiles/...`, `/api/explorercard/...`) still use the same field names as before, so the landing and admin apps did not need to change. In the backend, `profile.first_name`, `card.show_badge` and so on still work. They are properties that read and write the user (`profiles/user_backed.py`). New code should use `profile.user.first_name`.

---

## 3. Rules

### Every profile and card has a user

`user_id` is required on both tables. Profiles made in the admin editor for sample creators get a placeholder account, `sample+<handle>@travingat.internal`. Nobody can log in to it (it has an unusable password and no OTP). Placeholder accounts are hidden from the admin Users list and can't be deleted there. Each one owns a sample profile and all its photos. Placeholder emails are returned as an empty `email` in the API.

### Cover and profile photo: card vs profile

```mermaid
flowchart TD
    A["Explorer Card shows a photo"] --> B{"Card has its own\nuploaded photo?"}
    B -->|yes| C["Card's own photo"]
    B -->|no| D["User's photo\n(the profile's)"]

    U["Photo uploaded on the card"] --> P{"Person has a\nFeatured Profile?"}
    P -->|yes| O["Saved on the card only.\nProfile photo untouched."]
    P -->|no| N["Saved as the user's photo"]

    F["Featured Profile created\nafter the card"] --> G["Card keeps the photo it shows now"]
    F --> H{"Profile created\nwith a photo?"}
    H -->|no| I["Profile starts with the card's photo"]
    H -->|yes| J["Profile uses its own"]
    G --> K["From here on, card and profile\nphotos are separate"]
    I --> K
    J --> K
```

If the card editor submits the user's current photo unchanged (for example, a prefilled image), that is **not** an own upload, and the card keeps following the user's photo.

### Visited countries

There is one list, stored as ISO codes on `users_user.visited_countries`. The profile returns it as codes (`visited_country_codes`). The Explorer Card returns it as display names (`visited_countries`), because that is what the card's country picker matches on. Submitting the Explorer Card form:

- **with a profile**, only ever *adds* countries, because countries carry the profile's photo folders. Each new country gets an empty folder on the profile.
- **without a profile**, saves the list exactly as submitted.

### Card crops

`cover_crop_data` in the API is a dict keyed by style: `{"Classic": {...}, "Minimal": {...}, "Adventure": {...}}`, with only the styles that have a crop. It is stored one column per style. An older single-crop format is accepted and stored under the card's current style.

### Deleting

| Action | What happens |
| :--- | :--- |
| Delete a user | **Blocked** while they have a Featured Profile (`PROTECT`). Delete the profile first, which is what the admin recycle bin does. The user's Explorer Card is deleted with them (`CASCADE`). |
| Delete a profile | Its photo folders, collections and image rows are deleted with it (`CASCADE`). Prefer the soft delete (`deleted_at`), which keeps everything restorable. |
| Soft-deleted rows | Users, profiles and media assets have `deleted_at`. The default querysets hide them; `all_objects` includes them. |

---

## 4. References without a foreign key

These links are matched by value, so the database does not enforce them:

| Column | Points at | Note |
| :--- | :--- | :--- |
| `users_otp.email` | `users_user.email` | OTPs exist before the account does |
| `waitlist_waitlistentry.email` | `users_user.email` | `user_id` is filled in once an account exists |
| Image `url` columns on the profile image tables | R2 objects / `media_engine_mediaasset.remote_key` | URL strings, not FKs |
| `media_engine_usageevent.media_id` | `media_engine_mediaasset.id` | bare UUID |
| `devportal_devportalimageupload.media_asset_id` | `media_engine_mediaasset.id` | bare UUID |

---

## 5. Protecting the sample profiles

The admin-made sample profiles hold most of the platform's photos (about 15,000 image rows across 20 profiles). Before any migration that touches profiles:

1. Take a dump on the VPS: `docker exec travingat-db pg_dump -U travingat_user -Fc travingat_prod > ~/backups/<name>.dump`
2. Record a baseline: `docker exec travingat-backend python manage.py profile_image_census --out /tmp/census.json`
3. After the deploy, compare: `python manage.py profile_image_census --compare /tmp/census.json`. It exits with an error and lists every missing profile, changed photo list or dropped avatar/cover URL.

Do not run the orphan-file cleanup (admin → Profiles → Orphans) without checking its list first. It permanently deletes R2 objects.

---

## 6. Migration history

The consolidation shipped in stages on 9 Nov 2026. Each stage was rehearsed on a restore of the production database and checked with the image census.

| Migration | What it did |
| :--- | :--- |
| `users/0004`, `profiles/0028`, `waitlist/0010` | Added the identity and status columns to `users_user`, the per-style crop columns to `profiles_explorercard`, and `user_id` to `waitlist_waitlistentry` |
| `users/0005` | Gave every profile a user (11 placeholder accounts for sample profiles), copied identity onto `users_user`, and archived any disagreeing copies in `users_identityconflict` |
| `users/0006`, `users/0007` | Split per-style cover crops correctly; re-ran the copy before reads switched to `users_user` |
| `profiles/0029` | Removed the duplicated fields from the profile and card models (columns kept for rollback) |
| `profiles/0030` | Brought back the card's own cover and profile photo |
| `profiles/0031` | Dropped the duplicated columns and the unused legacy `profiles_profile` table; made `user_id` required |

---

## 7. Known gaps

- **Counters** (`profiles_featuredprofile.countries`, `media`, `collections`) are kept up to date by application code, not by the database.
- **`interests` and `languages`** are JSON lists, while `users_user` uses Postgres arrays for its lists.
- **`waitlist_waitlistentry`** has `deleted_at` but no manager that hides deleted rows, and uses an integer primary key where everything else uses UUIDs.
- **Image URLs** on the profile tables are not foreign keys to `media_engine_mediaasset`; see [§4](#4-references-without-a-foreign-key).
