const express = require("express");
const router = express.Router();
const departmentMappingController = require("../controllers/departmentMapping.controller");
const authMiddleware = require("../middlewares/auth.middleware");
const roleMiddleware = require("../middlewares/role.middleware");
const ROLES = require("../constants/roles");

router.use(authMiddleware);

// HOD user checking their own target departments to review
router.get("/my-targets", roleMiddleware([ROLES.HOD]), departmentMappingController.getMyEvaluationTargets);

// Admin-only routing for all mappings CRUD
router.get("/", roleMiddleware([ROLES.ADMIN]), departmentMappingController.getAllMappings);

router.post(
    "/bulk",
    roleMiddleware([ROLES.ADMIN]),
    departmentMappingController.createBulkMappings
);
router.get("/:id", roleMiddleware([ROLES.ADMIN]), departmentMappingController.getMappingById);

router.post("/", roleMiddleware([ROLES.ADMIN]), departmentMappingController.createMapping);
router.put("/:id", roleMiddleware([ROLES.ADMIN]), departmentMappingController.updateMapping);
router.delete("/:id", roleMiddleware([ROLES.ADMIN]), departmentMappingController.deleteMapping);

module.exports = router;
