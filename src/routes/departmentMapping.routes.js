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
        ROLES.HOD,
        ROLES.HR
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
//
// survey.ts uses this.
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
// ADMIN - GENERAL DEPARTMENT BULK
//
// department-mapping.ts uses this.
// =====================================================

router.post(
    "/department-bulk",

    roleMiddleware([
        ROLES.ADMIN
    ]),

    departmentMappingController
        .createDepartmentBulkMappings
);


// =====================================================
// ADMIN - GET MAPPINGS BY SURVEY
//
// MUST COME BEFORE /:id
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
// ADMIN - UPDATE ALL SURVEY MAPPINGS
//
// USED BY EDIT SURVEY
// =====================================================

router.put(
    "/survey/:surveyId",

    roleMiddleware([
        ROLES.ADMIN,
         ROLES.HOD
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
// ADMIN - CREATE SINGLE
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
// ADMIN - UPDATE SINGLE
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
// ADMIN - DELETE SINGLE
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