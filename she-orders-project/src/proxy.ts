import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { APP_UNLOCK_COOKIE } from "@/lib/constants";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isPublicPath = pathname.startsWith("/unlock") || pathname.startsWith("/api/unlock") || pathname.startsWith("/_next") || pathname === "/favicon.ico";

  if (isPublicPath) return NextResponse.next();

  const isUnlocked = request.cookies.get(APP_UNLOCK_COOKIE)?.value === "yes";
  if (isUnlocked) return NextResponse.next();

  if (pathname.startsWith("/api")) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.redirect(new URL("/unlock", request.url));
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
