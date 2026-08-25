import { NextResponse, type NextRequest } from "next/server";

/**
 * Two jobs:
 *  1. Send bare paths to the Arabic site — Arabic is the primary language.
 *  2. Gate the admin area. This is a cheap presence check; the signature is
 *     verified for real in `requireAdmin()` on every admin page and action,
 *     so a forged cookie gets past the door and no further.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (request.nextUrl.hostname === "www.imranalasr.sa") {
    const url = request.nextUrl.clone();
    url.protocol = "https";
    url.hostname = "imranalasr.sa";
    return NextResponse.redirect(url, 308);
  }

  if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
    const hasSession = request.cookies.has("imran_admin");
    if (!hasSession) {
      const url = request.nextUrl.clone();
      url.pathname = "/admin/login";
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  if (
    pathname === "/" ||
    (!pathname.startsWith("/ar") &&
      !pathname.startsWith("/en") &&
      !pathname.startsWith("/admin") &&
      !pathname.startsWith("/api") &&
      !pathname.includes("."))
  ) {
    const url = request.nextUrl.clone();
    url.pathname = `/ar${pathname === "/" ? "" : pathname}`;
    return NextResponse.redirect(url, 308);
  }

  return NextResponse.next();
}

export const config = {
  // Skip Next internals and anything with a file extension (public assets:
  // /brand/*.png, /projects/**/*.webp, /og.png, /robots.txt, /sitemap.xml …).
  matcher: ["/((?!_next/static|_next/image|.*\\..*).*)", "/robots.txt", "/sitemap.xml"],
};
