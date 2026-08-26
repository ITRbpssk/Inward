const express =
    require("express");

const router =
    express.Router();


const adminReportController =
    require("../controllers/adminReport.controller");


const authMiddleware =
    require("../middlewares/auth.middleware");


const roleMiddleware =
    require("../middlewares/role.middleware");


const ROLES =
    require("../constants/roles");


// =====================================================
// ADMIN REPORT ROUTES LOADED
// =====================================================

console.log(
    "✅ ADMIN REPORT ROUTES LOADED"
);


// =====================================================
// AUTHENTICATION
// =====================================================

router.use(
    authMiddleware
);


// =====================================================
// ADMIN ROLE ONLY
// =====================================================
//
// सर्व Admin report APIs साठी ADMIN role आवश्यक.
// =====================================================

router.use(
    roleMiddleware([
        ROLES.ADMIN
    ])
);


// =====================================================
// ADMIN - GENERAL REPORT
//
// GET:
//
// /admin-reports/general
//
// Query:
//
// financial_year=2026-27
//
// period=YEARLY
// period=Q1
// period=Q2
// period=Q3
// period=Q4
// =====================================================

router.get(

    "/general",

    adminReportController
        .getGeneralReport

);


// =====================================================
// ADMIN - SPECIAL REPORT
//
// GET:
//
// /admin-reports/special
//
// Query:
//
// financial_year=2026-27
//
// period=ALL
//
// OR
//
// period=Special 1
// period=Special 2
// etc.
// =====================================================

router.get(

    "/special",

    adminReportController
        .getSpecialReport

);


// =====================================================
// EXPORT
// =====================================================

module.exports =
    router;