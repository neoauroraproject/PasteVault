import { type NextRequest, NextResponse } from "next/server"

export function middleware(request: NextRequest) {
  // Protect admin routes - check for session cookie
  if (request.nextUrl.pathname.startsWith("/admin")) {
    const sessionCookie = request.cookies.get("cv_session")
    if (!sessionCookie?.value) {
      const url = request.nextUrl.clone()
      url.pathname = "/auth/login"
      return NextResponse.redirect(url)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/admin/:path*"],
}
