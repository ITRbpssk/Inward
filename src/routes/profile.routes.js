const express = require("express");

const router =
    express.Router();

const profileController =
    require("../controllers/profile.controller");

const authMiddleware =
    require("../middlewares/auth.middleware");


// =====================================================
// COMMON PROFILE ROUTES
// =====================================================

router.use(authMiddleware);


// Logged-in user's own profile
router.get(
    "/",
    profileController.getMyProfile
);


module.exports = router;