import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    if (!token) {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    // Admin-only routes
    if (
      (path.startsWith("/users") || path.startsWith("/api/users")) &&
      !token?.isAdmin
    ) {
      return NextResponse.redirect(new URL("/", req.url));
    }

    // Category editing routes (strict UI removal check)
    if (
      (path.startsWith("/categories") || path.startsWith("/api/categories")) &&
      !token?.canEditCategories &&
      !token?.isAdmin
    ) {
      // If user can't edit categories, they shouldn't be here.
      // For API, return 403 (handled by next-auth default, but good to be explicit for UI)
      return NextResponse.redirect(new URL("/", req.url));
    }
  },
  {
    callbacks: {
      authorized: () => true,
    },
    pages: {
      signIn: "/login",
    },
  }
);

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - login (login page)
     * - api/auth (auth routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!login|api/auth|_next/static|_next/image|favicon.ico).*)",
  ],
};
