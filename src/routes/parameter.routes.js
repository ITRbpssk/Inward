const express = require("express");
const router = express.Router();
const parameterController = require("../controllers/parameter.controller");
const authMiddleware = require("../middlewares/auth.middleware");
const roleMiddleware = require("../middlewares/role.middleware");
const ROLES = require("../constants/roles");

router.use(authMiddleware);

// Admin can modify evaluation parameters
router.post("/", roleMiddleware([ROLES.ADMIN]), parameterController.createParameter);
router.put("/:id", roleMiddleware([ROLES.ADMIN]), parameterController.updateParameter);
router.delete("/:id", roleMiddleware([ROLES.ADMIN]), parameterController.deleteParameter);

// HOD & Admin can view parameters
router.get("/", roleMiddleware([ROLES.ADMIN, ROLES.HOD,ROLES.HR]), parameterController.getAllParameters);
router.get("/:id", roleMiddleware([ROLES.ADMIN, ROLES.HOD,ROLES.HR]), parameterController.getParameterById);

module.exports = router;
