import { auth } from "@/lib/auth";

async function getDbBackedRole(req: Request): Promise<string | null> {
  try {
    const profileUrl = new URL("/api/profile", (req as any).nextUrl ?? req.url);
    const cookie = req.headers.get("cookie") || "";

    const response = await fetch(profileUrl.toString(), {
      headers: {
        cookie,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return typeof data?.role === "string" ? data.role : null;
  } catch {
    return null;
  }
}

export default auth(async (req) => {
  const isLoggedIn = !!req.auth;
  const isOnDashboard = req.nextUrl.pathname.startsWith("/dashboard");

  // Protect all /dashboard routes
  if (isOnDashboard) {
    // Not logged in -> redirect to signin
    if (!isLoggedIn) {
      return Response.redirect(new URL("/auth/signin", req.nextUrl));
    }

    const userRole = await getDbBackedRole(req as unknown as Request);
    if (!userRole) {
      return Response.redirect(new URL("/auth/signin", req.nextUrl));
    }
    
    // Special check for /dashboard/users (ADMIN only)
    if (req.nextUrl.pathname.startsWith("/dashboard/users")) {
      if (userRole !== "ADMIN") {
        return Response.redirect(new URL("/dashboard/articles", req.nextUrl));
      }
    }
    
    // For other dashboard routes, check if ADMIN or EDITOR
    else if (userRole !== "ADMIN" && userRole !== "EDITOR") {
      return Response.redirect(new URL("/", req.nextUrl));
    }
  }

  return;
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
