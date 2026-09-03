const express = require("express");

const router = express.Router();

const departmentController =
    require("../controllers/department.controller");

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
// DEPARTMENT MANAGEMENT
// ADMIN ONLY
// =====================================================


// =====================================================
// CREATE DEPARTMENT
// =====================================================

router.post(
    "/",

    roleMiddleware([
        ROLES.ADMIN
    ]),

    activityMiddleware,

    departmentController.createDepartment
);


// =====================================================
// UPDATE DEPARTMENT
// =====================================================

router.put(
    "/:id",

    roleMiddleware([
        ROLES.ADMIN
    ]),

    activityMiddleware,

    departmentController.updateDepartment
);


// =====================================================
// DELETE DEPARTMENT
// =====================================================

router.delete(
    "/:id",

    roleMiddleware([
        ROLES.ADMIN
    ]),

    activityMiddleware,

    departmentController.deleteDepartment
);


// =====================================================
// DEPARTMENT VIEW
// ADMIN + HOD
// =====================================================


// =====================================================
// GET ALL DEPARTMENTS
// =====================================================

router.get(
    "/",

    roleMiddleware([
        ROLES.ADMIN,
        ROLES.HOD
    ]),

    departmentController.getAllDepartments
);


// =====================================================
// GET DEPARTMENT BY ID
// =====================================================

router.get(
    "/:id",

    roleMiddleware([
        ROLES.ADMIN,
        ROLES.HOD
    ]),

    departmentController.getDepartmentById
);


// =====================================================
// EXPORT
// =====================================================

module.exports = router;