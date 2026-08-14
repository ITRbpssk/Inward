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
// HR - VIEW DEPARTMENT EVALUATIONS
// =====================================================

router.get(
    "/hr-status",
    roleMiddleware([
        ROLES.HR
    ]),
    feedbackController.getFeedbackStatusForHR
);


// =====================================================
// HR - VIEW FEEDBACK DETAILS
// =====================================================

router.get(
    "/hr-details",
    roleMiddleware([
        ROLES.HR
    ]),
    feedbackController.getFeedbackDetailsForHR
);


// =====================================================
// ADMIN + HOD - GET FEEDBACK BY ID
// IMPORTANT: THIS MUST BE LAST
// =====================================================

router.get(
    "/:id",
    roleMiddleware([
        ROLES.ADMIN,
        ROLES.HOD
    ]),
    feedbackController.getFeedbackById
);


module.exports = router;