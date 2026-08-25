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
// ADMIN + HOD
// =====================================================

router.get(
    "/active",

    roleMiddleware([
        ROLES.ADMIN,
        ROLES.HOD
    ]),

    surveyController.getActiveSurvey
);


// =====================================================
// MY ASSIGNED SURVEYS
// HOD ONLY
// =====================================================

router.get(
    "/my-surveys",

    roleMiddleware([
        ROLES.HOD
    ]),

    surveyController.getMySurveys
);


// =====================================================
// GET ALL SURVEYS
// ADMIN + HOD
// =====================================================

router.get(
    "/",

    roleMiddleware([
        ROLES.ADMIN,
        ROLES.HOD
    ]),

    surveyController.getAllSurveys
);


// =====================================================
// GET SURVEY BY ID
// ADMIN + HOD
// =====================================================

router.get(
    "/:id",

    roleMiddleware([
        ROLES.ADMIN,
        ROLES.HOD
    ]),

    surveyController.getSurveyById
);


// =====================================================
// CREATE SURVEY
// ADMIN + HOD
// =====================================================

router.post(
    "/",

    roleMiddleware([
        ROLES.ADMIN,
        ROLES.HOD
    ]),

    surveyController.createSurvey
);


// =====================================================
// UPDATE SURVEY
// ADMIN + HOD
// =====================================================

router.put(
    "/:id",

    roleMiddleware([
        ROLES.ADMIN,
        ROLES.HOD
    ]),

    surveyController.updateSurvey
);


// =====================================================
// DELETE SURVEY
// ADMIN ONLY
// =====================================================

router.delete(
    "/:id",

    roleMiddleware([
        ROLES.ADMIN
    ]),

    surveyController.deleteSurvey
);


module.exports = router;