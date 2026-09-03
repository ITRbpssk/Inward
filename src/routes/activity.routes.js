const express =
    require("express");

const router =
    express.Router();


const activityController =
    require("../controllers/activity.controller");

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
// ADMIN ONLY
// =====================================================

router.use(
    roleMiddleware([
        ROLES.ADMIN
    ])
);


// =====================================================
// GET ALL ACTIVITY LOGS
// =====================================================

router.get(
    "/",
    activityController.getAllActivityLogs
);


// =====================================================
// GET ACTIVITY LOGS BY USER
// =====================================================

router.get(
    "/user/:userId",
    activityController.getActivityLogsByUser
);


// =====================================================
// EXPORT
// =====================================================

module.exports =
    router;