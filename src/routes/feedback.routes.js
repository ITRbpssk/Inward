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
        ROLES.HOD,
        ROLES.HR
    ]),
    feedbackController.submitOrSaveFeedback
);


// =====================================================
// HOD - FEEDBACK STATUS
// =====================================================

router.get(
    "/status",
    roleMiddleware([
        ROLES.HOD,
        ROLES.HR
    ]),
    feedbackController.getFeedbackStatusForHOD
);


// =====================================================
// HOD - FEEDBACK DETAILS
// =====================================================

router.get(
    "/details",
    roleMiddleware([
        ROLES.HOD,
        ROLES.HR
    ]),
    feedbackController.getFeedbackDetails
);


// =====================================================
// HR + ADMIN - VIEW DEPARTMENT EVALUATIONS
// =====================================================
//
// Used by:
//
// HR Panel
// Admin Dashboard
//
// GET:
// /feedbacks/hr-status
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
//
// =====================================================
router.get(
    "/hr-status",

    // DEBUG
    (req, res, next) => {

        console.log("");
        console.log("🔥🔥🔥 HR-STATUS ROUTE HIT 🔥🔥🔥");
        console.log("URL:", req.originalUrl);
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
        console.log("USER BEFORE ROLE:", req.user);
        console.log("🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥");

        next();
    },

    roleMiddleware([
        ROLES.HR,
        ROLES.ADMIN
    ]),

    feedbackController.getFeedbackStatusForHR
);
// =====================================================
// HR + ADMIN - VIEW FEEDBACK DETAILS
// =====================================================
//
// GET:
// /feedbacks/hr-details
//
// Query:
// survey_id
// from_department_id
// to_department_id
//
// =====================================================

router.get(
    "/hr-details",
    roleMiddleware([
        ROLES.HR,
        ROLES.ADMIN
    ]),
    feedbackController.getFeedbackDetailsForHR
);


// =====================================================
// ADMIN + HOD - GET FEEDBACK BY ID
// IMPORTANT:
// THIS MUST BE LAST
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