const express =
    require("express");

const router =
    express.Router();


const departmentMappingController =
    require("../controllers/departmentMapping.controller");


const authMiddleware =
    require("../middlewares/auth.middleware");


const roleMiddleware =
    require("../middlewares/role.middleware");


const ROLES =
    require("../constants/roles");


router.use(
    authMiddleware
);


// =====================================================
// HOD - MY TARGET DEPARTMENTS
// =====================================================

router.get(
    "/my-targets",

    roleMiddleware([
        ROLES.HOD
    ]),

    departmentMappingController
        .getMyEvaluationTargets
);


// =====================================================
// ADMIN - ALL MAPPINGS
// =====================================================

router.get(
    "/",

    roleMiddleware([
        ROLES.ADMIN
    ]),

    departmentMappingController
        .getAllMappings
);


// =====================================================
// ADMIN - CREATE BULK MAPPINGS
// =====================================================

router.post(
    "/bulk",

    roleMiddleware([
        ROLES.ADMIN
    ]),

    departmentMappingController
        .createBulkMappings
);


// =====================================================
// ADMIN - GET MAPPINGS BY SURVEY
//
// MUST COME BEFORE /:id
// =====================================================

router.get(
    "/survey/:surveyId",

    roleMiddleware([
        ROLES.ADMIN
    ]),

    departmentMappingController
        .getMappingsBySurveyId
);


// =====================================================
// ADMIN - UPDATE ALL MAPPINGS OF SURVEY
//
// USED BY EDIT SURVEY
// =====================================================

router.put(
    "/survey/:surveyId",

    roleMiddleware([
        ROLES.ADMIN
    ]),

    departmentMappingController
        .updateSurveyMappings
);


// =====================================================
// ADMIN - GET SINGLE MAPPING
// =====================================================

router.get(
    "/:id",

    roleMiddleware([
        ROLES.ADMIN
    ]),

    departmentMappingController
        .getMappingById
);


// =====================================================
// ADMIN - CREATE SINGLE MAPPING
// =====================================================

router.post(
    "/",

    roleMiddleware([
        ROLES.ADMIN
    ]),

    departmentMappingController
        .createMapping
);


// =====================================================
// ADMIN - UPDATE SINGLE MAPPING
// =====================================================

router.put(
    "/:id",

    roleMiddleware([
        ROLES.ADMIN
    ]),

    departmentMappingController
        .updateMapping
);


// =====================================================
// ADMIN - DELETE SINGLE MAPPING
// =====================================================

router.delete(
    "/:id",

    roleMiddleware([
        ROLES.ADMIN
    ]),

    departmentMappingController
        .deleteMapping
);


module.exports =
    router;