import { NextRequest, NextResponse } from "next/server";

const PUBLIC_ROUTES = ["/login", "/signup"];

export function middleware(req: NextRequest) {
  const token = req.cookies.get("token")?.value;
  const path  = req.nextUrl.pathname;

  const isPublic = PUBLIC_ROUTES.some((r) => path.startsWith(r));

  if (!token && !isPublic) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  if (token && isPublic) {
    return NextResponse.redirect(new URL("/books", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next|favicon.ico|api|fonts|images).*)"],
};