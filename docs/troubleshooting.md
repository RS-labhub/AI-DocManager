# Troubleshooting

Common issues and how to resolve them.

## Login Issues

### Invalid credentials error

Double-check your email and password. Passwords are case-sensitive. Contact a God-role administrator if you have forgotten your password.

### Email already exists during registration

Each email can only be used once. Try logging in instead or use a different email.

### Logged out unexpectedly

Sessions are stored in browser local storage. Clearing browser data will log you out. Log in again.

## Document Issues

### Document content appears empty

For newly uploaded files (DOCX, TXT, MD, etc.), text is automatically extracted. For documents uploaded before content extraction was enabled, a "No text content available" notice is shown. Use the Download button to view the original file, or re-upload the document.

### Cannot see documents from my organization

Verify you are in the correct organization in your profile. Regular Users can only see their own documents. Admins and above see all org documents.

### Upload fails

Check the file size (max 50 MB) and format. Supported: PDF, DOCX, DOC, TXT, CSV, MD, HTML, JSON, XLSX, PPTX, RTF, ODT. Clear your browser cache and try again.

### Password-protected document will not open

Enter the correct 9-digit numeric code. If forgotten, ask the document creator. God-role users can access protected documents without a password.

### God documents not appearing in organizations

When God creates a document, it starts as Draft by default. Change the status to Published. When God updates the status, all copies across organizations are updated together.

### Cannot comment on a document

The document's access level may be set to View Only. View Only documents hide the comment button entirely. Ask the document owner to change the access level to Comment or higher.

### Cannot delete a document

You can only delete documents from users you outrank. Admins can delete User docs. Super Admins can delete User and Admin docs. God can delete any public document. You can always delete your own documents.

### Document shows "No content" for a Word file

The document may have been uploaded before automatic content extraction was added. Download the original file using the Download button.

## AI Issues

### No API key configured

Go to Profile then AI API Keys, select a provider, and paste your key. Groq offers a free tier.

### AI response is slow

Groq is the fastest provider. Long documents take more time. The provider may be under load so try again later.

### AI quality is poor

Try OpenAI GPT-4o for best results. Use specific questions with the Q&A action. Ensure the document has enough text content.

### Rate limit exceeded

Wait a few minutes and try again. Consider upgrading your provider plan or switching providers.

### Local tools not working

Word Count, Structure, and Preview tools require the document to have text content. These tools do not require any API key.

## User Management Issues

### Cannot change a user role

Only Super Admins can promote users (up to Admin). Only God users can assign any role.

### User not appearing in my organization

The user may be in a different organization. Use the organization filter in the Users or God Panel page.

## Still Stuck?

Check the FAQ page, contact your organization Admin or God user, or review the Roles documentation to understand your permissions.
