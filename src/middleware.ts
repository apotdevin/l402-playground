import { NextRequest, NextResponse } from "next/server";

export default async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const search = req.nextUrl.search;

  console.log("PATH: ", path);

  if (path.startsWith("/l402")) {
    // const url = new URL(`http://localhost:4000${path}${search}`);
    const url = new URL(`https://api.amboss.space${path}${search}`);

    console.log(url.toString());

    return NextResponse.rewrite(url);
  }

  return NextResponse.next();
}

// Routes Middleware should not run on
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|.*\\.png$).*)"],
};
