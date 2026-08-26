const express =
    require("express");


const router =
    express.Router();


const reportController =
    require("../controllers/report.controller");


const authMiddleware =
    require("../middlewares/auth.middleware");


const roleMiddleware =
    require("../middlewares/role.middleware");


const ROLES =
    require("../constants/roles");


// =====================================================
// AUTHENTICATION
// =====================================================

router.use(
    authMiddleware
);


// =====================================================
// ADMIN + HOD
// =====================================================

router.use(
    roleMiddleware([
        ROLES.ADMIN,
        ROLES.HOD
    ])
);


// =====================================================
// QUARTERLY REPORT
//
// ADMIN:
// GET /reports/quarterly?year=2026
//
// HOD:
// GET /reports/quarterly?year=2026
//
// HOD department_id comes from auth token.
// =====================================================

router.get(
    "/quarterly",

    reportController
        .getQuarterlyReport
);


// =====================================================
// SPECIAL SURVEY REPORT
//
// ADMIN:
// GET /reports/special?survey_id=123
//
// HOD:
// GET /reports/special?survey_id=123
//
// HOD department_id comes from auth token.
// =====================================================

router.get(
    "/special",

    reportController
        .getSpecialSurveyReport
);


// =====================================================
// EXISTING EXCEL
// =====================================================

router.get(
    "/excel",

    reportController
        .exportExcel
);


// =====================================================
// EXISTING PDF
// =====================================================

router.get(
    "/pdf",

    reportController
        .exportPDF
);


// =====================================================
// EXPORT
// =====================================================

module.exports =
    router;