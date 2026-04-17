"use client"

import { usePathname } from "next/navigation"
import Navbar from "@/components/navbar"

/**
 * Routes that render their own chrome (header + footer) and therefore
 * should NOT get the global `<Navbar />` or global `<footer>` from the
 * root layout. Kept as a prefix list so nested routes (eg. an
 * `/login/…` variant) are covered automatically.
 */
const BARE_CHROME_PREFIXES = [
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
]

function isBareChrome(pathname: string | null) {
  if (!pathname) return false
  return BARE_CHROME_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  )
}

export function AppNavbar() {
  const pathname = usePathname()
  if (isBareChrome(pathname)) return null
  return <Navbar />
}

export function AppFooter() {
  const pathname = usePathname()
  if (isBareChrome(pathname)) return null
  return (
    <footer className="border-t py-6">
      <div className="container mx-auto text-center text-xs text-muted-foreground px-4">
        <p>
          R&apos;s DocManager &copy; {new Date().getFullYear()} &middot; Built
          by{" "}
          <a
            href="https://www.rohansrma.vercel.app"
            target="_blank"
            rel="noopener noreferrer"
          >
            <u>Rohan Sharma</u>
          </a>{" "}
          in hope of love
        </p>
      </div>
    </footer>
  )
}
