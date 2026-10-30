import { NextResponse } from "next/server";
import { jwtVerify } from "jose";

/**
 * Root Next.js Proxy (Next.js 16 standard replacing legacy middleware.js)
 * Consolidates:
 * - Edge JWT Authentication & Session Extraction
 * - Paid User & Active Subscription Enforcement
 * - Strict Separation of CA Partner (/ca) and CA Staff (/staff) Portals
 * - RBAC & Tenant Isolation across SuperAdmin, Owner, Employee, CA, and Staff
 * - Anti-URL Tampering Protections
 * - Preflight & Security Headers
 */

// Public routes that never require authentication
const PUBLIC_PAGE_ROUTES = [
  "/",
  "/login",
  "/signup",
  "/contact",
  "/benefits",
  "/overview",
  "/who",
  "/purchase",
  "/payment",
];

const PUBLIC_API_ROUTES = [
  "/api/auth",
  "/api/contact",
  "/api/health",
  "/api/socket",
];

export async function proxy(request) {
  const { pathname } = request.nextUrl;

  // 1. Handle CORS Preflight for API requests
  if (request.method === "OPTIONS" && pathname.startsWith("/api/")) {
    const response = new NextResponse(null, { status: 204 });
    response.headers.set("Access-Control-Allow-Origin", "*");
    response.headers.set(
      "Access-Control-Allow-Methods",
      "GET, POST, PUT, DELETE, PATCH, OPTIONS"
    );
    response.headers.set(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization, X-Requested-With"
    );
    return response;
  }

  // 2. Bypass static assets and Next.js internals
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon.ico") ||
    pathname.match(/\.(png|jpg|jpeg|gif|svg|webp|ico|pdf|csv)$/i)
  ) {
    return NextResponse.next();
  }

  // 3. Check if route is public
  const isPublicPage = PUBLIC_PAGE_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );
  const isPublicApi = PUBLIC_API_ROUTES.some((route) =>
    pathname.startsWith(route)
  );

  if (isPublicPage || isPublicApi) {
    return NextResponse.next();
  }

  // 4. Token Extraction & Verification (Edge-compatible jose)
  const sessionCookie = request.cookies.get("crown_session")?.value;
  let token = sessionCookie;

  if (!token) {
    const authHeader = request.headers.get("authorization") || "";
    if (authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7).trim();
    }
  }

  let user = null;
  if (token) {
    try {
      const secret = new TextEncoder().encode(
        process.env.JWT_SECRET || "crown_enterprise_secret_fallback_2026"
      );
      const { payload } = await jwtVerify(token, secret);
      user = payload;
    } catch {
      user = null;
    }
  }

  // 5. Unauthenticated Access Barrier - Strictly protect internal web app pages
  if (!user) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized: Active paid authentication session required.",
          code: "AUTH_REQUIRED",
        },
        { status: 401 }
      );
    }

    // Redirect browser page request to /login with return URL
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 6. Role Resolution
  const rawRole = (
    user.role ||
    user.normalizedRole ||
    ""
  ).toUpperCase();

  const isSuperAdmin =
    user.isSuperAdmin ||
    rawRole === "SUPERADMIN" ||
    rawRole === "ADMIN" ||
    rawRole === "SUPER_ADMIN";

  const isOwner = isSuperAdmin || rawRole === "OWNER" || rawRole === "BUSINESS_OWNER";
  const isEmployee = rawRole === "EMPLOYEE";
  const isCAPartner = isSuperAdmin || rawRole === "CA" || rawRole === "CA_PARTNER";
  const isCAStaff =
    isSuperAdmin ||
    rawRole === "CA_STAFF" ||
    rawRole === "CA-EMPLOYEE" ||
    rawRole === "CASTAFF";

  // 7. Role-Based Route Protection (RBAC) & Paid Enforcement

  // 7.1 Admin Portal & APIs (/admin/**, /api/admin/**)
  if (pathname.startsWith("/admin") || pathname.startsWith("/api/admin")) {
    if (!isSuperAdmin) {
      if (pathname.startsWith("/api/")) {
        return NextResponse.json(
          {
            success: false,
            error: "Forbidden: SuperAdmin privileges required.",
            code: "ADMIN_REQUIRED",
          },
          { status: 403 }
        );
      }
      return NextResponse.redirect(new URL("/owner/dashboard", request.url));
    }
  }

  // 7.2 Owner Portal & APIs (/owner/**, /books/**, /insights/**, /api/owner/**)
  if (
    pathname.startsWith("/owner") ||
    pathname.startsWith("/books") ||
    pathname.startsWith("/insights") ||
    pathname.startsWith("/api/owner")
  ) {
    if (!isOwner) {
      if (pathname.startsWith("/api/")) {
        return NextResponse.json(
          {
            success: false,
            error: "Forbidden: Business Owner privileges required.",
            code: "OWNER_REQUIRED",
          },
          { status: 403 }
        );
      }
      if (isCAPartner) return NextResponse.redirect(new URL("/ca", request.url));
      if (isCAStaff) return NextResponse.redirect(new URL("/staff", request.url));
      return NextResponse.redirect(new URL("/department", request.url));
    }

    // Paid Plan Enforcement for Business Owners
    if (!isSuperAdmin && user.subscriptionStatus) {
      const subStatus = String(user.subscriptionStatus).toLowerCase();
      if (subStatus === "expired" || subStatus === "canceled") {
        if (pathname.startsWith("/api/")) {
          return NextResponse.json(
            {
              success: false,
              error: "Payment required: Your business subscription has expired. Please renew.",
              code: "SUBSCRIPTION_REQUIRED",
            },
            { status: 402 }
          );
        }
        return NextResponse.redirect(new URL("/purchase?reason=subscription_required", request.url));
      }
    }
  }

  // 7.3 Department Workspace & APIs (/department/**, /api/employee/**)
  if (
    pathname.startsWith("/department") ||
    pathname.startsWith("/api/employee")
  ) {
    if (!isEmployee && !isOwner) {
      if (pathname.startsWith("/api/")) {
        return NextResponse.json(
          {
            success: false,
            error: "Forbidden: Employee session required.",
            code: "EMPLOYEE_REQUIRED",
          },
          { status: 403 }
        );
      }
      if (isCAPartner) return NextResponse.redirect(new URL("/ca", request.url));
      if (isCAStaff) return NextResponse.redirect(new URL("/staff", request.url));
      return NextResponse.redirect(new URL("/login", request.url));
    }

    // Anti-URL Tampering: If approved employee attempts to access unauthorized department URL
    if (isEmployee) {
      const approvalStatus = user.approvalStatus;
      const employeeDept = (user.department || "").toLowerCase();

      // If pending approval, lock to pending screen
      if (approvalStatus === "PENDING" && pathname !== "/department/pending-approval") {
        return NextResponse.redirect(new URL("/department/pending-approval", request.url));
      }

      // If onboarding not completed
      if (approvalStatus === "ONBOARDING" && pathname !== "/department/onboarding") {
        return NextResponse.redirect(new URL("/department/onboarding", request.url));
      }

      // Check cross-department page access
      const deptPageRoutes = ["financial", "logistics", "operations", "sales"];
      const targetDeptInUrl = deptPageRoutes.find((d) =>
        pathname.startsWith(`/department/${d}`)
      );

      if (targetDeptInUrl && employeeDept && targetDeptInUrl !== employeeDept) {
        return NextResponse.redirect(
          new URL(`/department/${employeeDept}`, request.url)
        );
      }
    }
  }

  // 7.4 CA Partner Portal (/ca/**) - Strictly separated from Staff
  if (pathname.startsWith("/ca")) {
    // If someone visits /ca/staff, route to dedicated Staff Portal
    if (pathname === "/ca/staff" || pathname.startsWith("/ca/staff/")) {
      return NextResponse.redirect(new URL("/staff", request.url));
    }

    // If an Audit Staff member tries to access CA Partner portal, redirect to /staff
    if (isCAStaff && !isCAPartner) {
      return NextResponse.redirect(new URL("/staff", request.url));
    }

    if (!isCAPartner) {
      if (isOwner) return NextResponse.redirect(new URL("/owner/dashboard", request.url));
      if (isEmployee) return NextResponse.redirect(new URL("/department", request.url));
      return NextResponse.redirect(new URL("/login?redirect=" + encodeURIComponent(pathname), request.url));
    }

    // If CA Partner has not completed onboarding setup, guide them to /ca/setup
    if (user.isSetupComplete === false && !pathname.startsWith("/ca/setup")) {
      return NextResponse.redirect(new URL("/ca/setup", request.url));
    }
  }

  // 7.5 CA Staff Portal (/staff/**) - Strictly separated from CA Partner
  if (pathname.startsWith("/staff")) {
    // If a CA Partner tries to access Staff portal, redirect to /ca
    if (isCAPartner && !isCAStaff) {
      return NextResponse.redirect(new URL("/ca", request.url));
    }

    if (!isCAStaff) {
      if (isOwner) return NextResponse.redirect(new URL("/owner/dashboard", request.url));
      if (isEmployee) return NextResponse.redirect(new URL("/department", request.url));
      return NextResponse.redirect(new URL("/login?redirect=" + encodeURIComponent(pathname), request.url));
    }
  }

  // 7.6 CA & Staff Shared APIs (/api/ca/**)
  if (pathname.startsWith("/api/ca")) {
    const isAuthorizedCAEntity = isCAPartner || isCAStaff || isSuperAdmin;
    if (!isAuthorizedCAEntity) {
      return NextResponse.json(
        {
          success: false,
          error: "Forbidden: Chartered Accountant or Audit Staff credentials required.",
          code: "CA_REQUIRED",
        },
        { status: 403 }
      );
    }
  }

  // 8. Forward request with enriched identity headers for downstream handlers
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-user-id", user.userId || user.id || "");
  requestHeaders.set("x-user-role", rawRole);
  if (user.companyId || user.ownerId) {
    requestHeaders.set("x-company-id", user.companyId || user.ownerId);
  }
  if (user.department) {
    requestHeaders.set("x-user-department", user.department);
  }

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  // Apply default security & CORS response headers
  response.headers.set("Access-Control-Allow-Origin", "*");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");

  return response;
}

// Backwards-compatible export alias for any tooling inspecting middleware export
export const middleware = proxy;

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * 1. /_next/static (static files)
     * 2. /_next/image (image optimization files)
     * 3. /favicon.ico (favicon file)
     * 4. Static asset extensions (.svg, .png, etc.)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
