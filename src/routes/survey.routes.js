const express = require("express");
const router = express.Router();
const surveyController = require("../controllers/survey.controller");
const authMiddleware = require("../middlewares/auth.middleware");
const roleMiddleware = require("../middlewares/role.middleware");
const ROLES = require("../constants/roles");

router.use(authMiddleware);

// Get the currently active survey (HOD & Admin)
router.get("/active", roleMiddleware([ROLES.ADMIN, ROLES.HOD]), surveyController.getActiveSurvey);

// General survey CRUD (Admin only)
router.get("/", roleMiddleware([ROLES.ADMIN]), surveyController.getAllSurveys);
router.get("/:id", roleMiddleware([ROLES.ADMIN]), surveyController.getSurveyById);
router.post("/", roleMiddleware([ROLES.ADMIN]), surveyController.createSurvey);
router.put("/:id", roleMiddleware([ROLES.ADMIN]), surveyController.updateSurvey);
router.delete("/:id", roleMiddleware([ROLES.ADMIN]), surveyController.deleteSurvey);

module.exports = router;
