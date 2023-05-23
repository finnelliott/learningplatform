import { NextRequest, NextResponse } from "next/server";

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};

export default async function middleware(req: NextRequest) {
  const url = req.nextUrl;

  // Get hostname of request (e.g. domain.com, localhost:3000)
  const hostname = req.headers.get("host") || "localhost:3000";
  
  // Get the pathname of the request (e.g. /, /about, /blog/first-post)
  const path = url.pathname;

  /*  You have to replace ".domain.com" with your own domain if you deploy this example under your domain.
      You can also use wildcard subdomains on .vercel.app links that are associated with your Vercel team slug
      in this case, our team slug is "finnelliott", thus *.finnelliott.vercel.app works. Do note that you'll
      still need to add "*.finnelliott.vercel.app" as a wildcard domain on your Vercel dashboard. */
  const currentHost =
    process.env.NODE_ENV === "production" && process.env.VERCEL === "1"
      ? hostname
          .replace(`.domain.com`, "")
          .replace(`.finnelliott.vercel.app`, "")
      : hostname.replace(`.localhost:3000`, "");

    // rewrites for learn pages
    if (currentHost == "learn") {
        if (
        url.pathname === "/login" &&
        (req.cookies.get("next-auth.session-token") ||
            req.cookies.get("__Secure-next-auth.session-token"))
        ) {
        url.pathname = "/";
        return NextResponse.redirect(url);
        }

        url.pathname = `/learn${url.pathname}`;
        return NextResponse.rewrite(url);
    }

    // rewrites for create pages
    if (currentHost == "create") {
        if (
          url.pathname === "/login" &&
          (req.cookies.get("next-auth.session-token") ||
            req.cookies.get("__Secure-next-auth.session-token"))
        ) {
          url.pathname = "/";
          return NextResponse.redirect(url);
        }
    
        url.pathname = `/create${url.pathname}`;
        return NextResponse.rewrite(url);
      }

    // rewrite root application to `/home` folder
    if (hostname === "localhost:3000" || hostname === "finnelliott.vercel.app") {
        return NextResponse.rewrite(new URL(`/home${path}`, req.url));
    }

    // rewrite everything else to `/courses/[slug] dynamic route
    return NextResponse.rewrite(
        new URL(`/courses/${currentHost}${path}`, req.url)
    );
}