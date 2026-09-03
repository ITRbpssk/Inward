const express = require("express");

const router = express.Router();

const parameterController =
    require("../controllers/parameter.controller");

const authMiddleware =
    require("../middlewares/auth.middleware");

const activityMiddleware =
    require("../middlewares/activity.middleware");

const roleMiddleware =
    require("../middlewares/role.middleware");

const ROLES =
    require("../constants/roles");


router.use(
    authMiddleware
);


// =====================================================
// ADMIN - CREATE EVALUATION PARAMETER
// =====================================================

router.post(
    "/",

    roleMiddleware([
        ROLES.ADMIN
    ]),

    activityMiddleware,

    parameterController.createParameter
);


// =====================================================
// ADMIN - UPDATE EVALUATION PARAMETER
// =====================================================

router.put(
    "/:id",

    roleMiddleware([
        ROLES.ADMIN
    ]),

    activityMiddleware,

    parameterController.updateParameter
);


// =====================================================
// ADMIN - DELETE EVALUATION PARAMETER
// =====================================================

router.delete(
    "/:id",

    roleMiddleware([
        ROLES.ADMIN
    ]),

    activityMiddleware,

    parameterController.deleteParameter
);


// =====================================================
// ADMIN + HOD - VIEW PARAMETERS
// =====================================================

router.get(
    "/",

    roleMiddleware([
        ROLES.ADMIN,
        ROLES.HOD
    ]),

    parameterController.getAllParameters
);


router.get(
    "/:id",

    roleMiddleware([
        ROLES.ADMIN,
        ROLES.HOD
    ]),

    parameterController.getParameterById
);


// =====================================================
// EXPORT
// =====================================================

module.exports = router;