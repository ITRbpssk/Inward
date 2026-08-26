const express =
    require("express");

const router =
    express.Router();

const dashboardController =
    require("../controllers/dashboard.controller");


// =====================================================
// TARGET DEPARTMENTS
// =====================================================

router.get(
    "/target-departments",
    dashboardController.getTargetDepartments
);


// =====================================================
// EVALUATION OVERVIEW
//
// Example:
//
// GET /dashboard/evaluations
// ?targetDepartmentId=1
// &quarter=Q1
// =====================================================

router.get(
    "/evaluations",
    dashboardController.getEvaluationOverview
);


// =====================================================
// VIEW RATING
//
// Example:
//
// GET /dashboard/rating/12
// =====================================================

router.get(
    "/rating/:feedbackId",
    dashboardController.getRatingDetails
);


module.exports =
    router;