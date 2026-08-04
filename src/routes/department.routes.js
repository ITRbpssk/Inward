const express = require("express");
const router = express.Router();
const departmentController = require("../controllers/department.controller");
const authMiddleware = require("../middlewares/auth.middleware");
const roleMiddleware = require("../middlewares/role.middleware");
const ROLES = require("../constants/roles");

router.use(authMiddleware);

// Admin can modify department list
router.post("/", roleMiddleware([ROLES.ADMIN]), departmentController.createDepartment);
router.put("/:id", roleMiddleware([ROLES.ADMIN]), departmentController.updateDepartment);
router.delete("/:id", roleMiddleware([ROLES.ADMIN]), departmentController.deleteDepartment);

// Admin and HOD can view department list
router.get("/", roleMiddleware([ROLES.ADMIN, ROLES.HOD]), departmentController.getAllDepartments);
router.get("/:id", roleMiddleware([ROLES.ADMIN, ROLES.HOD]), departmentController.getDepartmentById);

module.exports = router;
