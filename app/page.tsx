import { Button } from "@/components/ui/button"
import Link from "next/link"
import Image from "next/image"
import {
  Shield,
  Bot,
  Lock,
  FileText,
  Building2,
  ArrowRight,
  Key,
  Users,
  Crown,
  Sparkles,
  Zap,
  Eye,
  CheckCircle2,
  Mail,
  ShieldCheck,
} from "lucide-react"
import { Analytics } from "@vercel/analytics/react"

const FEATURES = [
  {
    icon: FileText,
    title: "Smart Documents",
    desc: "Upload PDF, DOCX, TXT, CSV with automatic content extraction. Write rich content with the built-in markdown editor.",
  },
  {
    icon: Bot,
    title: "AI-Powered Actions",
    desc: "Summarize, analyze sentiment, extract key points, improve writing, translate, and generate Q&A from any document.",
  },
  {
    icon: Lock,
    title: "Encrypted API Keys",
    desc: "AES-256-GCM encryption for all API keys. Unique IV and auth tag per key. Your keys are never exposed.",
  },
  {
    icon: Building2,
    title: "Multi-Organization",
    desc: "Complete data isolation between organizations. Cross-org capabilities for elevated roles.",
  },
  {
    icon: Shield,
    title: "4-Tier RBAC",
    desc: "User, Admin, Super Admin, and God roles with granular permission control at every level.",
  },
  {
    icon: Key,
    title: "Bring Your Own Keys",
    desc: "No vendor lock-in. Use free-tier Groq, paid OpenAI, or Anthropic. Switch providers anytime.",
  },
]

const ROLES = [
  {
    role: "God",
    level: "100",
    icon: Crown,
    color: "bg-stone-900 dark:bg-stone-100",
    textColor: "text-stone-100 dark:text-stone-900",
    perms: ["Full platform control", "All organizations", "Bypass passwords", "Assign any role"],
  },
  {
    role: "Super Admin",
    level: "75",
    icon: Shield,
    color: "bg-stone-700 dark:bg-stone-300",
    textColor: "text-stone-100 dark:text-stone-900",
    perms: ["Cross-org access", "Promote to admin", "Export data", "Audit logs"],
  },
  {
    role: "Admin",
    level: "50",
    icon: Users,
    color: "bg-stone-500 dark:bg-stone-400",
    textColor: "text-white dark:text-stone-900",
    perms: ["Org management", "All org documents", "User management", "Org statistics"],
  },
  {
    role: "User",
    level: "10",
    icon: FileText,
    color: "bg-stone-200 dark:bg-stone-600",
    textColor: "text-stone-700 dark:text-stone-100",
    perms: ["Own documents", "AI actions", "Personal API keys", "Profile settings"],
  },
]

const HIGHLIGHTS = [
  { icon: Zap, text: "Groq, OpenAI, Anthropic" },
  { icon: Lock, text: "AES-256-GCM" },
  { icon: Building2, text: "Multi-Org" },
  { icon: Shield, text: "4-Tier RBAC" },
  { icon: Eye, text: "Permit.io ABAC" },
  { icon: Sparkles, text: "AI-Powered" },
]

export default function Home() {
  return (
    <>
      <div className="relative">
        {/* Hero */}
        <section className="relative py-20 md:py-32 lg:py-40 overflow-hidden">
          <div className="absolute inset-0 grid-bg opacity-40" />
          <div className="absolute inset-0 bg-gradient-to-b from-background via-background/95 to-background" />

          <div className="container mx-auto px-4 flex flex-col items-center text-center max-w-4xl relative z-10">
            {/* <div className="mb-6 animate-fade-in">
            <Image
              src="/logo.png"
              alt="Radhika's DocManager"
              width={200}
              height={200}
              className="h-10 w-auto object-contain mx-auto"
              priority
            />
          </div> */}

            <div className="inline-flex items-center gap-1.5 rounded-full border bg-card/50 backdrop-blur px-3 py-1.5 text-xs text-muted-foreground mb-6 animate-fade-in">
              <span className="relative flex h-2 w-2 shrink-0">
                <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
              <span className="sm:hidden">Radhika's Document Manager</span>
              <span className="hidden sm:inline">Radhika&apos;s DocManager &mdash; Enterprise AI Document Management</span>
            </div>

            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tighter leading-[1.05] animate-fade-in">
              <span className="bg-gradient-to-br from-foreground via-foreground/90 to-foreground/70 bg-clip-text">
                Intelligent documents.
              </span>
              <br />
              <span className="bg-gradient-to-br from-foreground/80 to-foreground/50 bg-clip-text text-transparent">
                Secure by design.
              </span>
            </h1>

            <p className="mt-5 text-sm md:text-base text-muted-foreground max-w-lg leading-relaxed animate-fade-in-up">
              AI-powered document management with encrypted API keys, multi-organization support, and fine-grained access control. Built for teams that take security seriously.
            </p>

            <div className="flex gap-3 mt-8 animate-fade-in-up">
              <Button asChild size="lg" className="h-10 px-6 gap-2 text-sm font-medium">
                <Link href="/register">
                  Get Started <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="h-10 px-6 text-sm">
                <Link href="/login">Sign In</Link>
              </Button>
            </div>

            <div className="flex flex-wrap justify-center gap-x-5 gap-y-2 mt-12 animate-fade-in-up">
              {HIGHLIGHTS.map((item) => (
                <span key={item.text} className="flex items-center gap-1.5 text-[11px] text-muted-foreground/70">
                  <item.icon className="h-3 w-3" />
                  {item.text}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="py-16 md:py-24 border-t">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12 max-w-md mx-auto">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.2em] mb-2">Features</p>
              <h2 className="text-xl md:text-3xl font-bold tracking-tight">Everything you need</h2>
              <p className="mt-2 text-muted-foreground text-sm">A complete platform for secure document management with built-in AI.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-border rounded-xl overflow-hidden max-w-4xl mx-auto border">
              {FEATURES.map((f, i) => (
                <div key={i} className="bg-card p-6 group hover:bg-accent/30 transition-colors">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted mb-3 group-hover:bg-foreground/10 transition-colors">
                    <f.icon className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <h3 className="font-semibold text-sm mb-1.5">{f.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="py-16 md:py-24 border-t">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12 max-w-md mx-auto">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.2em] mb-2">How it works</p>
              <h2 className="text-xl md:text-3xl font-bold tracking-tight">Three steps to get started</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
              {[
                { step: "01", title: "Create & upload", desc: "Sign up, create your organization, and upload documents or write them with the markdown editor.", icon: FileText },
                { step: "02", title: "Add your AI key", desc: "Configure your Groq, OpenAI, or Anthropic API key. Encrypted with AES-256-GCM before storage.", icon: Key },
                { step: "03", title: "Analyze & collaborate", desc: "Run AI actions on your documents. Summarize, analyze, translate, and more. Invite your team.", icon: Sparkles },
              ].map((s) => (
                <div key={s.step} className="border rounded-xl p-5 bg-card">
                  <span className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-wider">Step {s.step}</span>
                  <div className="flex items-center gap-2 mt-2 mb-2">
                    <s.icon className="h-4 w-4 text-muted-foreground" />
                    <h3 className="font-semibold text-sm">{s.title}</h3>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Role Hierarchy */}
        <section className="py-16 md:py-24 border-t">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12 max-w-md mx-auto">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.2em] mb-2">Access Control</p>
              <h2 className="text-xl md:text-3xl font-bold tracking-tight">Role hierarchy</h2>
              <p className="mt-2 text-muted-foreground text-sm">Four tiers of access control for complete platform governance.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 max-w-4xl mx-auto">
              {ROLES.map((tier, i) => (
                <div key={i} className="border rounded-xl p-5 bg-card hover:shadow-sm transition-shadow">
                  <div className="flex items-center gap-2.5 mb-3">
                    <div className={`flex h-7 w-7 items-center justify-center rounded-lg ${tier.color}`}>
                      <tier.icon className={`h-3.5 w-3.5 ${tier.textColor}`} />
                    </div>
                    <div>
                      <p className="font-semibold text-sm leading-tight">{tier.role}</p>
                      <p className="text-[10px] text-muted-foreground">Level {tier.level}</p>
                    </div>
                  </div>
                  <ul className="space-y-1.5">
                    {tier.perms.map((p, j) => (
                      <li key={j} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <CheckCircle2 className="h-3 w-3 text-muted-foreground/50 shrink-0" />
                        {p}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Request Super Admin Access */}
        <section className="py-16 md:py-24 border-t">
          <div className="container mx-auto px-4">
            <div className="rounded-xl border bg-card/50 backdrop-blur p-8 md:p-12 max-w-2xl mx-auto relative overflow-hidden">
              <div className="absolute inset-0 dot-bg opacity-20" />
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-stone-900 dark:bg-stone-100">
                    <ShieldCheck className="h-5 w-5 text-stone-100 dark:text-stone-900" />
                  </div>
                  <div>
                    <h2 className="text-lg md:text-2xl font-bold tracking-tight">Need Super Admin Access?</h2>
                    <p className="text-xs text-muted-foreground">Elevated privileges for platform management</p>
                  </div>
                </div>

                <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                  Super Admin access grants cross-organization capabilities, user approval authority, and advanced platform management features.
                  To request Super Admin privileges, please reach out to the developer directly.
                </p>

                <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
                  <div className="flex items-start gap-3">
                    <Mail className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-medium">Contact the Developer</p>
                      <a
                        href="mailto:rs4101976@gmail.com?subject=Super%20Admin%20Access%20Request%20-%20AI%20DocManager"
                        className="text-sm text-primary hover:underline"
                      >
                        rs4101976@gmail.com
                      </a>
                    </div>
                  </div>
                  <div className="border-t pt-3">
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Please include your registered email address, organization name, and a brief reason for requesting elevated access.
                      Requests are typically reviewed within 24–48 hours.
                    </p>
                  </div>
                </div>

                <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2">
                  {[
                    "Approve new members",
                    "Cross-org access",
                    "Promote to admin",
                    "Export & audit logs",
                  ].map((perk) => (
                    <span key={perk} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <CheckCircle2 className="h-3 w-3 text-muted-foreground/50 shrink-0" />
                      {perk}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 md:py-24 border-t">
          <div className="container mx-auto px-4">
            <div className="rounded-xl border bg-card/50 backdrop-blur p-10 md:p-14 text-center max-w-xl mx-auto relative overflow-hidden">
              <div className="absolute inset-0 dot-bg opacity-30" />
              <div className="relative z-10">
                <h2 className="text-lg md:text-2xl font-bold tracking-tight">Ready to get started?</h2>
                <p className="mt-2 text-muted-foreground text-sm max-w-sm mx-auto">Create your account, join an organization, and start managing documents with AI.</p>
                <div className="flex gap-3 justify-center mt-6">
                  <Button asChild size="lg" className="h-10 px-6 gap-2 text-sm font-medium">
                    <Link href="/register">
                      Create Account <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </Button>
                  <Button asChild variant="outline" size="lg" className="h-10 px-6 text-sm">
                    <Link href="/login">Sign In</Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
      <Analytics />
    </>
  )
}
