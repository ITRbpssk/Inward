const express =
    require("express");


const router =
    express.Router();


console.log(
    "✅ Routes index loaded"
);


// =====================================================
// ROUTES
// =====================================================

const authRoutes =
    require("./auth.routes");


const userRoutes =
    require("./user.routes");


const departmentRoutes =
    require("./department.routes");


const departmentMappingRoutes =
    require("./departmentMapping.routes");


const surveyRoutes =
    require("./survey.routes");


const parameterRoutes =
    require("./parameter.routes");


const feedbackRoutes =
    require("./feedback.routes");


const dashboardRoutes =
    require("./dashboard.routes");


// =====================================================
// ADMIN REPORT ROUTES
// =====================================================

const adminReportRoutes =
    require("./adminReport.routes");


// =====================================================
// ADMIN REPORT EXPORT ROUTES
// =====================================================

const adminReportExportRoutes =
    require("./adminReportExport.routes");








    const activityRoutes =
    require("./activity.routes");


// =====================================================
// HOD REPORT ROUTES
// =====================================================

const hodReportRoutes =
    require("./hodReport.routes");


// =====================================================
// HOD REPORT EXPORT ROUTES
// =====================================================

const hodReportExportRoutes =
    require("./hodReportExport.routes");


const surveyDepartmentRoutes =
    require("./surveyDepartment.routes");


const roleRoutes =
    require("./role.routes");


const profileRoutes =
    require("./profile.routes");


const specialParameterRoutes =
    require("./specialParameter.routes");


// =====================================================
// AUTH
// =====================================================

router.use(
    "/auth",
    authRoutes
);


// =====================================================
// USERS
// =====================================================

router.use(
    "/users",
    userRoutes
);


// =====================================================
// DEPARTMENTS
// =====================================================

router.use(
    "/departments",
    departmentRoutes
);


// =====================================================
// DEPARTMENT MAPPINGS
// =====================================================

router.use(
    "/mappings",
    departmentMappingRoutes
);


// =====================================================
// SURVEYS
// =====================================================

router.use(
    "/surveys",
    surveyRoutes
);


// =====================================================
// PARAMETERS
// =====================================================

router.use(
    "/parameters",
    parameterRoutes
);


// =====================================================
// FEEDBACKS
// =====================================================

router.use(
    "/feedbacks",
    feedbackRoutes
);


// =====================================================
// DASHBOARD
// =====================================================

router.use(
    "/dashboard",
    dashboardRoutes
);


// =====================================================
// ADMIN REPORTS
//
// Base:
//
// /admin-reports
//
// Endpoints:
//
// GET /admin-reports/general
// GET /admin-reports/special
//
// Admin only.
// =====================================================

router.use(
    "/admin-reports",
    adminReportRoutes
);


// =====================================================
// ADMIN REPORT EXPORTS
//
// Base:
//
// /admin-reports
//
// Endpoints:
//
// GET /admin-reports/general/export
// GET /admin-reports/special/export
//
// Admin only.
//
// Supported formats:
//
// excel
// pdf
//
// General periods:
//
// Q1
// Q2
// Q3
// Q4
// YEARLY
//
// Special periods:
//
// ALL
// Special 1
// Special 2
// ...
// =====================================================

router.use(
    "/admin-reports",
    adminReportExportRoutes
);


// =====================================================
// HOD REPORTS
//
// Base:
//
// /hod-reports
//
// Endpoints:
//
// GET /hod-reports/general
// GET /hod-reports/special
//
// HOD only.
//
// IMPORTANT:
//
// HOD report service receives req.user.
//
// Therefore:
//
// IT HOD
//     -> IT HOD report only
//
// Accounts HOD
//     -> Accounts HOD report only
//
// HR HOD
//     -> HR HOD report only
// =====================================================

router.use(
    "/hod-reports",
    hodReportRoutes
);


// =====================================================
// HOD REPORT EXPORTS
//
// Base:
//
// /hod-reports
//
// Endpoints:
//
// GET /hod-reports/general/export
// GET /hod-reports/special/export
//
// HOD only.
//
// IMPORTANT:
//
// Export controller receives req.user.
//
// Therefore the logged-in HOD can download
// only their own department's report.
// =====================================================

router.use(
    "/hod-reports",
    hodReportExportRoutes
);


// =====================================================
// SURVEY DEPARTMENTS
// =====================================================

router.use(
    "/survey-departments",
    surveyDepartmentRoutes
);


// =====================================================
// ROLES
// =====================================================

router.use(
    "/roles",
    roleRoutes
);









router.use(
    "/activity-logs",
    activityRoutes
);


// =====================================================
// PROFILE
// =====================================================

router.use(
    "/profile",
    profileRoutes
);


// =====================================================
// SPECIAL PARAMETERS
// =====================================================

router.use(
    "/special-parameters",
    specialParameterRoutes
);


// =====================================================
// EXPORT
// =====================================================

module.exports =
    router;