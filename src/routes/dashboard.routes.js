const express = require("express");

const router = express.Router();

const dashboardController =
    require("../controllers/dashboard.controller");

const authMiddleware =
    require("../middlewares/auth.middleware");

const roleMiddleware =
    require("../middlewares/role.middleware");

const ROLES =
    require("../constants/roles");


router.use(authMiddleware);


// =====================================================
// DASHBOARD SUMMARY
// ADMIN + HOD
// =====================================================

router.get(
    "/summary",
    roleMiddleware([
        ROLES.ADMIN,
        ROLES.HOD
    ]),
    dashboardController.getSummary
);


// =====================================================
// DEPARTMENT ANALYTICS
// ADMIN + HOD
// =====================================================

router.get(
    "/department-analytics",
    roleMiddleware([
        ROLES.ADMIN,
        ROLES.HOD
    ]),
    dashboardController.getDepartmentAnalytics
);


// =====================================================
// DEPARTMENT EVALUATION OVERVIEW
// ADMIN ONLY
// =====================================================

router.get(
    "/department-evaluation-overview",
    roleMiddleware([
        ROLES.ADMIN
    ]),
    dashboardController.getDepartmentEvaluationOverview
);


// =====================================================
// DEPARTMENT DETAILED ANALYTICS
// ADMIN + HOD
// =====================================================

router.get(
    "/department-detailed",
    roleMiddleware([
        ROLES.ADMIN,
        ROLES.HOD
    ]),
    dashboardController.getDepartmentDetailedAnalytics
);


// =====================================================
// FEEDBACK MATRIX
// ADMIN ONLY
// =====================================================

router.get(
    "/matrix",
    roleMiddleware([
        ROLES.ADMIN
    ]),
    dashboardController.getMatrix
);


module.exports = router;