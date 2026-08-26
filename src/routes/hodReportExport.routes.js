const express =
    require("express");

const router =
    express.Router();


const hodReportExportController =
    require("../controllers/hodReportExport.controller");


const authMiddleware =
    require("../middlewares/auth.middleware");


const roleMiddleware =
    require("../middlewares/role.middleware");


const ROLES =
    require("../constants/roles");


// =====================================================
// HOD REPORT EXPORT ROUTES
// =====================================================

console.log(
    "✅ HOD REPORT EXPORT ROUTES LOADED"
);


// =====================================================
// AUTHENTICATION
// =====================================================

router.use(
    authMiddleware
);


// =====================================================
// HOD - GENERAL EXPORT
//
// GET:
//
// /hod-reports/general/export
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
        ROLES.HOD
    ]),

    hodReportExportController
        .exportGeneral

);


// =====================================================
// HOD - SPECIAL EXPORT
//
// GET:
//
// /hod-reports/special/export
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
        ROLES.HOD
    ]),

    hodReportExportController
        .exportSpecial

);


// =====================================================
// EXPORT
// =====================================================

module.exports =
    router;