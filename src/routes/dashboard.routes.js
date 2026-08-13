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
// ADMIN + HOD + HR
// =====================================================

router.get(
    "/summary",
    roleMiddleware([
        ROLES.ADMIN,
        ROLES.HOD,
        ROLES.HR
    ]),
    dashboardController.getSummary
);


// =====================================================
// DEPARTMENT ANALYTICS
// ADMIN + HOD + HR
// =====================================================

router.get(
    "/department-analytics",
    roleMiddleware([
        ROLES.ADMIN,
        ROLES.HOD,
        ROLES.HR
    ]),
    dashboardController.getDepartmentAnalytics
);


// =====================================================
// DEPARTMENT DETAILED ANALYTICS
// ADMIN + HOD + HR
// =====================================================

router.get(
    "/department-detailed",
    roleMiddleware([
        ROLES.ADMIN,
        ROLES.HOD,
        ROLES.HR
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