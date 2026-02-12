import type React from "react"
import { Inter } from "next/font/google"
import "./globals.css"
import { Toaster } from "@/components/ui/toaster"
import { ThemeProvider } from "@/components/theme-provider"
import Navbar from "@/components/navbar"
import { AuthProvider } from "@/lib/auth-context"

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "Document Management System",
  description: "A document management system with fine-grained authorization using Permit.io",
  icons: {
    icon: "/favicon.png",
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <AuthProvider>
            <div className="min-h-screen flex flex-col">
              <header className="border-b dark:border-header/20 bg-header dark:bg-header text-header-foreground dark:text-header-foreground shadow-sm dark:shadow-md dark:shadow-black/10">
                <Navbar />
              </header>
              <main className="flex-1 container mx-auto py-6 px-4 bg-body dark:bg-body">{children}</main>
              <footer className="border-t dark:border-footer/20 py-4 bg-footer dark:bg-footer text-footer-foreground dark:text-footer-foreground">
                <div className="container mx-auto text-center text-sm text-muted-foreground">
                  Document Management System with Permit.io Authorization © {new Date().getFullYear()}
                </div>
              </footer>
            </div>
            <Toaster />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
