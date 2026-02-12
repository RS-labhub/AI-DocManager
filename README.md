![icon](public/logo.png)

# Document Management System with Fine-Grained AI Authorization

This project demonstrates how to implement fine-grained authorization for both users and AI agents in a Next.js application using Permit.io. It's a document management system where users can create, view, edit, and delete documents based on their roles and document ownership, and AI agents can assist with document management based on their assigned permissions.

## Features

### User Authorization
- **Role-Based Access Control (RBAC)**: Different roles (Admin, Editor, Viewer) have different permissions
- **Attribute-Based Access Control (ABAC)**: Document owners have special privileges
- **Fine-Grained Authorization**: Using Permit.io to implement complex authorization rules

### AI Authorization
- **AI Agent Roles**: Define different AI agent roles with specific capabilities
- **Permission Levels**: Configure what AI agents can access and modify
  - **No Access**: AI agent cannot access the resource at all
  - **Read Only**: AI agent can only read but not modify resources
  - **Suggest Only**: AI can suggest changes that require human approval
  - **Full Access**: AI has full access to read and modify resources
- **Approval Workflows**: Require human approval for sensitive AI operations
- **Audit and Monitoring**: Track all AI actions and approvals

### Document Intelligence
- **Document Analysis**: AI-powered analysis of document content and structure
- **Document Summarization**: Generate concise summaries of documents
- **Content Improvement**: AI suggestions for improving document content

### Technical Features
- **Next.js App Router**: Modern React application with server components and server actions
- **Responsive UI**: Using Tailwind CSS and shadcn/ui components
- **Dark Mode**: Customizable dark mode with tailored color scheme

&nbsp;

## Authorization Model

### User Authorization

The application implements the following user authorization model:

- **Admin**: Can create, view, edit, and delete any document, and access the admin panel
- **Editor**: Can create, view, and edit documents, but can only delete their own documents
- **Viewer**: Can only view documents

Additionally, document owners have full control over their own documents regardless of their role.

### AI Authorization

The application implements the following AI authorization model:

- **AI Agent Roles**:
  - **Assistant**: Helps with document organization and basic tasks
  - **Editor**: Can edit and improve document content
  - **Analyzer**: Analyzes document content and provides insights

- **AI Capabilities**:
  - **read_documents**: Ability to read document content
  - **suggest_edits**: Ability to suggest edits to documents
  - **edit_documents**: Ability to directly edit documents
  - **create_documents**: Ability to create new documents
  - **delete_documents**: Ability to delete documents
  - **analyze_content**: Ability to analyze document content
  - **summarize_content**: Ability to summarize documents
  - **translate_content**: Ability to translate documents
  - **generate_content**: Ability to generate new content

- **Permission Levels**:
  - **NO_ACCESS**: AI agent cannot access the resource at all
  - **READ_ONLY**: AI agent can only read but not modify resources
  - **SUGGEST_ONLY**: AI can suggest changes that require human approval
  - **FULL_ACCESS**: AI has full access to read and modify resources

&nbsp;

## Getting Started

### Prerequisites

- Node.js 18+
- Permit.io account (https://app.permit.io)
- Groq API key (https://console.groq.com)

### Installation

1. Clone the repository
   ```bash
   git clone https://github.com/RS-labhub/ai-document-management-system.git
   cd document-management-system
   ```

2. Install dependencies:
   ```bash
   npm install
   ```
   or
   ```bash
    yarn install
    ```
    or
    ```bash
    bun install
    ```

3. Set up environment variables:
   ```
   PERMIT_PDP_URL=your-permit-pdp-url
   PERMIT_SDK_TOKEN=your-permit-sdk-token
   GROQ_API_KEY=your-groq-api-key
   ```

### Running the Application

```bash
npm run dev
```

The application will be available at http://localhost:3000.

### Test Credentials

- Admin:
  - Username: admin
  - Password: 2025DEVChallenge
- Editor:
  - Username: newuser
  - Password: 2025DEVChallenge
- Viewer:
  - Username: viewer
  - Password: 2025DEVChallenge

&nbsp;

## Setting Up Permit.io for AI Authorization

### 1. Install the Permit CLI

```bash
npm install -g @permitio/permit-cli
```

### 2. Login to Permit.io

```bash
permit login
```

### 3. Initialize a New Project

```bash
permit init
```

### 4. Define Your Resources

```bash
permit resource create document
permit resource create admin_panel
permit resource create ai_agent
permit resource create ai_action
```

### 5. Define Actions

```bash
# Document actions
permit action create create --resource document
permit action create read --resource document
permit action create update --resource document
permit action create delete --resource document

# Admin panel actions
permit action create access --resource admin_panel

# AI agent actions
permit action create manage --resource ai_agent

# AI action actions
permit action create approve --resource ai_action
permit action create reject --resource ai_action
```

### 6. Define Roles

```bash
# User roles
permit role create admin
permit role create editor
permit role create viewer

# AI roles
permit role create ai_assistant
permit role create ai_editor
permit role create ai_analyzer
```

### 7. Define Permissions for Users

```bash
# Admin permissions
permit permission create --role admin --action create --resource document
permit permission create --role admin --action read --resource document
permit permission create --role admin --action update --resource document
permit permission create --role admin --action delete --resource document
permit permission create --role admin --action access --resource admin_panel
permit permission create --role admin --action manage --resource ai_agent
permit permission create --role admin --action approve --resource ai_action
permit permission create --role admin --action reject --resource ai_action

# Editor permissions
permit permission create --role editor --action create --resource document
permit permission create --role editor --action read --resource document
permit permission create --role editor --action update --resource document
permit permission create --role editor --action approve --resource ai_action
permit permission create --role editor --action reject --resource ai_action

# Viewer permissions
permit permission create --role viewer --action read --resource document
```

### 8. Define AI Agent Capabilities

```bash
# AI Assistant capabilities
permit permission create --role ai_assistant --action read --resource document
permit permission create --role ai_assistant --action summarize --resource document

# AI Editor capabilities
permit permission create --role ai_editor --action read --resource document
permit permission create --role ai_editor --action suggest_edit --resource document
permit permission create --role ai_editor --action generate_content --resource document

# AI Analyzer capabilities
permit permission create --role ai_analyzer --action read --resource document
permit permission create --role ai_analyzer --action analyze --resource document
```

### 9. Define Resource Attributes

```bash
permit resource-attribute create ownerId --resource document --type string
permit resource-attribute create isPublic --resource document --type boolean
permit resource-attribute create permissionLevel --resource document --type string
permit resource-attribute create requiresApproval --resource document --type boolean
```

### 10. Define Condition Sets for AI Permissions

```bash
# Define condition sets for different AI permission levels
permit condition-set create ai-no-access --resource document --conditions "resource.permissionLevel == 'no_access'"
permit condition-set create ai-read-only --resource document --conditions "resource.permissionLevel == 'read_only'"
permit condition-set create ai-suggest-only --resource document --conditions "resource.permissionLevel == 'suggest_only'"
permit condition-set create ai-full-access --resource document --conditions "resource.permissionLevel == 'full_access'"

# Apply permissions based on condition sets
permit permission create --condition-set ai-read-only --action read --resource document
permit permission create --condition-set ai-suggest-only --action read --resource document
permit permission create --condition-set ai-suggest-only --action suggest_edit --resource document
permit permission create --condition-set ai-full-access --action read --resource document
permit permission create --condition-set ai-full-access --action update --resource document
```

&nbsp;

## Implementation Details

### AI Authorization Implementation

The application implements AI authorization through several key components:

#### 1. AI Agent Management

The `AIAgent` interface defines the structure of AI agents:

```ts
export interface AIAgent {
  id: string;
  name: string;
  description: string;
  role: AIAgentRole;
  capabilities: AICapability[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
}
```

Administrators can manage AI agents through the admin panel, defining their roles and capabilities.

#### 2. Permission Levels

The `AIPermissionLevel` enum defines the different levels of access that AI agents can have:

```ts
export enum AIPermissionLevel {
  NO_ACCESS = "no_access",
  READ_ONLY = "read_only",
  SUGGEST_ONLY = "suggest_only",
  FULL_ACCESS = "full_access",
}
```

#### 3. AI Actions

The `AIAction` interface defines the structure of actions that AI agents can perform:

```ts
export interface AIAction {
  id: string;
  agentId: string;
  actionType: string;
  resourceType: string;
  resourceId: string;
  status: AIActionStatus;
  requestedAt: string;
  completedAt?: string;
  requestedBy: string;
  approvedBy?: string;
  rejectedBy?: string;
  metadata: Record<string, any>;
  result?: any;
}
```

#### 4. Permission Checking

The `checkAIPermission` function checks if an AI agent has permission to perform an action:

```ts
export function checkAIPermission(
  agentId: string,
  action: string,
  resourceType: string,
  resourceId?: string
): {
  permitted: boolean;
  requiresApproval: boolean;
  permissionLevel: AIPermissionLevel;
} {
  // Implementation details...
}
```

#### 5. Approval Workflow

The application implements an approval workflow for AI actions that require human oversight:

```ts
export async function requestAIAction(
  agentId: string,
  actionType: string,
  resourceType: string,
  resourceId: string,
  documentTitle: string,
  documentContent: string,
  metadata: Record<string, any>
): Promise<{ success: boolean; action?: AIAction; message?: string }> {
  // Implementation details...
}

export async function approveAIAction(
  actionId: string,
  userId: string
): Promise<{ success: boolean; action?: AIAction; message?: string }> {
  // Implementation details...
}

export async function rejectAIAction(
  actionId: string,
  userId: string,
  reason?: string
): Promise<{ success: boolean; action?: AIAction; message?: string }> {
  // Implementation details...
}
```

### Integration with Permit.io

The application integrates with Permit.io through the `permit.ts` file, which provides functions for checking permissions:

```ts
import { Permit } from 'permitio';

// Initialize Permit SDK
const permit = new Permit({
  pdp: process.env.PERMIT_PDP_URL,
  token: process.env.PERMIT_SDK_TOKEN,
});

// Check if a user can perform an action on a resource
export async function checkPermission(
  userId: string,
  action: string,
  resourceType: string,
  resourceAttributes: Record<string, any> = {}
): Promise<boolean> {
  try {
    const permitted = await permit.check(userId, action, {
      type: resourceType,
      ...resourceAttributes,
    });
    return permitted;
  } catch (error) {
    console.error('Permission check failed:', error);
    return false;
  }
}
```

&nbsp;

## Benefits of AI Authorization

1. **Enhanced Security**: Fine-grained control over what AI agents can access and modify
2. **Human Oversight**: Approval workflows for sensitive AI operations
3. **Flexibility**: Different permission levels for different AI agents and resources
4. **Auditability**: Track all AI actions and approvals
5. **Compliance**: Meet regulatory requirements for AI systems

&nbsp;

## Benefits of Externalized Authorization

1. **Separation of Concerns**: Authorization logic is separated from application code
2. **Centralized Policy Management**: All authorization rules are defined in one place
3. **Consistent Enforcement**: Authorization is enforced consistently across the application
4. **Reduced Complexity**: Complex authorization rules are handled by Permit.io
5. **Easier Maintenance**: Changes to authorization rules don't require code changes
6. **Audit Trail**: All authorization decisions can be logged and audited

&nbsp;

## Conclusion

This project demonstrates how to implement fine-grained authorization for both users and AI agents in a Next.js application using Permit.io. By externalizing authorization, we can create more secure, maintainable, and flexible applications that can safely leverage AI capabilities while maintaining appropriate controls.

&nbsp;

## Setup and Contributing Guidelines
    
**Set Up Your Environment**

1. `Fork` our repository to your GitHub account. 
2. `Clone` your fork to your local machine. 
    Use the command `git clone https://github.com/RS-labhub/AI_Document_Management_System.git`.
3. Create a new branch for your work. 
    Use a descriptive name, like `fix-login-bug` or `add-user-profile-page`.
    
**Commit Your Changes**

- Commit your changes with a _clear commit message_. 
  e.g `git commit -m "Fix login bug by updating auth logic"`.

**Submit a Pull Request**

- Push your branch and changes to your fork on GitHub.
- Create a pull request, compare branches and submit.
- Provide a detailed description of what changes you've made and why. 
  Link the pull request to the issue it resolves. 🔗
    
**Review and Merge**

- I will review your pull request and provide feedback or request changes if necessary. 
- Once your pull request is approved, we will merge it into the main codebase 🥳

&nbsp;

## Meet the Author

<img  src="public/author.jpg" alt="Author">


### Contact 
- Email: rs4101976@gmail.com
- Head over to my github handle from [here](https://github.com/RS-labhub)

&nbsp;

<p align="center">
<a href="https://twitter.com/rrs00179" target="blank"><img src="https://img.shields.io/badge/Twitter/X-000000?style=for-the-badge&logo=x&logoColor=white" alt="rrs00179" /></a>
<a href="https://www.linkedin.com/in/rohan-sharma-9386rs/" target="blank"><img src="https://img.shields.io/badge/LinkedIn-0077B5?style=for-the-badge&logo=linkedin&logoColor=white" alt="rohan-sharma=9386" /></a>
</p>

&nbsp;

<p align="center">
   Thank you for visting this Repo <br>If you like it, <a href="https://github.com/RS-labhub/AI_Document_Management_System/stargazers">star</a> ⭐ it
</p>
