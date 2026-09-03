const express = require("express");

const router = express.Router();

const userController =
    require("../controllers/user.controller");

const authMiddleware =
    require("../middlewares/auth.middleware");

const activityMiddleware =
    require("../middlewares/activity.middleware");

const roleMiddleware =
    require("../middlewares/role.middleware");

const ROLES =
    require("../constants/roles");


// =====================================================
// AUTHENTICATION
// =====================================================

router.use(authMiddleware);


// =====================================================
// ADMIN ONLY
// =====================================================

router.use(
    roleMiddleware([ROLES.ADMIN])
);


// =====================================================
// ACTIVITY LOGGING
// =====================================================

router.use(activityMiddleware);


// =====================================================
// USER ROUTES
// =====================================================

router.get(
    "/",
    userController.getAllUsers
);

router.get(
    "/:id",
    userController.getUserById
);

router.post(
    "/",
    userController.createUser
);

router.put(
    "/:id",
    userController.updateUser
);

router.delete(
    "/:id",
    userController.deleteUser
);


module.exports = router;