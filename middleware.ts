import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// Paths that require authentication
const PROTECTED_PATHS = [
  "/dashboard",
  "/profile",
  "/settings",
  "/messages",
  "/announcements",
  "/calendar",
  "/notifications",
]

// Paths that are accessible only to non-authenticated users
const AUTH_PATHS = ["/login", "/signup", "/forgot-password", "/reset-password", "/verify-otp"]

// Update the middleware function to check both cookies and request headers
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Check for token in cookies or Authorization header
  const token =
    request.cookies.get("token")?.value || request.headers.get("Authorization")?.replace("Bearer ", "") || ""

  // Check if the path is protected and requires authentication
  const isProtectedPath = PROTECTED_PATHS.some((path) => pathname.startsWith(path))

  // Check if the path is for non-authenticated users only
  const isAuthPath = AUTH_PATHS.some((path) => pathname.startsWith(path))

  // If the path is protected and the user is not authenticated, redirect to login
  if (isProtectedPath && !token) {
    const url = new URL("/login", request.url)
    url.searchParams.set("callbackUrl", encodeURI(pathname))
    return NextResponse.redirect(url)
  }

  // If the path is for non-authenticated users and the user is authenticated, redirect to dashboard
  if (isAuthPath && token) {
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.jpg$|.*\\.svg$).*)",
  ],
}

