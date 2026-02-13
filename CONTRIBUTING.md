# Contributing to Radhika's DocManager

## Development Setup

### Prerequisites

- Bun 1.1+ (or Node.js 18+)
- Supabase project (free tier works)
- Permit.io account (optional)

### Environment Variables

Copy `.env.example` to `.env` and fill in:

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SUPABASE_DB_PASSWORD=your_db_password
ENCRYPTION_KEY=your_64_char_hex_string
GROQ_API_KEY=your_groq_key
PERMIT_PDP_URL=https://cloudpdp.api.permit.io
PERMIT_SDK_TOKEN=your_permit_token
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

Generate an encryption key:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Install and Run

```bash
bun install
bun dev
```

### Database Setup

Run the SQL schema in Supabase SQL Editor, then visit `http://localhost:3000/api/seed` to seed demo data.

### Build

```bash
bun run build
```

## Database Schema

### Tables

| Table | Description |
|-------|-------------|
| organizations | Multi-tenant organizations with slug and description |
| profiles | User profiles with role, org_id, and active status |
| credentials | bcrypt password hashes (separate from profiles) |
| documents | Core documents table (see fields below) |
| document_passwords | bcrypt-hashed 9-digit document passwords |
| document_comments | Threaded comments per document |
| ai_api_keys | AES-256-GCM encrypted API keys per user per provider |
| ai_agents | AI agents with roles and capabilities |
| ai_actions | AI action requests with approval workflow |
| audit_logs | Comprehensive audit trail for all operations |

### Document Fields

| Field | Type | Description |
|-------|------|-------------|
| id | uuid | Primary key |
| ref_number | serial | Auto-incrementing reference number (DOC-00001) |
| title | text | Document title (required) |
| content | text | Full text content (extracted or written) |
| description | text | Optional description |
| file_url | text | Supabase storage URL for uploaded files |
| file_type | text | File extension (pdf, docx, md, etc.) |
| file_size | bigint | Size in bytes |
| classification | text | organization, public, internal, confidential, general |
| access_level | text | view_only, comment, edit, full_access |
| status | text | draft, under_review, published, archived |
| reviewers | uuid[] | Array of reviewer user IDs |
| referenced_docs | uuid[] | Array of referenced document IDs |
| is_public | boolean | Whether the document is publicly accessible |
| is_password_protected | boolean | Whether password protection is enabled |
| tags | text[] | Array of tag strings |
| owner_id | uuid | Document creator (FK to profiles) |
| org_id | uuid | Organization scope (FK to organizations) |
| version | integer | Document version number |
| last_accessed_at | timestamptz | Last access timestamp |
| created_at | timestamptz | Creation timestamp |
| updated_at | timestamptz | Last update timestamp |

## Role Hierarchy

| Role | Weight | Description |
|------|--------|-------------|
| God | 100 | Platform-wide control, all organizations |
| Super Admin | 75 | Cross-org visibility, promotes up to Admin |
| Admin | 50 | Org-level user and document management |
| User | 10 | Own documents only |

### Permission Functions (lib/permissions.ts)

- `outranks(roleA, roleB)`: Returns true if roleA's weight is strictly greater than roleB's weight
- `isAtLeast(roleA, roleB)`: Returns true if roleA's weight is greater than or equal to roleB's weight

### Delete Permissions

| Role | Can Delete |
|------|-----------|
| User | Own documents only |
| Admin | Own docs + User docs |
| Super Admin | Own docs + User docs + Admin docs |
| God | Own docs + any public document |

When a document is deleted, the uploaded file is also removed from the storage bucket.

### Default Classification by Role

| Role | Default Classification | Default Access Level |
|------|----------------------|---------------------|
| God | Public | Comment |
| Super Admin | Organization | View Only |
| Admin | Organization | View Only |
| User | Organization | View Only |

## Document Lifecycle

### Status Flow

Documents can have one of four statuses. Status can be changed at any time by the document owner.

- Draft: only the creator can see it (in Drafts tab)
- Under Review: visible to org members, appears in reviewer's "For Me" tab
- Published: visible in the Published tab to all org members
- Archived: only the creator can see it (in Archived tab)

### God Multi-Org Publishing

When God creates a document with "All Orgs" selected:
1. A document record is inserted for each organization
2. The file is uploaded to storage only once (first org)
3. Subsequent org copies reference the same storage URL
4. When God changes the status, all copies are updated together

### Access Level Behavior

- View Only: document is read-only, Comments button is hidden
- Comment: read-only content, but commenting is enabled
- Edit: content can be edited (for non-uploaded documents)
- Full Access: all capabilities including password management

## Document Viewers

### PDF
Displayed in a full-height embedded iframe with native browser PDF controls. Download button always available.

### DOCX/DOC
Shows a blue info banner with "Word document -- showing extracted text content." Content is rendered as formatted Markdown using ReactMarkdown. Download button for the original file.

### Markdown (.md)
Shows a purple banner with "Markdown document -- rendered preview below." Content is rendered with full Markdown formatting (headings, tables, code blocks, links, etc.).

### Plain Text (.txt)
Shows an info banner with "Plain text document." Content is displayed directly.

### Legacy Uploads (No Content)
Shows "No text content available" notice with a download button. This applies to files uploaded before automatic content extraction was enabled.

## Security

### API Key Encryption
User API keys are encrypted with AES-256-GCM before storage. Each key has its own random IV and authentication tag. Keys are decrypted in memory only at the moment of an AI API call.

### Authentication
Passwords are hashed with bcrypt. Sessions use browser localStorage with the user profile object. No third-party auth dependency.

### Document Passwords
9-digit numeric codes hashed with bcrypt. Document owners always have access. God bypasses password protection.

### Authorization Layers
1. Client-side: Route guards via AuthProvider and role checks
2. Server-side: outranks() and isAtLeast() checks in API routes
3. Permit.io: Optional policy-based authorization with graceful fallback
4. Database: Row Level Security on all Supabase tables

## API Routes

| Route | Method | Description |
|-------|--------|-------------|
| /api/upload-document | POST | Upload file to storage + extract content |
| /api/parse | POST | Parse file and return extracted text |
| /api/document-file | GET | Serve file from storage |
| /api/document-password | POST/PUT/DELETE | Set, verify, or remove document password |
| /api/document-comments | GET/POST/DELETE | Manage document comments |
| /api/ai/actions | POST | Run AI action on document content |
| /api/docs | GET | Serve documentation Markdown files |
| /api/seed | GET | Seed demo data |

## Supported Document Formats

| Format | Extension | Viewer | Content Extraction |
|--------|-----------|--------|-------------------|
| PDF | .pdf | Embedded iframe | No |
| Word | .docx, .doc | Extracted text + Markdown | Yes (mammoth) |
| Plain Text | .txt | Direct display | Yes |
| Markdown | .md | Formatted Markdown | Yes |
| HTML | .html | Markdown rendering | Yes |
| JSON | .json | Markdown rendering | Yes |
| CSV | .csv | Markdown rendering | Yes |
| RTF | .rtf | Extracted text | Yes |
| ODT | .odt | Extracted text | Yes |
| Excel | .xlsx | Upload only | No |
| PowerPoint | .pptx | Upload only | No |

## Demo Accounts

After seeding (visit /api/seed):

| Email | Role | Organization |
|-------|------|-------------|
| god@docmanager.ai | God | Platform-wide |
| super.admin@docmanager.ai | Super Admin | Platform-wide |
| admin@acme.com | Admin | Acme Corp |
| admin@globex.com | Admin | Globex Inc |
| admin@initech.com | Admin | Initech LLC |
| alice@acme.com | User | Acme Corp |
| bob@globex.com | User | Globex Inc |
| carol@initech.com | User | Initech LLC |
| dave@acme.com | User | Acme Corp |
| eve@globex.com | User | Globex Inc |

Password for all accounts: `Password123!`

## Scripts

| Script | Description |
|--------|-------------|
| bun dev | Start development server |
| bun run build | Production build |
| bun start | Start production server |
| bun run lint | ESLint |

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router) |
| Runtime | Bun 1.1 |
| Language | TypeScript 5 |
| Database | Supabase (PostgreSQL) |
| Auth | bcryptjs + custom session |
| Authorization | Permit.io + local RBAC |
| Encryption | Node.js crypto (AES-256-GCM) |
| UI | shadcn/ui + Tailwind CSS |
| Markdown | react-markdown + remark-gfm |
| AI Providers | Groq, OpenAI, Anthropic |
| Parsing | pdf-parse, mammoth |
