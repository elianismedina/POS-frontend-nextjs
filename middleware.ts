import { NextResponse, NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  // Only apply middleware to dashboard routes
  if (request.nextUrl.pathname.startsWith("/dashboard")) {
    // Let the client-side handle authentication checks
    // The AuthContext will handle redirects if needed
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
