/**
 * lib/hierarchyServer.js
 * Server-only Mongoose corporate hierarchy resolution utilities.
 * Connects to MongoDB to look up reporting supervisors and subordinate rosters.
 */
import connectDB from "@/lib/mongodb";
import Employee from "@/models/Employee";
import {
  getHierarchyRank,
  isUpperRole,
  HIERARCHY_RANK_MAP,
  POST_HIERARCHY_LEVELS,
} from "@/lib/hierarchy";

export { getHierarchyRank, isUpperRole, HIERARCHY_RANK_MAP, POST_HIERARCHY_LEVELS };

/**
 * Resolves who this employee reports to in the corporate hierarchy.
 * Returns { type: "EMPLOYEE_SUPERVISOR", supervisor } or { type: "OWNER", supervisor: null }.
 */
export async function resolveReportingSupervisor(employee) {
  try {
    await connectDB();
    const myRank = getHierarchyRank(employee.postLevel);

    // 1. If explicit supervisor is assigned and valid
    if (employee.reportsTo) {
      const explicit = await Employee.findOne({
        _id: employee.reportsTo,
        companyId: employee.companyId,
        approvalStatus: "APPROVED",
      }).lean();

      if (explicit) {
        return {
          type: "EMPLOYEE_SUPERVISOR",
          supervisor: explicit,
        };
      }
    }

    // 2. Automatic Corporate Hierarchy lookup:
    // Look for approved staff in same branch and department with a strictly higher rank
    const candidates = await Employee.find({
      companyId: employee.companyId,
      branchId: employee.branchId,
      department: employee.department,
      approvalStatus: "APPROVED",
      _id: { $ne: employee._id },
    }).lean();

    const upperCandidates = candidates
      .filter((c) => getHierarchyRank(c.postLevel) > myRank)
      .sort((a, b) => getHierarchyRank(a.postLevel) - getHierarchyRank(b.postLevel));

    if (upperCandidates.length > 0) {
      // Immediate next higher rank
      return {
        type: "EMPLOYEE_SUPERVISOR",
        supervisor: upperCandidates[0],
      };
    }

    // If no higher rank in the branch & department, employee reports to the Owner
    return {
      type: "OWNER",
      supervisor: null,
    };
  } catch (error) {
    console.error("resolveReportingSupervisor error:", error);
    return {
      type: "OWNER",
      supervisor: null,
    };
  }
}

/**
 * Finds all lower-ranked staff in the same department and branch under this employee.
 */
export async function getSubordinates(employee) {
  try {
    await connectDB();
    const myRank = getHierarchyRank(employee.postLevel);

    // If employee is lower-most rank (Assistant or Other), they have no subordinates
    if (myRank <= 1) {
      return [];
    }

    const candidates = await Employee.find({
      companyId: employee.companyId,
      branchId: employee.branchId,
      department: employee.department,
      approvalStatus: "APPROVED",
      _id: { $ne: employee._id },
    })
      .sort({ name: 1 })
      .lean();

    return candidates
      .filter((c) => getHierarchyRank(c.postLevel) < myRank)
      .map((c) => ({
        id: c._id.toString(),
        _id: c._id.toString(),
        name: c.name,
        email: c.email,
        phoneNumber: c.phoneNumber || "",
        department: c.department,
        postLevel: c.postLevel,
        postTitle: c.postTitle || c.postLevel.replace(/_/g, " "),
        workDescription: c.workDescription || "",
        branchId: c.branchId,
        branchName: c.branchName || "Main HQ",
        rank: getHierarchyRank(c.postLevel),
      }));
  } catch (error) {
    console.error("getSubordinates error:", error);
    return [];
  }
}
