# Organizations

R's DocManager supports multiple organizations with complete data isolation.

## What is an organization?

An organization is a workspace where users share documents. Each user belongs to one organization, and documents are scoped to the organization that created them.

## Creating an organization

During registration, you can join an existing organization or type a new name to create one automatically.

## Data isolation

- Documents are completely separate between organizations
- Users only see members of their own organization
- API keys are personal, not shared across the organization
- Comments are scoped to the document's organization

## Multi-org features (God role)

God-role users can create documents in specific organizations or all organizations at once. Super Admin and God users can view documents and users across all organizations.

## Organization management

| Action | Required role |
|--------|--------------|
| View org members | Admin or above |
| Add users to org | Admin or above |
| View all orgs | Super Admin or above |
| Create docs in other orgs | God only |
| Manage org settings | God only |
