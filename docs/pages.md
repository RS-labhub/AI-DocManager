# Pages

Pages are Notion-style rich documents that live alongside files in R's DocManager. They are built for writing, not uploading — think meeting notes, specs, runbooks, wikis, and personal scratchpads.

Pages and Documents are separate systems:

- **Documents** are file-first. You upload or write once, then classify, password-protect, review, and reference them.
- **Pages** are content-first. You open one, start typing, and the editor saves as you go. Sharing is per-page and granular.

If you need file upload, password protection, or reviewer workflows, use Documents. If you need a clean surface to write and collaborate, use Pages.

## Creating a page

### From the sidebar

1. Open **Dashboard → Pages**
2. Click **New page** in the left sidebar (or the big CTA on the overview)
3. The editor opens on a new page titled "Untitled" with default visibility

New pages are created with sensible defaults:

- Organization members → visibility is **Organization**
- Users without an organization → visibility is **Private** (personal page)

You can change both from the Share dialog at any time.

### Importing a Markdown file

1. Click **Import** in the sidebar
2. Select a `.md` file (maximum 2 MB)
3. The page is created with the file's title (first `#` heading if present) and the parsed Markdown is rendered as editable blocks

Only Markdown (`.md`) is supported for import today.

## The page editor

Pages use a BlockNote-based block editor. Every page has:

- **Emoji** — an optional icon shown in the sidebar and page header
- **Cover image** — an optional banner image at the top of the page (PNG, JPEG, WebP, or GIF, up to 10 MB)
- **Title** — a free-text heading
- **Body** — a tree of blocks: paragraphs, headings, lists, quotes, code blocks, tables, images, and more

### Autosave

Changes are saved automatically with a short debounce. The header shows `Saving…` while a save is in flight and `Saved` once the server confirms. If a save fails (network or permission), the header shows an error badge and retries on the next edit.

### Export as Markdown

From the page's ⋯ menu, click **Download** to export the current page as a `.md` file. The exported file reflects the latest content, including blocks that were edited after the last autosave.

### Archiving and deleting

- **Archive** hides a page from the default sidebar list. Archived pages are still reachable from the **Show archived** toggle and can be restored at any time.
- **Delete** permanently removes a page. Only callers with `full_access` on the page can delete it.

## Page visibility

Visibility controls who can see a page by default. Explicit shares (see below) can always grant access above or below the visibility tier.

| Visibility | Who can see it | Notes |
|------------|----------------|-------|
| Private | Only the owner and explicit shares | Default for personal (org-less) pages |
| Organization | Everyone in the same organization | Default for org members |
| Role | Members of the same organization at or above a minimum role | Requires a `min_role`: user, admin, super_admin, or god |
| Restricted | Only explicit shares (and owner / admins) | No implicit organization visibility |
| Public link | Anyone on the internet with the URL | No sign-in required, served from `/p/<id>` |

### Personal pages (no organization)

Users who have not joined an organization can still create pages. These personal pages live outside any org and can only be **Private** or **Public link** — the `org`, `role`, and `restricted` tiers require an organization and are rejected server-side.

### Public link pages

When a page's visibility is set to **Public link**, it becomes readable at `/p/<page-id>` with no authentication:

- The proxy whitelists `/p/*` and `/api/pages/*/public` for anonymous access
- Only pages with visibility exactly `public_link` are served — anything else returns 404 to avoid leaking existence
- Archived pages are never served publicly
- The response is trimmed to the viewer-relevant fields (no share list, no internal metadata)
- Reads are rate-limited per IP to discourage enumeration

Switch visibility away from **Public link** to immediately revoke public access.

## Page permissions

Every caller resolves to exactly one of four permission levels on a page, or no access at all.

| Permission | Can view | Can comment | Can edit body | Can change visibility / cover / shares / delete |
|------------|----------|-------------|---------------|-----------------------------------------------|
| view | Yes | No | No | No |
| comment | Yes | Yes | No | No |
| edit | Yes | Yes | Yes | No |
| full_access | Yes | Yes | Yes | Yes |

### How permission is resolved

The server evaluates these rules in order and returns the first match:

1. **God** → always `full_access` on every page, across every organization
2. **Owner** → always `full_access` on their own pages
3. **Explicit share** → whatever permission the share grants, regardless of visibility
4. **Personal pages** → only the owner (and god) can see them; no org elevation applies
5. **Same-org Super Admin or Admin** → implicit `full_access` on any page in their organization
6. **Same-org members** — fall through to the visibility tier:
    - `private` → no access
    - `org` → `view`
    - `role` → `view` if the member's role is at least `min_role`, otherwise no access
    - `restricted` → no access (only explicit shares grant access)
    - `public_link` → handled through the anonymous endpoint, not the authenticated path
7. **Cross-org callers** → no access (god is the only exception)

Writes always require the matching permission level:

- Editing the body, title, or emoji requires `edit`
- Changing visibility, `min_role`, cover image, archiving, or deleting requires `full_access`
- Managing explicit shares requires `full_access`

### Why the math lives in two places

The permission rules exist in both the database (`page_permission_for` Postgres function, enforced by Row Level Security) and in `lib/permissions.ts` on the server. The database is the source of truth — the TypeScript helper only exists so API routes can return clean 403 / 404 error messages and so the UI can hide controls the caller can't use.

## Sharing a page

Open a page and click **Share** to open the share dialog. You need `full_access` on the page to change anything here.

### Change the visibility tier

Pick any of Private, Organization, Role, Restricted, or Public link. If you pick Role, you must also pick the minimum role (User, Admin, Super Admin, or God). Switching away from Role clears the minimum role automatically.

### Invite specific people

Enter a teammate's email and pick a permission (Can view, Can comment, Can edit, Full access). The email must belong to an active user in your organization — external invites and email-based invite links are not part of this release.

Explicit shares are stored in the `page_shares` table and override visibility for that specific user. Example: a `restricted` page with a single `comment` share gives exactly one person comment access and hides the page from everyone else.

Remove a share with the trash icon next to the row.

### Copy the public link

When visibility is **Public link**, the dialog shows a **Copy link** button that copies the full `/p/<id>` URL. Revoke access by switching visibility to any other tier.

## Cover images

Upload a cover from the page header's cover controls:

- Supported formats: PNG, JPEG, WebP, GIF
- Maximum size: 10 MB
- Covers are stored in the private `page-covers` Supabase Storage bucket
- The server returns a long-lived signed URL (one year) that is saved on the page row

Changing or clearing a cover requires `full_access` on the page.

## Pages and roles

The 4-tier role hierarchy carries over to pages with one addition: **Super Admin and Admin inside the page's organization get implicit `full_access`**. This mirrors how they can already manage any document in their org.

| Role | Own pages | Org pages (other owners) | Other orgs' pages | Can be invited via share |
|------|-----------|--------------------------|-------------------|--------------------------|
| User | full_access | Resolved by visibility (view / none) | No access | Yes, within the same org |
| Admin | full_access | Implicit full_access | No access | Yes, within the same org |
| Super Admin | full_access | Implicit full_access | No access | Yes, within the same org |
| God | full_access | full_access | full_access | Yes, anywhere |

Specifically for pages:

- **User** can create, edit, and share their own pages, and see any `org` / matching `role` / shared page in their organization.
- **Admin** and **Super Admin** can fully manage every page in their organization, including changing visibility and deleting pages they don't own.
- **God** can fully manage every page across every organization and is the only role that can see and edit pages in organizations they don't belong to.
- Personal pages (no org) are invisible to Admin and Super Admin even if they share an org context — only the owner and God can see them.

## Pages vs Documents — when to use which

| You want to... | Use |
|---------------|-----|
| Upload a PDF, DOCX, or spreadsheet | Documents |
| Password-protect a file with a 9-digit code | Documents |
| Require reviewer sign-off before publishing | Documents |
| Classify content as Confidential / Internal | Documents |
| Publish the same file to multiple organizations (god) | Documents |
| Write rich notes with blocks, headings, and lists | Pages |
| Share a single note publicly at a clean URL | Pages |
| Grant per-person view / comment / edit access | Pages |
| Restrict a note to admins and above in your org | Pages |
| Keep personal notes without joining an organization | Pages |

## Rate limits

Pages endpoints are rate-limited to keep the service stable:

| Action | Limit |
|--------|-------|
| Create a page | 30 per 5 minutes per user |
| Import a Markdown file | 20 per 5 minutes per user |
| Public page reads | 60 per minute per IP |

Hitting a limit returns HTTP 429. Wait a moment and try again.

## Audit trail

Page lifecycle events are written to the audit log so organization admins can review activity:

- `page.create` — a new page was created
- `page.update` — body, title, visibility, cover, or archive state changed
- `page.delete` — a page was permanently removed
- Share mutations are recorded on the `page_shares` table and surface in the share dialog

Audit entries include the actor, the page id, the originating IP, and a small `details` payload describing what changed.
