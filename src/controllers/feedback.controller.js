const feedbackService = require("../services/feedback.service");
const ApiResponse = require("../utils/ApiResponse");

const getFeedbackById = async (req, res, next) => {
    try {
        const feedback = await feedbackService.getFeedbackById(req.params.id);
        res.status(200).json(new ApiResponse(200, feedback, "Feedback fetched successfully"));
    } catch (error) {
        next(error);
    }
};

const getFeedbackStatusForHOD = async (req, res, next) => {
    try {
        const { survey_id } = req.query;
        const fromDeptId = req.user.department_id;
        const status = await feedbackService.getFeedbackStatusForHOD(survey_id, fromDeptId);
        res.status(200).json(new ApiResponse(200, status, "Feedback status list fetched successfully"));
    } catch (error) {
        next(error);
    }
};

const getFeedbackDetails = async (req, res, next) => {
    try {
        const { survey_id, to_department_id } = req.query;
        const fromDeptId = req.user.department_id;
        const feedback = await feedbackService.getFeedbackDetails(survey_id, fromDeptId, to_department_id);
        res.status(200).json(new ApiResponse(200, feedback, "Feedback details fetched successfully"));
    } catch (error) {
        next(error);
    }
};

const submitOrSaveFeedback = async (req, res, next) => {
    try {
        const result = await feedbackService.submitOrSaveFeedback(req.user, req.body);
        const message = req.body.status === "submitted" ? "Feedback submitted successfully" : "Feedback draft saved successfully";
        res.status(200).json(new ApiResponse(200, result, message));
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getFeedbackById,
    getFeedbackStatusForHOD,
    getFeedbackDetails,
    submitOrSaveFeedback
};
