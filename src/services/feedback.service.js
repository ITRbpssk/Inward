const feedbackRepository = require("../repositories/feedback.repository");
const feedbackDetailRepository = require("../repositories/feedbackDetail.repository");
const departmentMappingRepository = require("../repositories/departmentMapping.repository");
const surveyRepository = require("../repositories/survey.repository");
const parameterRepository = require("../repositories/parameter.repository");
const ApiError = require("../utils/ApiError");

class FeedbackService {
    async getFeedbackById(feedbackId) {
        const feedback = await feedbackRepository.findById(feedbackId);
        if (!feedback) {
            throw new ApiError(404, "Feedback record not found");
        }
        
        const details = await feedbackDetailRepository.findByFeedbackId(feedbackId);
        return {
            ...feedback,
            ratings: details
        };
    }

    async getFeedbackStatusForHOD(surveyId, fromDeptId) {
        if (!surveyId || !fromDeptId) {
            throw new ApiError(400, "surveyId and fromDeptId are required");
        }
        return await feedbackRepository.getFeedbackSubmissionStatus(surveyId, fromDeptId);
    }

    async getFeedbackDetails(surveyId, fromDeptId, toDeptId) {
        const feedback = await feedbackRepository.findBySurveyAndDepts(surveyId, fromDeptId, toDeptId);
        if (!feedback) {
            return null;
        }
        const ratings = await feedbackDetailRepository.findByFeedbackId(feedback.feedback_id);
        return {
            ...feedback,
            ratings
        };
    }

    async submitOrSaveFeedback(user, payload) {
        const { survey_id, to_department_id, overall_comment, ratings, status } = payload;

        if (!survey_id || !to_department_id || !ratings || !status) {
            throw new ApiError(400, "Required fields: survey_id, to_department_id, ratings, status");
        }

        if (status !== "draft" && status !== "submitted") {
            throw new ApiError(400, "Invalid status: must be 'draft' or 'submitted'");
        }

        // 1. Validate HOD Department
        const from_department_id = user.department_id;
        if (!from_department_id) {
            throw new ApiError(400, "The user does not belong to any department and cannot submit feedback.");
        }

        if (parseInt(from_department_id) === parseInt(to_department_id)) {
            throw new ApiError(400, "You cannot submit feedback to your own department.");
        }

        // 2. Validate Survey Active Status
        const activeSurvey = await surveyRepository.findActiveSurvey();
        if (!activeSurvey || activeSurvey.survey_id !== parseInt(survey_id)) {
            throw new ApiError(400, "Feedback can only be saved or submitted for a currently active survey.");
        }

        // 3. Validate Department Mapping (Permissions)
        const mapping = await departmentMappingRepository.findByFromAndTo(from_department_id, to_department_id);
        if (!mapping || mapping.status !== "active") {
            throw new ApiError(403, "You do not have mapping permission to evaluate this department.");
        }

        // 4. Check if feedback is already submitted
        let feedback = await feedbackRepository.findBySurveyAndDepts(survey_id, from_department_id, to_department_id);
        if (feedback && feedback.status === "submitted") {
            throw new ApiError(400, "Feedback has already been finalized and submitted. You cannot modify it.");
        }

        // 5. Gather Active Parameters to validate ratings
        const parameters = await parameterRepository.findAll();
        const activeParams = parameters.filter(p => p.status === "active");

        // 6. Validate Ratings Range & Details
        if (!Array.isArray(ratings)) {
            throw new ApiError(400, "ratings must be an array of parameter rating objects.");
        }

        for (const item of ratings) {
            const { parameter_id, rating } = item;
            if (!parameter_id || rating === undefined) {
                throw new ApiError(400, "Each rating object must contain parameter_id and rating.");
            }

            const paramExists = activeParams.find(p => p.parameter_id === parseInt(parameter_id));
            if (!paramExists) {
                throw new ApiError(400, `Parameter ID ${parameter_id} is invalid or inactive.`);
            }

            const rVal = parseInt(rating);
            if (isNaN(rVal) || rVal < 1 || rVal > 5) {
                throw new ApiError(400, "Ratings must be integers between 1 and 5 (inclusive).");
            }
        }

        // 7. If status is SUBMITTED, ensure all active parameters are rated
        if (status === "submitted") {
            const ratedParamIds = ratings.map(r => parseInt(r.parameter_id));
            const missingParams = activeParams.filter(ap => !ratedParamIds.includes(ap.parameter_id));
            
            if (missingParams.length > 0) {
                const missingNames = missingParams.map(mp => mp.parameter_name).join(", ");
                throw new ApiError(400, `Cannot submit. Missing ratings for parameters: ${missingNames}`);
            }
        }

        // 8. Create or Update the main Feedback row
        let feedbackId;
        if (!feedback) {
            feedbackId = await feedbackRepository.create({
                survey_id,
                from_department_id,
                to_department_id,
                submitted_by: user.user_id,
                overall_comment,
                status
            });
        } else {
            feedbackId = feedback.feedback_id;
            await feedbackRepository.update(feedbackId, {
                overall_comment,
                status
            });
        }

        // 9. Upsert Feedback Details (ratings)
        for (const item of ratings) {
            const { parameter_id, rating, comment } = item;
            await feedbackDetailRepository.upsert(feedbackId, parameter_id, rating, comment || null);
        }

        // 10. Fetch updated feedback details and return
        return await this.getFeedbackById(feedbackId);
    }
}

module.exports = new FeedbackService();
