const express = require("express");
const router = express.Router();
const feedbackController = require("../controllers/feedback.controller");
const authMiddleware = require("../middlewares/auth.middleware");
const roleMiddleware = require("../middlewares/role.middleware");
const ROLES = require("../constants/roles");

router.use(authMiddleware);

// Only HODs can save drafts or submit feedbacks
router.post("/", roleMiddleware([ROLES.HOD]), feedbackController.submitOrSaveFeedback);

// HODs check feedback status list (completed vs pending mapped targets)
router.get("/status", roleMiddleware([ROLES.HOD]), feedbackController.getFeedbackStatusForHOD);

// HODs retrieve feedback details (for specific survey and target department)
router.get("/details", roleMiddleware([ROLES.HOD]), feedbackController.getFeedbackDetails);

// Admin & HOD can fetch specific feedback by ID
router.get("/:id", roleMiddleware([ROLES.ADMIN, ROLES.HOD]), feedbackController.getFeedbackById);

module.exports = router;
