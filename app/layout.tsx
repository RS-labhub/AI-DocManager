import type React from "react"
import type { Metadata } from "next"
import { Inter, JetBrains_Mono } from "next/font/google"
import "./globals.css"
import { Toaster } from "@/components/ui/toaster"
import { ThemeProvider } from "@/components/theme-provider"
import { AppNavbar, AppFooter } from "@/components/app-chrome"
import { AuthProvider } from "@/lib/auth-context"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
})

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || ""

export const metadata: Metadata = {
  title: {
    default: "R's DocManager — Intelligent Document Management",
    template: "%s | R's DocManager",
  },
  description:
    "Enterprise-grade AI document management with encrypted API keys, multi-org support, 4-tier RBAC, and fine-grained access control. Built by Rohan Sharma.",
  keywords: [
    "document management",
    "AI documents",
    "RBAC",
    "multi-organization",
    "encrypted API keys",
    "Groq",
    "OpenAI",
    "Anthropic",
    "Next.js",
    "Supabase",
  ],
  authors: [{ name: "Rohan Sharma", url: "https://www.rohansrma.vercel.app" }],
  creator: "Rohan Sharma",
  ...(siteUrl ? { metadataBase: new URL(siteUrl) } : {}),
  openGraph: {
    type: "website",
    locale: "en_US",
    ...(siteUrl ? { url: siteUrl } : {}),
    siteName: "rs-docmanager",
    title: "Radhika's DocManager — Intelligent Document Management System",
    description:
      "Enterprise-grade AI document management with encrypted API keys, multi-org support, 4-tier RBAC, and fine-grained access control.",
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: "Radhika's DocManager — Intelligent Document Management System",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Radhika's DocManager — Intelligent Document Management System",
    description:
      "AI document management with encrypted API keys, multi-org support, and 4-tier RBAC.",
    images: ["/og.png"],
    creator: "@rohansrma",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/favicon.ico",
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${jetbrainsMono.variable} font-sans`}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
          <AuthProvider>
            <div className="min-h-screen flex flex-col">
              <AppNavbar />
              <main className="flex-1">{children}</main>
              <AppFooter />
            </div>
            <Toaster />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
