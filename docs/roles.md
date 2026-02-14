# Roles and Permissions

R's DocManager uses a 4-tier role hierarchy. Each role has specific capabilities for document creation, viewing, deletion, and management.

## Role Hierarchy

| Role | Weight | Scope |
|------|--------|-------|
| User | 10 | Own documents within their organization |
| Admin | 50 | All documents and users in their organization |
| Super Admin | 75 | Cross-organization visibility and management |
| God | 100 | Full platform control across all organizations |

A higher-weighted role "outranks" lower roles. This determines who can delete whose documents and who can manage whom.

## User (Weight: 10)

The default role for new accounts.

### Document Creation
- Create documents via upload or write mode
- Default classification: Organization
- All status options available: Draft, Under Review, Published, Archived

### Document Access
- Can only see their own documents
- Published, Drafts, Archived tabs show only their own docs
- For Me tab shows docs assigned to them for review (if any)

### Document Deletion
- Can only delete their own documents

### Other Capabilities
- Run AI actions with personal API keys
- Manage personal API keys and profile settings
- Add comments on documents with Comment access level or higher

### Cannot Do
- See other users' documents
- Delete other users' documents
- Manage users or access admin panels
- Be selected as a document reviewer

## Admin (Weight: 50)

Organization administrators with expanded access.

### Document Creation
- Same as User
- Default classification: Organization
- Can be selected as a document reviewer

### Document Access
- View all documents within their organization
- All tabs show org-wide documents (not just their own)

### Document Deletion
- Delete their own documents
- Delete any User's documents (outranks User: 50 > 10)
- Cannot delete Super Admin or God documents

### Other Capabilities
- Manage users in their organization
- View organization-level audit logs
- View organization statistics

## Super Admin (Weight: 75)

Cross-organization managers with elevated privileges.

### Document Creation
- Same as User
- Default classification: Organization
- Can be selected as a document reviewer

### Document Access
- View all documents within their organization
- Cross-organization visibility for management

### Document Deletion
- Delete their own documents
- Delete any User's documents (outranks User: 75 > 10)
- Delete any Admin's documents (outranks Admin: 75 > 50)
- Cannot delete God documents or other Super Admin documents

### Other Capabilities
- Promote users up to the Admin role
- Manage users across organizations
- **Approve or reject pending membership requests** from users who signed up with an organization code
- Export user data (CSV/JSON)

## God (Weight: 100)

Platform-wide control with unique multi-org capabilities.

### Document Creation
- Can post documents to all organizations at once or select specific ones
- File is uploaded only once to storage (not duplicated per org)
- Default classification: Public
- Default access level: Comment

### Document Access
- View all documents across all organizations
- Documents are deduplicated in the listing (same title + owner shown once)
- Can filter by organization in the document listing

### Document Deletion
- Delete their own documents
- Delete any public document regardless of owner role
- Cannot delete non-public documents owned by others

### Status Management
- When God changes a document's status, all copies across organizations update together
- This ensures a document published by God appears as published in every organization

### Other Capabilities
- Full God Panel with platform overview
- Access to all organizations and documents
- Manage any user and assign any role
- **View and regenerate organization codes**
- Bypass document password protection
- Platform-wide system settings
- Create documents in multiple organizations simultaneously

## Role Assignment

- New users start as User
- Admins cannot change roles
- Super Admins can promote users up to Admin
- God users can assign any role including God
- **Super Admin access must be requested by contacting rs4101976@gmail.com**

## Delete Permission Summary

| Deleter Role | Can Delete Documents From |
|-------------|--------------------------|
| User | Own docs only |
| Admin | Own + User docs |
| Super Admin | Own + User + Admin docs |
| God | Own + any public doc |
