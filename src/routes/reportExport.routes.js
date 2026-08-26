const express =
    require("express");

const router =
    express.Router();

const reportExportController =
    require("../controllers/reportExport.controller");

const authMiddleware =
    require("../middlewares/auth.middleware");

const roleMiddleware =
    require("../middlewares/role.middleware");

const ROLES =
    require("../constants/roles");


console.log(
    "✅ REPORT EXPORT ROUTES LOADED"
);


// =====================================================
// AUTHENTICATION
// =====================================================

router.use(
    authMiddleware
);


// =====================================================
// HOD - GENERAL EXPORT
// =====================================================

router.get(
    "/hod/general/export",

    roleMiddleware([
        ROLES.HOD
    ]),

    reportExportController
        .exportHodGeneral
);


// =====================================================
// HOD - SPECIAL EXPORT
// =====================================================

router.get(
    "/hod/special/export",

    roleMiddleware([
        ROLES.HOD
    ]),

    reportExportController
        .exportHodSpecial
);


// =====================================================
// ADMIN - GENERAL EXPORT
// =====================================================

router.get(
    "/admin/general/export",

    roleMiddleware([
        ROLES.ADMIN
    ]),

    reportExportController
        .exportAdminGeneral
);


// =====================================================
// ADMIN - SPECIAL EXPORT
// =====================================================

router.get(
    "/admin/special/export",

    roleMiddleware([
        ROLES.ADMIN
    ]),

    reportExportController
        .exportAdminSpecial
);


module.exports =
    router;