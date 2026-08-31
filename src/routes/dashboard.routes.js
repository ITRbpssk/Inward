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
// GENERAL EVALUATION OVERVIEW
//
// GET:
// /dashboard/evaluations
//
// Query:
// ?targetDepartmentId=4
// &quarter=Q1
// =====================================================

router.get(

    "/evaluations",

    dashboardController.getEvaluationOverview

);


// =====================================================
// SPECIAL EVALUATION OVERVIEW
//
// GET:
// /dashboard/special-evaluations
//
// Query:
// ?targetDepartmentId=4
//
// IMPORTANT:
// NO QUARTER
// =====================================================

router.get(

    "/special-evaluations",

    dashboardController.getSpecialEvaluationOverview

);


// =====================================================
// VIEW RATING
//
// GET:
// /dashboard/rating/12
// =====================================================

router.get(

    "/rating/:feedbackId",

    dashboardController.getRatingDetails

);


module.exports =
    router;