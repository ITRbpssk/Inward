const express = require("express");

const router = express.Router();

const specialParameterController =
    require("../controllers/specialParameter.controller");

const authMiddleware =
    require("../middlewares/auth.middleware");

const activityMiddleware =
    require("../middlewares/activity.middleware");

const roleMiddleware =
    require("../middlewares/role.middleware");

const ROLES =
    require("../constants/roles");


// =====================================================
// AUTHENTICATION
// =====================================================

router.use(authMiddleware);


// =====================================================
// GET SPECIAL PARAMETERS BY SURVEY
//
// ADMIN + HOD
//
// GET:
// /api/v1/special-parameters/survey/:surveyId
// =====================================================

router.get(
    "/survey/:surveyId",

    roleMiddleware([
        ROLES.ADMIN,
        ROLES.HOD
    ]),

    specialParameterController
        .getParametersBySurvey
);


// =====================================================
// GET SINGLE SPECIAL PARAMETER
//
// ADMIN + HOD
//
// GET:
// /api/v1/special-parameters/:id
// =====================================================

router.get(
    "/:id",

    roleMiddleware([
        ROLES.ADMIN,
        ROLES.HOD
    ]),

    specialParameterController
        .getParameterById
);


// =====================================================
// CREATE SPECIAL PARAMETER
//
// ADMIN + HOD
//
// POST:
// /api/v1/special-parameters/survey/:surveyId
// =====================================================

router.post(
    "/survey/:surveyId",

    roleMiddleware([
        ROLES.ADMIN,
        ROLES.HOD
    ]),

    activityMiddleware,

    specialParameterController
        .createParameter
);


// =====================================================
// UPDATE SPECIAL PARAMETER
//
// ADMIN + HOD
//
// PUT:
// /api/v1/special-parameters/:id
// =====================================================

router.put(
    "/:id",

    roleMiddleware([
        ROLES.ADMIN,
        ROLES.HOD
    ]),

    activityMiddleware,

    specialParameterController
        .updateParameter
);


// =====================================================
// DELETE SPECIAL PARAMETER
//
// ADMIN + HOD
//
// DELETE:
// /api/v1/special-parameters/:id
// =====================================================

router.delete(
    "/:id",

    roleMiddleware([
        ROLES.ADMIN,
        ROLES.HOD
    ]),

    activityMiddleware,

    specialParameterController
        .deleteParameter
);


// =====================================================
// EXPORT
// =====================================================

module.exports = router;