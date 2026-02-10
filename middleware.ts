import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isPublicRoute = createRouteMatcher([
  "/",
  "/s(.*)",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/api/webhooks(.*)",
  "/api/cloudinary/sign(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  // Allow public routes without auth
  if (isPublicRoute(req)) {
    return;
  }

  // Protect all other routes (including /admin, /dashboard, and API routes)
  // Middleware must not call cookies()/Prisma; onboarding gating is enforced in dashboard layout.
  auth().protect();
});

export const config = {
  matcher: [
    // Skip Next.js internals and static files
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|map|woff|woff2|ttf|eot)).*)",
    // Include API routes
    "/(api|trpc)(.*)",
  ],
};
