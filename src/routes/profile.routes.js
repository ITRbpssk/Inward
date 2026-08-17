const express = require("express");

const router = express.Router();

const profileController =
    require("../controllers/profile.controller");

const authMiddleware =
    require("../middlewares/auth.middleware");


// =====================================================
// COMMON PROFILE ROUTES
// =====================================================

router.use(authMiddleware);


// =====================================================
// GET LOGGED-IN USER PROFILE
// =====================================================

router.get(
    "/",
    profileController.getMyProfile
);


// =====================================================
// CHANGE LOGGED-IN USER PASSWORD
// =====================================================

router.put(
    "/change-password",
    profileController.changePassword
);


module.exports = router;