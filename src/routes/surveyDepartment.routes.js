const express = require("express");

const router = express.Router();

console.log("✅ Survey Department routes loaded");

const surveyDepartmentController =
    require("../controllers/surveyDepartment.controller");

const authMiddleware =
    require("../middlewares/auth.middleware");

const activityMiddleware =
    require("../middlewares/activity.middleware");

const roleMiddleware =
    require("../middlewares/role.middleware");

const ROLES =
    require("../constants/roles");


router.use(authMiddleware);


// =====================================================
// GET ELIGIBLE DEPARTMENTS FOR A SURVEY
//
// ADMIN + HOD
// =====================================================

router.get(
    "/:surveyId",

    roleMiddleware([
        ROLES.ADMIN,
        ROLES.HOD
    ]),

    surveyDepartmentController.getDepartmentsBySurvey
);


// =====================================================
// SAVE / UPDATE ELIGIBLE DEPARTMENTS FOR A SURVEY
//
// ADMIN + HOD
// =====================================================

router.put(
    "/:surveyId",

    roleMiddleware([
        ROLES.ADMIN,
        ROLES.HOD
    ]),

    activityMiddleware,

    surveyDepartmentController.updateSurveyDepartments
);


// =====================================================
// EXPORT
// =====================================================

module.exports = router;