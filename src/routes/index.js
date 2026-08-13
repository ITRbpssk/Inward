const express = require("express");
const router = express.Router();
console.log("✅ Routes index loaded");

const authRoutes = require("./auth.routes");
const userRoutes = require("./user.routes");
const departmentRoutes = require("./department.routes");
const departmentMappingRoutes = require("./departmentMapping.routes");
const surveyRoutes = require("./survey.routes");
const parameterRoutes = require("./parameter.routes");
const feedbackRoutes = require("./feedback.routes");
const dashboardRoutes = require("./dashboard.routes");
const reportRoutes = require("./report.routes");
const surveyDepartmentRoutes = require("./surveyDepartment.routes");
const roleRoutes = require("./role.routes");

// Route mappings
router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/departments", departmentRoutes);
router.use("/mappings", departmentMappingRoutes);
router.use("/surveys", surveyRoutes);
router.use("/parameters", parameterRoutes);
router.use("/feedbacks", feedbackRoutes);
router.use("/dashboard", dashboardRoutes);
router.use("/reports", reportRoutes);
router.use("/survey-departments", surveyDepartmentRoutes);
router.use("/roles", roleRoutes);

module.exports = router;
