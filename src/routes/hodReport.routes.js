const express =
    require("express");

const router =
    express.Router();


const hodReportController =
    require("../controllers/hodReport.controller");


const authMiddleware =
    require("../middlewares/auth.middleware");


const roleMiddleware =
    require("../middlewares/role.middleware");


const ROLES =
    require("../constants/roles");


// =====================================================
// HOD REPORT ROUTES LOADED
// =====================================================

console.log(
    "✅ HOD REPORT ROUTES LOADED"
);


// =====================================================
// AUTHENTICATION
// =====================================================

router.use(
    authMiddleware
);


// =====================================================
// HOD - GENERAL REPORT
//
// GET:
//
// /reports/hod/general
//
// Query:
//
// financial_year=2026-27
// period=Q1
//
// OR
//
// period=Q2
// period=Q3
// period=Q4
// period=YEARLY
// =====================================================

router.get(

    "/general",

    roleMiddleware([
        ROLES.HOD
    ]),

    hodReportController
        .getGeneralReport

);


// =====================================================
// HOD - SPECIAL REPORT
//
// GET:
//
// /reports/hod/special
//
// Query:
//
// financial_year=2026-27
// period=ALL
//
// OR
//
// period=Special 1
// period=Special 2
// =====================================================

router.get(

    "/special",

    roleMiddleware([
        ROLES.HOD
    ]),

    hodReportController
        .getSpecialReport

);


// =====================================================
// EXPORT
// =====================================================

module.exports =
    router;