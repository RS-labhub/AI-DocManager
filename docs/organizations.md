# Organizations

R's DocManager supports multiple organizations with complete data isolation.

## What is an organization?

An organization is a workspace where users share documents. Each user belongs to one organization, and documents are scoped to the organization that created them.

## Organization Codes

Every organization has a unique **alphanumeric code** (4–16 characters). This code is used by new users to request membership during registration.

- Organization codes are generated automatically when an organization is created
- God-role users can view and regenerate organization codes from the God Panel
- Super Admins can share the code with prospective members

## Joining an Organization

1. During registration, enter the **Organization Code** provided by your organization
2. Your account is created with **pending** status
3. A **Super Admin** of that organization must approve your membership
4. Once approved, you can log in and access the dashboard

Users who register without an organization code get an account without an organization. They can join an organization later from **Settings → Join Organization**.

## Joining After Registration

If you registered without an organization code, you can join one at any time:

1. Go to **Dashboard → Settings** (or click "Join Organization" in dashboard Quick Actions)
2. Enter the organization code in the **Join Organization** card
3. Click **Request to Join**
4. Your request is submitted with **pending** status
5. A Super Admin must approve your membership before you gain access to the organization

> **Note:** The Join Organization option is only visible when you don't already belong to an organization.

## Membership Approval Flow

| Step | Who | What happens |
|------|-----|-------------|
| 1 | New user | Registers with an organization code |
| 2 | System | Account created with `pending` approval status |
| 3 | Super Admin | Sees pending user in User Management → approves or rejects |
| 4 | User | Can now log in and access the dashboard |

### For Super Admins

To become a Super Admin, contact the platform administrator at **rs4101976@gmail.com** to get access. Once you have Super Admin privileges, you can:

- View and approve/reject pending membership requests
- Share your organization's code with new members
- Manage all users within your organization

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
| Approve/reject pending members | Super Admin or above |
| View all orgs | Super Admin or above |
| View/regenerate org codes | God only |
| Create docs in other orgs | God only |
| Manage org settings | God only |
