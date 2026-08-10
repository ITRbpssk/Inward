const express = require("express");

const router = express.Router();

console.log("✅ Survey Department routes loaded");

const surveyDepartmentController =
    require("../controllers/surveyDepartment.controller");

const authMiddleware =
    require("../middlewares/auth.middleware");

const roleMiddleware =
    require("../middlewares/role.middleware");

const ROLES =
    require("../constants/roles");


router.use(authMiddleware);


// Get eligible departments for a survey
router.get(
    "/:surveyId",
    roleMiddleware([ROLES.ADMIN]),
    surveyDepartmentController.getDepartmentsBySurvey
);


// Save / Update eligible departments for a survey
router.put(
    "/:surveyId",
    roleMiddleware([ROLES.ADMIN]),
    surveyDepartmentController.updateSurveyDepartments
);


module.exports = router;