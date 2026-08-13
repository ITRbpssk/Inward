const express = require("express");

const router = express.Router();

const surveyController =
    require("../controllers/survey.controller");

const authMiddleware =
    require("../middlewares/auth.middleware");

const roleMiddleware =
    require("../middlewares/role.middleware");

const ROLES =
    require("../constants/roles");


router.use(authMiddleware);


// =====================================================
// ACTIVE SURVEY
// ADMIN + HOD + HR
// =====================================================

router.get(
    "/active",
    roleMiddleware([
        ROLES.ADMIN,
        ROLES.HOD,
        ROLES.HR
    ]),
    surveyController.getActiveSurvey
);


// =====================================================
// SURVEY CRUD
// ADMIN ONLY
// =====================================================

router.get(
    "/",
    roleMiddleware([
        ROLES.ADMIN
    ]),
    surveyController.getAllSurveys
);


router.get(
    "/:id",
    roleMiddleware([
        ROLES.ADMIN
    ]),
    surveyController.getSurveyById
);


router.post(
    "/",
    roleMiddleware([
        ROLES.ADMIN
    ]),
    surveyController.createSurvey
);


router.put(
    "/:id",
    roleMiddleware([
        ROLES.ADMIN
    ]),
    surveyController.updateSurvey
);


router.delete(
    "/:id",
    roleMiddleware([
        ROLES.ADMIN
    ]),
    surveyController.deleteSurvey
);


module.exports = router;