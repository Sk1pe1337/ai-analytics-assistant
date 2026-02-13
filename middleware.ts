import { NextRequest, NextResponse } from "next/server";

const PUBLIC = ["/", "/login", "/register", "/pricing", "/demo", "/feedback"];

function isPublic(pathname: string) {
  if (PUBLIC.includes(pathname)) return true;
  if (pathname.startsWith("/_next")) return true;
  if (pathname.startsWith("/favicon")) return true;
  if (pathname.startsWith("/public")) return true;
  return false;
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (isPublic(pathname)) return NextResponse.next();

  const token = req.cookies.get("token")?.value;

  // Edge middleware: просто проверяем наличие cookie token
  if (!token) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api).*)"],
};
