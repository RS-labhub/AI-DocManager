import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Shield, Bot, Lock, FileText, Users, CheckCircle } from "lucide-react"

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center space-y-12 py-12">
      {/* Hero Section */}
      <div className="text-center space-y-4 max-w-4xl px-4">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight dark:bg-gradient-to-r dark:from-blue-200 dark:via-white dark:to-purple-200 dark:bg-clip-text dark:text-transparent">
          Secure Document Management with AI Access Control
        </h1>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          A comprehensive document management system with fine-grained authorization for both users and AI agents
          powered by Permit.io
        </p>
        <div className="flex gap-4 justify-center mt-8">
          <Button asChild size="lg" className="dark:bg-primary dark:hover:bg-primary/90 transition-all">
            <Link href="/documents">View Documents</Link>
          </Button>
          <Button
            asChild
            variant="outline"
            size="lg"
            className="dark:border-primary/30 dark:hover:border-primary/70 dark:hover:bg-primary/10 transition-all"
          >
            <Link href="/login">Login</Link>
          </Button>
        </div>
      </div>

      {/* Feature Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl w-full px-4">
        <div className="bg-card border rounded-lg p-6 space-y-4 dark:border-primary/10 dark:hover:border-primary/30 transition-all animate-hover">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-primary/10 dark:bg-primary/20">
              <Shield className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-2xl font-bold">Role-Based Access Control</h2>
          </div>
          <p className="text-muted-foreground">
            Different roles (Admin, Editor, Viewer) have different permissions on documents.
          </p>
          <ul className="list-disc list-inside space-y-1 text-muted-foreground">
            <li>Admins can create, view, edit, and delete any document</li>
            <li>Editors can create, view, and edit documents</li>
            <li>Viewers can only view documents</li>
          </ul>
        </div>

        <div className="bg-card border rounded-lg p-6 space-y-4 dark:border-primary/10 dark:hover:border-primary/30 transition-all animate-hover">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-primary/10 dark:bg-primary/20">
              <Lock className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-2xl font-bold">Attribute-Based Access</h2>
          </div>
          <p className="text-muted-foreground">Access is determined by document attributes and user context.</p>
          <ul className="list-disc list-inside space-y-1 text-muted-foreground">
            <li>Document owners have full control over their documents</li>
            <li>Public documents can be viewed by anyone</li>
            <li>Private documents are only accessible to specific users</li>
          </ul>
        </div>

        <div className="bg-card border rounded-lg p-6 space-y-4 dark:border-primary/10 dark:hover:border-primary/30 transition-all animate-hover">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-primary/10 dark:bg-primary/20">
              <Bot className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-2xl font-bold">AI Agent Authorization</h2>
          </div>
          <p className="text-muted-foreground">Fine-grained control over what AI agents can access and modify.</p>
          <ul className="list-disc list-inside space-y-1 text-muted-foreground">
            <li>Define AI agent roles with specific capabilities</li>
            <li>Control which documents AI can access</li>
            <li>Set permission levels from read-only to full access</li>
          </ul>
        </div>

        <div className="bg-card border rounded-lg p-6 space-y-4 dark:border-primary/10 dark:hover:border-primary/30 transition-all animate-hover">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-primary/10 dark:bg-primary/20">
              <CheckCircle className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-2xl font-bold">AI Action Approvals</h2>
          </div>
          <p className="text-muted-foreground">Human oversight for AI actions with approval workflows.</p>
          <ul className="list-disc list-inside space-y-1 text-muted-foreground">
            <li>Require human approval for sensitive AI operations</li>
            <li>Review and approve/reject AI-suggested changes</li>
            <li>Maintain audit trail of all AI actions</li>
          </ul>
        </div>

        <div className="bg-card border rounded-lg p-6 space-y-4 dark:border-primary/10 dark:hover:border-primary/30 transition-all animate-hover">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-primary/10 dark:bg-primary/20">
              <FileText className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-2xl font-bold">Document Intelligence</h2>
          </div>
          <p className="text-muted-foreground">AI-powered document analysis and enhancement.</p>
          <ul className="list-disc list-inside space-y-1 text-muted-foreground">
            <li>Analyze document content and structure</li>
            <li>Generate summaries of documents</li>
            <li>Suggest improvements to document content</li>
          </ul>
        </div>

        <div className="bg-card border rounded-lg p-6 space-y-4 dark:border-primary/10 dark:hover:border-primary/30 transition-all animate-hover">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-primary/10 dark:bg-primary/20">
              <Users className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-2xl font-bold">Comprehensive Admin Panel</h2>
          </div>
          <p className="text-muted-foreground">Complete control over users, AI agents, and permissions.</p>
          <ul className="list-disc list-inside space-y-1 text-muted-foreground">
            <li>Manage AI agents and their capabilities</li>
            <li>Configure AI permission settings</li>
            <li>Review and approve AI action requests</li>
          </ul>
        </div>
      </div>

      {/* AI Authorization Showcase */}
      <div className="w-full max-w-6xl px-4 py-8">
        <div className="bg-card border rounded-lg p-8 dark:border-primary/10 dark:bg-gradient-subtle">
          <h2 className="text-3xl font-bold mb-6 text-center dark:bg-gradient-to-r dark:from-blue-200 dark:to-purple-200 dark:bg-clip-text dark:text-transparent">
            AI Authorization with Permit.io
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h3 className="text-xl font-semibold">How It Works</h3>
              <p className="text-muted-foreground">
                Our system uses Permit.io to implement fine-grained authorization for AI agents, ensuring they only have
                access to the resources and actions they need.
              </p>

              <div className="space-y-2 mt-6">
                <div className="flex items-start gap-2">
                  <div className="bg-primary/10 dark:bg-primary/20 p-2 rounded-full mt-1">
                    <Shield className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-medium">Define AI Agent Roles</h4>
                    <p className="text-sm text-muted-foreground">
                      Create AI agents with specific roles and capabilities
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <div className="bg-primary/10 dark:bg-primary/20 p-2 rounded-full mt-1">
                    <Lock className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-medium">Set Permission Levels</h4>
                    <p className="text-sm text-muted-foreground">Configure what each AI agent can access and modify</p>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <div className="bg-primary/10 dark:bg-primary/20 p-2 rounded-full mt-1">
                    <CheckCircle className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-medium">Approval Workflows</h4>
                    <p className="text-sm text-muted-foreground">Require human approval for sensitive AI operations</p>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <div className="bg-primary/10 dark:bg-primary/20 p-2 rounded-full mt-1">
                    <FileText className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-medium">Audit and Monitoring</h4>
                    <p className="text-sm text-muted-foreground">Track all AI actions and approvals</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-muted p-6 rounded-lg border border-border dark:border-primary/20 dark:bg-secondary/50 backdrop-blur-sm">
              <h3 className="text-xl font-semibold mb-4">Permission Levels</h3>

              <div className="space-y-4">
                <div className="p-3 bg-background rounded-md border dark:border-primary/10 dark:bg-card/80 transition-all hover:shadow-md dark:hover:shadow-primary/5">
                  <div className="flex justify-between items-center">
                    <h4 className="font-medium">No Access</h4>
                    <div className="px-2 py-1 bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 text-xs rounded-full">
                      Blocked
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">AI agent cannot access the resource at all</p>
                </div>

                <div className="p-3 bg-background rounded-md border dark:border-primary/10 dark:bg-card/80 transition-all hover:shadow-md dark:hover:shadow-primary/5">
                  <div className="flex justify-between items-center">
                    <h4 className="font-medium">Read Only</h4>
                    <div className="px-2 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 text-xs rounded-full">
                      Limited
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">AI agent can only read but not modify resources</p>
                </div>

                <div className="p-3 bg-background rounded-md border dark:border-primary/10 dark:bg-card/80 transition-all hover:shadow-md dark:hover:shadow-primary/5">
                  <div className="flex justify-between items-center">
                    <h4 className="font-medium">Suggest Only</h4>
                    <div className="px-2 py-1 bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300 text-xs rounded-full">
                      Supervised
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    AI can suggest changes that require human approval
                  </p>
                </div>

                <div className="p-3 bg-background rounded-md border dark:border-primary/10 dark:bg-card/80 transition-all hover:shadow-md dark:hover:shadow-primary/5">
                  <div className="flex justify-between items-center">
                    <h4 className="font-medium">Full Access</h4>
                    <div className="px-2 py-1 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 text-xs rounded-full">
                      Autonomous
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">AI has full access to read and modify resources</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 text-center">
            <Button
              asChild
              size="lg"
              className="dark:bg-primary/90 dark:hover:bg-primary transition-all dark:shadow-lg dark:shadow-primary/20"
            >
              <Link href="/admin/ai-permissions">Explore AI Permissions</Link>
            </Button>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="w-full max-w-4xl px-4 py-8 text-center">
        <h2 className="text-3xl font-bold mb-4 dark:bg-gradient-to-r dark:from-blue-200 dark:to-purple-200 dark:bg-clip-text dark:text-transparent">
          Ready to get started?
        </h2>
        <p className="text-xl text-muted-foreground mb-8">
          Experience secure document management with fine-grained AI authorization
        </p>
        <div className="flex gap-4 justify-center">
          <Button
            asChild
            size="lg"
            className="dark:bg-primary dark:hover:bg-primary/90 transition-all dark:shadow-lg dark:shadow-primary/20"
          >
            <Link href="/documents">View Documents</Link>
          </Button>
          <Button
            asChild
            variant="outline"
            size="lg"
            className="dark:border-primary/30 dark:hover:border-primary/70 dark:hover:bg-primary/10 transition-all"
          >
            <Link href="/login">Login</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
