import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// This function can be marked `async` if using `await` inside
export function middleware(request: NextRequest) {
  // We'll let client-side auth handle redirects instead of using middleware
  // This avoids issues with localStorage not being available in middleware
  return NextResponse.next()
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: [],
}
