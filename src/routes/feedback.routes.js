const express = require("express");

const router = express.Router();

const feedbackController =
    require("../controllers/feedback.controller");

const authMiddleware =
    require("../middlewares/auth.middleware");

const roleMiddleware =
    require("../middlewares/role.middleware");

const ROLES =
    require("../constants/roles");


// =====================================================
// FEEDBACK ROUTER LOADED
// =====================================================

console.log("🔥 FEEDBACK ROUTES FILE LOADED");


// =====================================================
// FEEDBACK ROUTE DEBUG
// =====================================================

router.use((req, res, next) => {

    console.log("🔥 FEEDBACK ROUTE HIT");
    console.log("METHOD:", req.method);
    console.log("URL:", req.originalUrl);

    next();

});


// =====================================================
// AUTHENTICATION
// =====================================================

router.use(authMiddleware);


// =====================================================
// HOD - SUBMIT / SAVE FEEDBACK
// =====================================================

router.post(
    "/",

    roleMiddleware([
        ROLES.HOD
    ]),

    feedbackController.submitOrSaveFeedback
);


// =====================================================
// HOD - FEEDBACK STATUS
// =====================================================

router.get(
    "/status",

    roleMiddleware([
        ROLES.HOD
    ]),

    feedbackController.getFeedbackStatusForHOD
);


// =====================================================
// HOD - CREATOR FEEDBACK STATUS
// =====================================================

router.get(
    "/creator-status",

    roleMiddleware([
        ROLES.HOD
    ]),

    feedbackController.getCreatorFeedbackStatus
);


// =====================================================
// HOD - FEEDBACK DETAILS
// =====================================================

router.get(
    "/details",

    roleMiddleware([
        ROLES.HOD
    ]),

    feedbackController.getFeedbackDetails
);


// =====================================================
// ADMIN - DEPARTMENT EVALUATION STATUS
//
// GET:
// /feedbacks/admin-status
//
// Query:
// survey_id
// from_department_id
//
// Returns:
// Target departments
// Submitted
// Draft
// Pending
// =====================================================

router.get(
    "/admin-status",

    (req, res, next) => {

        console.log("");
        console.log(
            "🔥🔥🔥 ADMIN FEEDBACK STATUS ROUTE HIT 🔥🔥🔥"
        );

        console.log(
            "URL:",
            req.originalUrl
        );

        console.log(
            "AUTH HEADER EXISTS:",
            !!req.headers.authorization
        );

        console.log(
            "AUTH HEADER:",
            req.headers.authorization
                ? "Bearer token present"
                : "NO TOKEN"
        );

        console.log(
            "USER:",
            req.user
        );

        console.log(
            "🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥"
        );

        next();

    },

    roleMiddleware([
        ROLES.ADMIN
    ]),

    feedbackController.getFeedbackStatusForAdmin
);


// =====================================================
// ADMIN - FEEDBACK DETAILS
//
// GET:
// /feedbacks/admin-details
//
// Query:
// survey_id
// from_department_id
// to_department_id
// =====================================================

router.get(
    "/admin-details",

    roleMiddleware([
        ROLES.ADMIN
    ]),

    feedbackController.getFeedbackDetailsForAdmin
);


// =====================================================
// ADMIN + HOD - GET FEEDBACK BY ID
//
// IMPORTANT:
// THIS MUST ALWAYS BE LAST
// =====================================================

router.get(
    "/:id",

    roleMiddleware([
        ROLES.ADMIN,
        ROLES.HOD
    ]),

    feedbackController.getFeedbackById
);


// =====================================================
// EXPORT ROUTER
// =====================================================

module.exports = router;