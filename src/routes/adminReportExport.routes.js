const express =
    require("express");


const router =
    express.Router();


const adminReportExportController =
    require("../controllers/adminReportExport.controller");


const authMiddleware =
    require("../middlewares/auth.middleware");


const activityMiddleware =
    require("../middlewares/activity.middleware");


const roleMiddleware =
    require("../middlewares/role.middleware");


const ROLES =
    require("../constants/roles");


// =====================================================
// ADMIN REPORT EXPORT ROUTES
// =====================================================

console.log(
    "✅ ADMIN REPORT EXPORT ROUTES LOADED"
);


// =====================================================
// AUTHENTICATION
// =====================================================

router.use(
    authMiddleware
);


// =====================================================
// ADMIN - GENERAL EXPORT
//
// GET:
//
// /admin-reports/general/export
//
// Query:
//
// financial_year=2026-27
// period=Q1
// format=excel
//
// OR:
//
// period=Q2
// period=Q3
// period=Q4
// period=YEARLY
// format=pdf
// =====================================================

router.get(

    "/general/export",

    roleMiddleware([
        ROLES.ADMIN
    ]),

    activityMiddleware,

    adminReportExportController
        .exportGeneral

);


// =====================================================
// ADMIN - SPECIAL EXPORT
//
// GET:
//
// /admin-reports/special/export
//
// Query:
//
// financial_year=2026-27
// period=ALL
// format=excel
//
// OR:
//
// period=Special 1
// period=Special 2
// =====================================================

router.get(

    "/special/export",

    roleMiddleware([
        ROLES.ADMIN
    ]),

    activityMiddleware,

    adminReportExportController
        .exportSpecial

);


// =====================================================
// EXPORT
// =====================================================

module.exports =
    router;