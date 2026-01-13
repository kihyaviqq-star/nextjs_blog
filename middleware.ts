import { auth } from "@/lib/auth";

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const userRole = (req.auth?.user as any)?.role;
  const isOnDashboard = req.nextUrl.pathname.startsWith("/dashboard");

  // Protect all /dashboard routes
  if (isOnDashboard) {
    // Not logged in -> redirect to signin
    if (!isLoggedIn) {
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
