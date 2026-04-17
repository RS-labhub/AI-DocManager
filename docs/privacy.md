# Privacy Practices

A short, plain-English summary of what we store, why, and who can see it.

## What we collect

- **Account info**: name, email, hashed password, role, organization membership.
- **Documents**: files you upload, extracted text, and the metadata you provide (title, description, tags).
- **AI usage**: the actions you run and the resulting responses, so you can revisit them.
- **Audit logs**: security-relevant events (logins, approvals, password resets, role changes).

## What we don't collect

- No third-party analytics or ad trackers.
- No selling of user data, ever.
- No cross-site tracking.

## How data is stored

- Documents, users, and logs live in Supabase (Postgres + storage).
- AI provider API keys are encrypted with AES-256-GCM before being stored.
- Document passwords are stored as salted hashes, never in plaintext.

## Who can see your data

- You can see your own documents and any shared with you.
- Admins can see users and documents inside their organization.
- Super Admins can manage users, approvals, and organization settings.
- The creator / operator has access to the underlying database for support and maintenance.

## AI providers

- When you run an AI action, the document text and your prompt are sent to the provider you configured (for example, Groq, OpenAI, or Anthropic).
- That provider processes the request under its own privacy terms.
- We don't forward your data to any other third party.

## Retention and deletion

- Documents stay until you or an admin delete them.
- Deleted documents are removed from the database and storage.
- Audit logs are retained for security investigations.
- Ask an admin to remove your account if you want your personal data deleted.

## Your controls

- Change your password at any time from the settings page.
- Reset a forgotten password via the [forgot-password page](/forgot-password).
- Revoke or rotate AI keys from the AI keys page.
- Ask an admin to update or remove your data.

## Security

See [Security and Privacy](/docs) for the full details on authentication, encryption, and access control.

## Changes

Privacy practices can change as features evolve. Material changes will be announced inside the app where practical.
