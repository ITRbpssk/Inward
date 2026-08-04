const express = require("express");
const router = express.Router();
const dashboardController = require("../controllers/dashboard.controller");
const authMiddleware = require("../middlewares/auth.middleware");
const roleMiddleware = require("../middlewares/role.middleware");
const ROLES = require("../constants/roles");

router.use(authMiddleware);

// Analytics visible to both Admin and HOD
router.get("/summary", roleMiddleware([ROLES.ADMIN, ROLES.HOD]), dashboardController.getSummary);
router.get("/department-analytics", roleMiddleware([ROLES.ADMIN, ROLES.HOD]), dashboardController.getDepartmentAnalytics);
router.get("/department-detailed", roleMiddleware([ROLES.ADMIN, ROLES.HOD]), dashboardController.getDepartmentDetailedAnalytics);

// Cross-tabulation matrix of all evaluations (Admin only)
router.get("/matrix", roleMiddleware([ROLES.ADMIN]), dashboardController.getMatrix);

module.exports = router;
