import { NextResponse, NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const token = request.cookies.get("accessToken");
  console.log(
    "Middleware - Checking token for",
    request.nextUrl.pathname,
    "Token:",
    token
  );
  if (!token && request.nextUrl.pathname.startsWith("/dashboard")) {
    console.log("Middleware - No token, redirecting to /");
    return NextResponse.redirect(new URL("/", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
