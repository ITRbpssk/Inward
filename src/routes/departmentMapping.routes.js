const express =
    require("express");

const router =
    express.Router();


const departmentMappingController =
    require("../controllers/departmentMapping.controller");


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
// HOD - RECEIVED EVALUATIONS
// =====================================================

router.get(
    "/my-evaluators",

    roleMiddleware([
        ROLES.HOD
    ]),

    departmentMappingController
        .getEvaluatorsForMyDepartment
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
// ADMIN - GENERAL DEPARTMENT MAPPINGS
// =====================================================

router.get(
    "/general",

    roleMiddleware([
        ROLES.ADMIN
    ]),

    departmentMappingController
        .getGeneralMappings
);


// =====================================================
// ADMIN - SURVEY BULK
// =====================================================

router.post(
    "/bulk",

    roleMiddleware([
        ROLES.ADMIN
    ]),

    activityMiddleware,

    departmentMappingController
        .createBulkMappings
);


// =====================================================
// ADMIN - GENERAL DEPARTMENT BULK
// =====================================================

router.post(
    "/department-bulk",

    roleMiddleware([
        ROLES.ADMIN
    ]),

    activityMiddleware,

    departmentMappingController
        .createDepartmentBulkMappings
);


// =====================================================
// ADMIN + HOD - GET MAPPINGS BY SURVEY
// =====================================================

router.get(
    "/survey/:surveyId",

    roleMiddleware([
        ROLES.ADMIN,
        ROLES.HOD
    ]),

    departmentMappingController
        .getMappingsBySurveyId
);


// =====================================================
// ADMIN + HOD - UPDATE ALL SURVEY MAPPINGS
// =====================================================

router.put(
    "/survey/:surveyId",

    roleMiddleware([
        ROLES.ADMIN,
        ROLES.HOD
    ]),

    activityMiddleware,

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
// ADMIN - CREATE SINGLE
// =====================================================

router.post(
    "/",

    roleMiddleware([
        ROLES.ADMIN
    ]),

    activityMiddleware,

    departmentMappingController
        .createMapping
);


// =====================================================
// ADMIN - UPDATE SINGLE
// =====================================================

router.put(
    "/:id",

    roleMiddleware([
        ROLES.ADMIN
    ]),

    activityMiddleware,

    departmentMappingController
        .updateMapping
);


// =====================================================
// ADMIN - DELETE SINGLE
// =====================================================

router.delete(
    "/:id",

    roleMiddleware([
        ROLES.ADMIN
    ]),

    activityMiddleware,

    departmentMappingController
        .deleteMapping
);


// =====================================================
// EXPORT
// =====================================================

module.exports =
    router;