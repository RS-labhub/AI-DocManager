# Working with Documents# Working with Documents



Documents are the core of R's DocManager. This guide covers everything from creation to access control.Documents are the core of R's DocManager.



## Creating Documents## Creating documents



### Upload Mode### Upload mode



Drag and drop a file or click to browse. Supported formats:Drag and drop a file or click to browse. Supported formats:



- PDF (embedded iframe viewer)- **PDF** with full text extraction

- DOCX/DOC (automatic text extraction via mammoth)- **DOCX** (Microsoft Word)

- TXT (plain text, direct display)- **TXT** (plain text)

- Markdown (.md files, formatted preview)- **CSV** (tabular data)

- HTML, JSON, CSV, RTF, ODT (text extraction)- **Markdown** (.md files)

- XLSX, PPTX (upload and download only)

Maximum file size is 50 MB.

Maximum file size is 50 MB.

### Write mode

When you upload a parseable file (DOCX, TXT, MD, HTML, JSON, RTF, ODT), the text content is automatically extracted and stored. This enables full-text search, AI actions, and formatted viewing.

Use the built-in rich text editor with:

### Write Mode

- Formatting toolbar: headings, bold, italic, code, quotes, lists, links, images, tables

Use the built-in rich text editor with:- Three view modes: Write, Preview, or Split

- Live preview with character, word, and line counts

- Formatting toolbar: headings, bold, italic, code, quotes, lists, links, images, tables

- Three view modes: Write, Preview, or Split### Document properties

- Live preview with character, word, and line counts

- RAG Import: import text from DOCX, TXT, MD, HTML, JSON, RTF, or ODT files directly into the editor| Property | Options | Description |

|----------|---------|-------------|

## Document Properties| Title | Free text | The document name |

| Tags | Comma-separated | Keywords for organization |

| Property | Options | Description || Status | Draft, Published, Archived | Lifecycle stage |

|----------|---------|-------------|| Classification | Public, Internal, Confidential, Top Secret | Access level |

| Title | Free text | Required. The document name || Password | Optional | Password-protect the document |

| Description | Free text | Optional brief description |

| Tags | Free-form labels | Keywords for search and organization |## Viewing documents

| Status | Draft, Under Review, Published, Archived | Controls visibility in listing tabs |

| Classification | Organization, Public, Internal, Confidential, General | Who can see the document |Click any document to see its detail page with:

| Access Level | View Only, Comment, Edit, Full Access | What viewers can do with the document |

| Password | Optional 9-digit code | Locks the document from viewing |- Full content rendered with markdown formatting

| Reviewers | Admin/Super Admin users | Required when status is Under Review |- Metadata: creation date, author, organization, classification, tags

| References | Link to other documents | Cross-reference related documents |- Reference number (DOC-XXXXX)

- AI action buttons

## Classification Explained- Comment thread



| Classification | Visibility |## Password-protected documents

|---------------|------------|

| Organization | Only visible to members of the same organization |- A lock icon appears on protected document cards

| Public | Visible to everyone, including other organizations |- Enter the correct password to view content

| Internal | Restricted to internal team use |- God-role users bypass password protection

| Confidential | Highly restricted access |

| General | Default, no special restrictions |## AI actions



### Default Classification by Role| Action | What it does |

|--------|-------------|

- God: defaults to Public| Summarize | Concise summary of the document |

- Super Admin: defaults to Organization| Analyze Sentiment | Determines tone and sentiment |

- Admin: defaults to Organization| Extract Key Points | Lists the most important points |

- User: defaults to Organization| Improve Writing | Suggestions for clarity and style |

| Translate | Translate to another language |

## Access Levels| Generate Q&A | Creates questions and answers |

| Custom Prompt | Run any custom instruction |

| Level | Can View | Can Comment | Can Edit |

|-------|----------|-------------|----------|## Comments

| View Only | Yes | No | No |

| Comment | Yes | Yes | No |Below each document is a comment section where organization members can discuss the content.

| Edit | Yes | Yes | Yes (non-uploaded docs) |
| Full Access | Yes | Yes | Yes |

When a document is set to View Only, the Comments button is hidden entirely.

## Document Status and Tabs

| Tab | What It Shows |
|-----|--------------|
| Published | Documents with status "published" |
| Drafts | Only your own draft documents |
| Review | All documents with status "under_review" visible to you |
| Archived | Only your own archived documents |
| For Me | Documents where you are assigned as a reviewer |

Status transitions: any status can be changed to any other status by the document owner or authorized users.

## Document Viewers

### PDF Viewer
PDFs are displayed in a full-height embedded iframe with zoom and page navigation. A download button is always available.

### Word Document Viewer (DOCX/DOC)
Word documents show a blue info banner indicating it is an extracted text view. The extracted content is rendered as formatted Markdown below. Download the original file for full formatting.

### Markdown Viewer
Markdown files show a purple banner and are rendered with full formatting: headings, bold, italic, code blocks, tables, links, images, and more.

### Plain Text Viewer
Plain text files show an info banner and display the content directly.

### Other Formats
If text was extracted during upload, it is rendered as Markdown. If no content was extracted (legacy uploads), a notice with a download button is shown.

## Reviewers

When setting a document's status to Under Review, you must assign at least one reviewer. Only admins and super admins from your organization can be selected as reviewers.

Reviewers see assigned documents in their "For Me" tab with a badge count.

## Document References

Documents can reference other documents within your organization (or public documents for God users). Referenced documents appear as links in the document detail sidebar.

## Password Protection

- Toggle password protection when creating or editing a document
- Uses a 9-digit numeric code, hashed with bcrypt
- Users must enter the correct code to view the document
- Document owners always have access without entering the code
- God-role users bypass password protection

## Deleting Documents

| Who | Can Delete |
|-----|-----------|
| Owner | Always their own documents |
| Admin | Own docs and any User's docs |
| Super Admin | Own docs, User's docs, and Admin's docs |
| God | Own docs and any public document |

When a document is deleted, the file is also removed from storage.

## God Multi-Organization Documents

When God creates a document:

- Select "All Orgs" to post to every organization, or select specific ones
- One copy is created per organization, but the file is uploaded only once to storage
- When God changes a document's status (e.g., draft to published), all copies across organizations are updated together
- Each organization sees the document in their own listing

## AI Actions

Available on any document with content:

| Action | Description |
|--------|-------------|
| Summarize | Generate a concise summary |
| Analyze | Deep content analysis |
| Improve Writing | Enhance clarity and style |
| Generate Insights | Extract key insights |
| Extract Keywords | Identify important terms |
| Translate | Translate to another language |
| Q&A | Ask questions about the document |

### Free Local Tools (No API Key Required)

| Tool | Description |
|------|-------------|
| Word Count | Words, characters, sentences, paragraphs |
| Structure | Headings and key phrases detection |
| Preview | First 500 characters of extracted text |

## Comments

Comments are available on documents with access level Comment, Edit, or Full Access. The comment sheet opens from the document header.

- View all comments with timestamps and usernames
- Post new comments (Ctrl+Enter to send)
- Delete your own comments (or any comment if Admin+)
- View Only documents do not show the comment button
