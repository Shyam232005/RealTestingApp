/**
 * lib/routeMiddleware.js
 * Universal Route Handler Middleware & Database Security Wrappers
 * Consolidates Express middleware (Auth, Tenant Isolation, RBAC, Error Handling)
 * into high-performance Next.js Route Handler decorators.
 */

import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import connectDB from "@/lib/mongodb";
import Owner from "@/models/Owner";
import Employee from "@/models/Employee";
import Organization from "@/models/Organization";
import SuperAdmin from "@/models/SuperAdmin";

/**
 * Safely parse JSON payload from a Next.js Web Request
 */
export async function parseRequestBody(request) {
  try {
    const text = await request.text();
    if (!text || !text.trim()) return {};
    return JSON.parse(text);
  } catch (err) {
    throw new Error(`Invalid JSON request body: ${err.message}`);
  }
}

/**
 * Extract query parameters from request URL as a plain object
 */
export function parseRequestQuery(request) {
  const { searchParams } = new URL(request.url);
  const query = {};
  searchParams.forEach((val, key) => {
    query[key] = val;
  });
  return query;
}

/**
 * Higher-order Route Handler wrapper for authentication, RBAC, and tenant isolation
 *
 * @param {Function} handler - The async (req, context) => NextResponse route handler
 * @param {Object} options - Configuration options
 * @param {Array<string>} [options.roles] - Allowed user roles (e.g. ['OWNER', 'EMPLOYEE', 'SUPERADMIN'])
 * @param {boolean} [options.requireOrg=true] - Require active organization for Owners
 * @param {boolean} [options.requireApproved=true] - Require approved status for Employees
 * @param {string|Array<string>} [options.allowedDepartments] - Restrict to specific department(s)
 */
export function withRouteMiddleware(handler, options = {}) {
  const {
    roles = [],
    requireOrg = false,
    requireApproved = true,
    allowedDepartments = null,
  } = options;

  return async function wrappedHandler(request, context = {}) {
    try {
      // 1. Ensure global Mongoose connection cache is active
      await connectDB();

      // 2. Extract Session Token from Cookie or Bearer Header
      const cookieHeader = request.headers.get("cookie") || "";
      let token = null;

      const cookieMatch = cookieHeader.match(/crown_session=([^;]+)/);
      if (cookieMatch) {
        token = decodeURIComponent(cookieMatch[1]);
      }

      if (!token) {
        const authHeader = request.headers.get("authorization") || "";
        if (authHeader.startsWith("Bearer ")) {
          token = authHeader.substring(7).trim();
        }
      }

      if (!token) {
        return NextResponse.json(
          { success: false, error: "Unauthorized: Missing authentication token." },
          { status: 401 }
        );
      }

      // 3. Verify JWT signature
      let decoded;
      try {
        decoded = jwt.verify(token, process.env.JWT_SECRET);
      } catch (jwtErr) {
        return NextResponse.json(
          { success: false, error: "Unauthorized: Token expired or invalid.", details: jwtErr.message },
          { status: 401 }
        );
      }

      const rawRole = (decoded.role || decoded.normalizedRole || "").toUpperCase();
      request.user = decoded;

      // 4. Role-Based Access Control (RBAC) check
      if (roles.length > 0) {
        const isSuperAdmin =
          decoded.isSuperAdmin ||
          rawRole === "SUPERADMIN" ||
          rawRole === "ADMIN" ||
          rawRole === "SUPER_ADMIN";

        const hasMatchingRole =
          isSuperAdmin ||
          roles.some((r) => r.toUpperCase() === rawRole);

        if (!hasMatchingRole) {
          return NextResponse.json(
            {
              success: false,
              error: `Forbidden: Access restricted to roles [${roles.join(", ")}]. Current role: ${rawRole}`,
            },
            { status: 403 }
          );
        }
      }

      // 5. Context Resolution & Tenant Isolation
      if (rawRole === "OWNER") {
        const owner = await Owner.findById(decoded.userId).lean();
        if (!owner) {
          return NextResponse.json(
            { success: false, error: "Owner account not found." },
            { status: 404 }
          );
        }
        request.owner = owner;

        const organization = await Organization.findOne({ ownerId: owner._id }).lean();
        if (requireOrg && !organization) {
          return NextResponse.json(
            { success: false, error: "Organization profile setup required before accessing this resource." },
            { status: 403 }
          );
        }
        request.organization = organization;
      } else if (rawRole === "EMPLOYEE") {
        const employee = await Employee.findById(decoded.userId).lean();
        if (!employee) {
          return NextResponse.json(
            { success: false, error: "Employee account not found." },
            { status: 404 }
          );
        }

        if (requireApproved && employee.approvalStatus !== "APPROVED") {
          return NextResponse.json(
            {
              success: false,
              error: `Account not approved. Status: ${employee.approvalStatus}`,
              approvalStatus: employee.approvalStatus,
            },
            { status: 403 }
          );
        }

        if (allowedDepartments) {
          const depts = Array.isArray(allowedDepartments) ? allowedDepartments : [allowedDepartments];
          if (!depts.map((d) => d.toUpperCase()).includes((employee.department || "").toUpperCase())) {
            return NextResponse.json(
              {
                success: false,
                error: `Cross-department access prohibited. Employee is registered for [${employee.department}].`,
              },
              { status: 403 }
            );
          }
        }

        request.employee = employee;

        const owner = await Owner.findById(employee.companyId || employee.ownerId).lean();
        request.owner = owner;

        const organization = owner
          ? await Organization.findOne({ ownerId: owner._id }).lean()
          : null;
        request.organization = organization;
      } else if (rawRole === "SUPERADMIN" || rawRole === "ADMIN") {
        const admin = await SuperAdmin.findById(decoded.userId).lean();
        request.admin = admin || decoded;
      }

      // 6. Execute Route Handler
      return await handler(request, context);
    } catch (err) {
      console.error("[RouteMiddleware] Unhandled Error:", err);
      return NextResponse.json(
        {
          success: false,
          error: err.message || "Internal server error occurred.",
        },
        { status: 500 }
      );
    }
  };
}

/**
 * Asserts that a target resource belongs to the current user's organization.
 * Prevents cross-tenant IDOR violations.
 */
export function assertTenantOwnership(resourceOrgId, currentOrgId) {
  if (!resourceOrgId || !currentOrgId) {
    throw new Error("Tenant verification failure: Missing organization ID.");
  }

  const resStr = resourceOrgId.toString();
  const curStr = currentOrgId.toString();

  if (resStr !== curStr) {
    const error = new Error("Cross-tenant access violation: Target resource belongs to another organization.");
    error.status = 403;
    throw error;
  }
  return true;
}
