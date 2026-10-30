import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getAuthenticatedSuperAdmin } from "@/lib/adminAuth";
import connectDB from "@/lib/mongodb";
import Owner from "@/models/Owner";
import Employee, { DEPARTMENT_LIST, POST_HIERARCHY_LEVELS } from "@/models/Employee";
import Organization from "@/models/Organization";
import CA from "@/models/CA";
import CAStaff from "@/models/CAStaff";
import { resolveOrganizationForOwner, buildFullPlanDetails } from "@/lib/subscriptionHelper";

// GET /api/admin/users - Universal registry of all users across Owner, Employee, CA, and CA Staff
export async function GET(request) {
  try {
    const auth = await getAuthenticatedSuperAdmin();
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    await connectDB();
    const { searchParams } = new URL(request.url);
    const typeFilter = searchParams.get("type") || "ALL"; // ALL | OWNER | EMPLOYEE | CA | CA_STAFF
    const deptFilter = searchParams.get("department");
    const search = searchParams.get("search")?.toLowerCase().trim();

    let ownerList = [];
    let employeeList = [];
    let caList = [];
    let caStaffList = [];

    // 1. Fetch Owners
    if (typeFilter === "ALL" || typeFilter === "OWNER") {
      let query = {};
      if (search) {
        query.$or = [
          { name: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
          { phoneNumber: { $regex: search, $options: "i" } },
        ];
      }
      ownerList = await Owner.find(query).sort({ createdAt: -1 }).lean();
    }

    // 2. Fetch Employees
    if (typeFilter === "ALL" || typeFilter === "EMPLOYEE") {
      let query = {};
      if (deptFilter && deptFilter !== "ALL") {
        if (deptFilter.toUpperCase() === "RETAIL") {
          query.department = { $in: ["RETAIL", "COUNTER_BILLING", "POS"] };
        } else {
          query.department = deptFilter.toUpperCase();
        }
      }
      if (search) {
        query.$or = [
          { name: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
          { phoneNumber: { $regex: search, $options: "i" } },
          { postTitle: { $regex: search, $options: "i" } },
        ];
      }
      employeeList = await Employee.find(query).sort({ createdAt: -1 }).lean();
    }

    // 3. Fetch CA Partners
    if (typeFilter === "ALL" || typeFilter === "CA") {
      let query = {};
      if (search) {
        query.$or = [
          { name: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
          { phoneNumber: { $regex: search, $options: "i" } },
          { firmName: { $regex: search, $options: "i" } },
          { icaiNumber: { $regex: search, $options: "i" } },
        ];
      }
      caList = await CA.find(query).sort({ createdAt: -1 }).lean();
    }

    // 4. Fetch CA Staff & Article Assistants
    if (typeFilter === "ALL" || typeFilter === "CA_STAFF" || typeFilter === "STAFF") {
      let query = {};
      if (search) {
        query.$or = [
          { name: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
          { phoneNumber: { $regex: search, $options: "i" } },
        ];
      }
      caStaffList = await CAStaff.find(query)
        .populate("caFirmId", "name firmName icaiNumber")
        .sort({ createdAt: -1 })
        .lean();
    }

    // Pre-fetch all Organizations and Employee counts for accurate linking
    const [allOrganizations, employeeAgg] = await Promise.all([
      Organization.find().lean(),
      Employee.aggregate([
        { $group: { _id: "$companyId", count: { $sum: 1 } } },
      ]),
    ]);

    const orgMapByOwnerId = {};
    const orgMapByOrgId = {};
    allOrganizations.forEach((org) => {
      if (org.ownerId) orgMapByOwnerId[org.ownerId.toString()] = org;
      if (org._id) orgMapByOrgId[org._id.toString()] = org;
    });

    const empCountMap = {};
    employeeAgg.forEach((ea) => {
      if (ea._id) empCountMap[ea._id.toString()] = ea.count;
    });

    // Normalized user records
    const normalizedUsers = [];

    ownerList.forEach((o) => {
      const org = resolveOrganizationForOwner(o, orgMapByOwnerId, orgMapByOrgId);
      const empCount =
        empCountMap[o._id.toString()] ||
        (Array.isArray(o.employees) ? o.employees.length : 0);
      const planDetails = buildFullPlanDetails(o, org, empCount);

      normalizedUsers.push({
        _id: o._id,
        userType: "OWNER",
        role: "Owner",
        name: o.name,
        email: o.email,
        phoneNumber: o.phoneNumber,
        companyName: org?.RegisterName || org?.name || `${o.name}'s Organization`,
        department: "EXECUTIVE",
        postLevel: "OWNER",
        postTitle: "Business Owner / Managing Director",
        branchName: org?.branchList?.[0]?.name || "Headquarters",
        status: o.isSetupComplete ? "ACTIVE" : "PENDING_SETUP",
        planName: planDetails.planName,
        planDetails: planDetails,
        createdAt: o.createdAt,
      });
    });

    employeeList.forEach((e) => {
      normalizedUsers.push({
        _id: e._id,
        userType: "EMPLOYEE",
        role: "Employee",
        name: e.name,
        email: e.email,
        phoneNumber: e.phoneNumber,
        companyId: e.companyId || e.ownerId,
        department: e.department || "OPERATIONS",
        postLevel: e.postLevel || "ASSISTANT",
        postTitle: e.postTitle || e.postLevel,
        branchId: e.branchId || "branch-1",
        branchName: e.branchName || "Main HQ",
        status: e.approvalStatus || "APPROVED",
        createdAt: e.createdAt,
      });
    });

    caList.forEach((c) => {
      normalizedUsers.push({
        _id: c._id,
        userType: "CA",
        role: "CA",
        name: c.name,
        email: c.email,
        phoneNumber: c.phoneNumber,
        companyName: c.firmName || `${c.name} & Associates`,
        department: "AUDIT",
        postLevel: "CHARTERED_ACCOUNTANT",
        postTitle: `Practicing CA (${c.icaiNumber || "ICAI Member"})`,
        branchName: "CA Firm",
        status: "ACTIVE",
        staffCount: c.staff?.length || 0,
        clientsCount: (c.clients || c.clientCompanies || []).length,
        createdAt: c.createdAt,
      });
    });

    caStaffList.forEach((s) => {
      const firmObj = s.caFirmId;
      const firmTitle = firmObj?.firmName || firmObj?.name || "Crown Audit Associates";
      const assignedCount = (s.assignedCompanies || s.assignedClients || []).length;

      normalizedUsers.push({
        _id: s._id,
        userType: "CA_STAFF",
        role: "CA_STAFF",
        name: s.name,
        email: s.email,
        phoneNumber: s.phoneNumber,
        companyName: firmTitle,
        department: "AUDIT",
        postLevel: s.roleInFirm || "Article Assistant",
        postTitle: `${s.roleInFirm || "Article Assistant"} • ${firmTitle}`,
        branchName: "Staff Desk",
        status: "ACTIVE",
        caFirmId: firmObj?._id,
        assignedClientsCount: assignedCount,
        createdAt: s.createdAt,
      });
    });

    // Sort by latest creation
    normalizedUsers.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    // List of companies & CA firms for dropdowns
    const [companies, caFirms] = await Promise.all([
      Owner.find({}, "_id name email phoneNumber").lean(),
      CA.find({}, "_id name firmName icaiNumber").lean(),
    ]);

    return NextResponse.json({
      success: true,
      users: normalizedUsers,
      totalCount: normalizedUsers.length,
      companies: companies.map((c) => ({
        id: c._id,
        name: c.name,
        email: c.email,
        phone: c.phoneNumber,
      })),
      caFirms: caFirms.map((f) => ({
        id: f._id,
        name: f.firmName || f.name,
        partnerName: f.name,
        icaiNumber: f.icaiNumber,
      })),
    });
  } catch (error) {
    console.error("SuperAdmin Users GET Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to load users" },
      { status: 500 }
    );
  }
}

// POST /api/admin/users - SuperAdmin creates any type of user directly
export async function POST(request) {
  try {
    const auth = await getAuthenticatedSuperAdmin();
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    await connectDB();
    const body = await request.json().catch(() => ({}));
    const {
      userType, // OWNER | EMPLOYEE | CA | CA_STAFF
      name,
      email,
      phoneNumber,
      password,
      // Owner specific
      planName,
      companyName,
      // Employee specific
      companyId,
      department,
      postLevel,
      postTitle,
      branchId,
      branchName,
      // CA specific
      firmName,
      icaiNumber,
      // CA Staff specific
      caFirmId,
      roleInFirm,
    } = body;

    if (!userType || !name || !email || !phoneNumber || !password) {
      return NextResponse.json(
        { error: "User Type, Name, Email, Phone, and Password are required." },
        { status: 400 }
      );
    }

    const cleanEmail = email.toLowerCase().trim();
    const cleanPhone = phoneNumber.trim();

    // Check duplicate in all collections
    const [existingOwner, existingEmployee, existingCA, existingStaff] = await Promise.all([
      Owner.findOne({ $or: [{ email: cleanEmail }, { phoneNumber: cleanPhone }] }),
      Employee.findOne({ $or: [{ email: cleanEmail }, { phoneNumber: cleanPhone }] }),
      CA.findOne({ $or: [{ email: cleanEmail }, { phoneNumber: cleanPhone }] }),
      CAStaff.findOne({ $or: [{ email: cleanEmail }, { phoneNumber: cleanPhone }] }),
    ]);

    if (existingOwner || existingEmployee || existingCA || existingStaff) {
      return NextResponse.json(
        { error: "A user with this email or phone number already exists in the system." },
        { status: 400 }
      );
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 1. Create OWNER
    if (userType === "OWNER") {
      const chosenPlan = planName || "Manufacturing & Growth";
      const newOwner = new Owner({
        name: name.trim(),
        email: cleanEmail,
        phoneNumber: cleanPhone,
        password: hashedPassword,
        planName: chosenPlan,
        paymentStatus: "paid",
        isProfileComplete: true,
        isSetupComplete: true,
      });

      await newOwner.save();

      // Create Organization
      const orgName = companyName?.trim() || `${name.trim()}'s Organization`;
      const newOrg = new Organization({
        ownerId: newOwner._id,
        RegisterName: orgName,
        planName: chosenPlan,
        GST: "24AAAAA0000A1Z5",
        location: "Headquarters",
        industry: "Manufacturing & Services",
        BankName: "State Bank of India",
        IFSC: "SBIN0001234",
        AccNo: "123456789012",
        branches: 1,
        branchList: [
          {
            branchId: "branch-1",
            branchNumber: 1,
            name: "Main HQ",
            location: "Headquarters",
            status: "active",
          },
        ],
      });
      await newOrg.save();

      return NextResponse.json({
        success: true,
        message: `Owner account for ${name} and organization '${orgName}' created successfully!`,
        user: {
          _id: newOwner._id,
          userType: "OWNER",
          name: newOwner.name,
          email: newOwner.email,
          phoneNumber: newOwner.phoneNumber,
          planName: newOwner.planName,
        },
      });
    }

    // 2. Create EMPLOYEE
    if (userType === "EMPLOYEE") {
      if (!companyId) {
        return NextResponse.json(
          { error: "Target company/owner must be selected for Employee." },
          { status: 400 }
        );
      }

      const upperDept = (department || "OPERATIONS").toUpperCase();
      const level = postLevel || "ASSISTANT";

      const newEmployee = new Employee({
        name: name.trim(),
        email: cleanEmail,
        phoneNumber: cleanPhone,
        password: hashedPassword,
        companyId: companyId,
        ownerId: companyId,
        department: upperDept,
        postLevel: level,
        postTitle: postTitle?.trim() || level,
        branchId: branchId || "branch-1",
        branchName: branchName || "Main HQ",
        approvalStatus: "APPROVED",
        isRegistered: true,
      });

      await newEmployee.save();

      return NextResponse.json({
        success: true,
        message: `Employee ${name} registered and pre-approved in ${upperDept}!`,
        user: {
          _id: newEmployee._id,
          userType: "EMPLOYEE",
          name: newEmployee.name,
          email: newEmployee.email,
          phoneNumber: newEmployee.phoneNumber,
          department: newEmployee.department,
          postTitle: newEmployee.postTitle,
        },
      });
    }

    // 3. Create CA Partner
    if (userType === "CA") {
      const newCA = new CA({
        name: name.trim(),
        email: cleanEmail,
        phoneNumber: cleanPhone,
        password: hashedPassword,
        icaiNumber: icaiNumber?.trim() || `ICAI-${Date.now().toString().slice(-6)}`,
        firmName: firmName?.trim() || `${name.trim()} & Associates`,
        isSetupComplete: true,
      });

      await newCA.save();

      return NextResponse.json({
        success: true,
        message: `Chartered Accountant account for ${name} created successfully!`,
        user: {
          _id: newCA._id,
          userType: "CA",
          name: newCA.name,
          email: newCA.email,
          phoneNumber: newCA.phoneNumber,
          icaiNumber: newCA.icaiNumber,
        },
      });
    }

    // 4. Create CA Staff & Article Assistant
    if (userType === "CA_STAFF") {
      if (!caFirmId) {
        return NextResponse.json(
          { error: "Parent CA Firm must be selected for CA Staff." },
          { status: 400 }
        );
      }

      const parentCA = await CA.findById(caFirmId);
      if (!parentCA) {
        return NextResponse.json({ error: "Selected CA Practice does not exist." }, { status: 404 });
      }

      const newStaff = new CAStaff({
        name: name.trim(),
        email: cleanEmail,
        phoneNumber: cleanPhone,
        password: hashedPassword,
        caFirmId: parentCA._id,
        roleInFirm: roleInFirm || "Article Assistant",
        isActive: true,
      });

      await newStaff.save();

      // Link to parent CA
      await CA.findByIdAndUpdate(parentCA._id, {
        $addToSet: { staff: newStaff._id },
      });

      return NextResponse.json({
        success: true,
        message: `Audit Staff member ${name} created and linked to ${parentCA.firmName || parentCA.name}!`,
        user: {
          _id: newStaff._id,
          userType: "CA_STAFF",
          name: newStaff.name,
          email: newStaff.email,
          phoneNumber: newStaff.phoneNumber,
          roleInFirm: newStaff.roleInFirm,
          caFirm: parentCA.firmName || parentCA.name,
        },
      });
    }

    return NextResponse.json({ error: "Invalid userType specified." }, { status: 400 });
  } catch (error) {
    console.error("SuperAdmin Users POST Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create user" },
      { status: 500 }
    );
  }
}
