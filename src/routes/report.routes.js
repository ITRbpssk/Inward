const express = require("express");
const router = express.Router();
const reportController = require("../controllers/report.controller");
const authMiddleware = require("../middlewares/auth.middleware");
const roleMiddleware = require("../middlewares/role.middleware");
const ROLES = require("../constants/roles");

router.use(authMiddleware);
router.use(roleMiddleware([ROLES.ADMIN, ROLES.HOD]));

router.get("/excel", reportController.exportExcel);
router.get("/pdf", reportController.exportPDF);

module.exports = router;
