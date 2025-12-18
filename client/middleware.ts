// middleware.ts
import { NextRequest, NextResponse } from "next/server";

export function middleware(req: NextRequest) {
    const token = req.cookies.get("token")?.value;
    const pathname = req.nextUrl.pathname;

    // ❗ BỎ QUA static files & next internals
    if (
        pathname.startsWith("/_next") ||
        pathname.startsWith("/favicon.ico") ||
        pathname.startsWith("/images") ||
        pathname.startsWith("/fonts")
    ) {
        return NextResponse.next();
    }

    // Cho phép auth
    if (pathname.startsWith("/auth")) {
        return NextResponse.next();
    }

    // Chưa login → redirect
    if (!token) {
        return NextResponse.redirect(new URL("/auth", req.url));
    }

    return NextResponse.next();
}
