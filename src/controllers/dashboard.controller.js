const dashboardService = require("../services/dashboard.service");
const ApiResponse = require("../utils/ApiResponse");

const getSummary = async (req, res, next) => {
    try {
        const { survey_id } = req.query;
        const summary = await dashboardService.getSummary(survey_id);
        res.status(200).json(new ApiResponse(200, summary, "Summary stats fetched successfully"));
    } catch (error) {
        next(error);
    }
};

const getDepartmentAnalytics = async (req, res, next) => {
    try {
        const { survey_id } = req.query;
        const analytics = await dashboardService.getDepartmentAnalytics(survey_id);
        res.status(200).json(new ApiResponse(200, analytics, "Department analytics fetched successfully"));
    } catch (error) {
        next(error);
    }
};

const getDepartmentDetailedAnalytics = async (req, res, next) => {
    try {
        const { survey_id, department_id } = req.query;
        const details = await dashboardService.getDepartmentDetailedAnalytics(survey_id, department_id);
        res.status(200).json(new ApiResponse(200, details, "Detailed department analytics fetched successfully"));
    } catch (error) {
        next(error);
    }
};

const getMatrix = async (req, res, next) => {
    try {
        const { survey_id } = req.query;
        const matrix = await dashboardService.getMatrix(survey_id);
        res.status(200).json(new ApiResponse(200, matrix, "Feedback matrix fetched successfully"));
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getSummary,
    getDepartmentAnalytics,
    getDepartmentDetailedAnalytics,
    getMatrix
};
