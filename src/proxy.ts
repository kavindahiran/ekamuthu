import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";
import { NextResponse } from "next/server";

// Uses the Edge-safe authConfig (no Prisma). Reads the JWT cookie only.
const { auth } = NextAuth(authConfig);

const PROTECTED = ["/host", "/guest", "/admin"];
const ADMIN_ONLY = ["/admin"];

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;

  const isProtected = PROTECTED.some((p) => pathname.startsWith(p));
  if (isProtected && !session) {
    const signIn = new URL("/signin", req.url);
    signIn.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(signIn);
  }

  // Block unverified phone numbers from booking flows
  if (pathname.startsWith("/guest/book") && session && !session.user.phoneVerified) {
    return NextResponse.redirect(new URL("/onboarding/verify-phone", req.url));
  }

  // Block non-admins from admin routes
  if (ADMIN_ONLY.some((p) => pathname.startsWith(p)) && session?.user.role !== "ADMIN") {
    return NextResponse.redirect(new URL("/", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|public/).*)"],
};
