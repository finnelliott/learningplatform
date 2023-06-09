// middleware/index.ts
import { NextRequest, NextResponse } from "next/server";
import { authMiddleware } from "@clerk/nextjs";

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};

function rewrites(req: NextRequest) {
  const url = req.nextUrl;
  const hostname = req.headers.get("host") || process.env.DOMAIN || "localhost:3000";
  const path = url.pathname;

  const currentHost = process.env.NODE_ENV === "production" && process.env.VERCEL === "1"
    ? hostname.replace(`.${process.env.DOMAIN}`, "").replace(`.${process.env.VERCEL_TEAM_DOMAIN}`, "")
    : hostname.replace(`.${process.env.DOMAIN}`, "");

  if (path.startsWith("/api")) {
    return NextResponse.next();
  }
  
  if (currentHost === "learn" || currentHost === "create") {
    url.pathname = `/${currentHost}${url.pathname}`;
    return NextResponse.rewrite(url);
  }

  if (hostname === process.env.DOMAIN || hostname === process.env.VERCEL_TEAM_DOMAIN) {
    return NextResponse.rewrite(new URL(`/home${path}`, req.url));
  }

  return NextResponse.rewrite(new URL(`/courses/${currentHost}${path}`, req.url));
}

export default authMiddleware({
  beforeAuth(req) {
    return rewrites(req);
  },
  afterAuth(auth, req, evt) {
    const hostname = req.headers.get("host") || process.env.DOMAIN || "localhost:3000";
    const hostUrl = process.env.NODE_ENV === "production" && process.env.VERCEL === "1"
      ? `https://${hostname}` : `http://${hostname}`;
      
    if (!auth.userId && !auth.isPublicRoute) {
      const signInUrl = new URL('/sign-in', hostUrl);
      return NextResponse.redirect(signInUrl);
    }
  },
  publicRoutes: ["/", "/sign-in", "/learn/sign-in", "/create/sign-in", "/(courses)(.*)"],
});