const dashboardRepository = require("../repositories/dashboard.repository");
const surveyRepository = require("../repositories/survey.repository");
const ApiError = require("../utils/ApiError");

class DashboardService {
    /**
     * Helper to resolve surveyId. If empty, falls back to active survey, then to the latest survey.
     */
    async resolveSurveyId(surveyId) {
        if (surveyId) {
            return parseInt(surveyId);
        }

        const activeSurvey = await surveyRepository.findActiveSurvey();
        if (activeSurvey) {
            return activeSurvey.survey_id;
        }

        const allSurveys = await surveyRepository.findAll();
        if (allSurveys.length > 0) {
            return allSurveys[0].survey_id;
        }

        return null;
    }

    async getSummary(surveyId) {
        const resolvedId = await this.resolveSurveyId(surveyId);
        if (!resolvedId) {
            return {
                total_departments: 0,
                expected_feedbacks: 0,
                total_feedbacks: 0,
                submitted_feedbacks: 0,
                draft_feedbacks: 0,
                overall_average_score: 0,
                survey_info: null
            };
        }

        const surveyInfo = await surveyRepository.findById(resolvedId);
        const metrics = await dashboardRepository.getSummaryMetrics(resolvedId);

        return {
            ...metrics,
            survey_info: surveyInfo
        };
    }

    async getDepartmentAnalytics(surveyId) {
        const resolvedId = await this.resolveSurveyId(surveyId);
        if (!resolvedId) {
            return [];
        }

        return await dashboardRepository.getDepartmentWiseScores(resolvedId);
    }


    // =====================================================
    // DEPARTMENT EVALUATION OVERVIEW
    // =====================================================

    async getDepartmentEvaluationOverview(surveyId) {

        const resolvedId =
            await this.resolveSurveyId(surveyId);


        if (!resolvedId) {
            return [];
        }


        return await dashboardRepository
            .getDepartmentEvaluationOverview(resolvedId);

    }

    async getDepartmentDetailedAnalytics(surveyId, departmentId) {
        const resolvedId = await this.resolveSurveyId(surveyId);
        if (!resolvedId) {
            throw new ApiError(400, "No survey data exists");
        }

        if (!departmentId) {
            throw new ApiError(400, "departmentId is required");
        }

        // Get parameter-wise ratings
        const parameterScores = await dashboardRepository.getDepartmentParameterScores(resolvedId, departmentId);

        return {
            survey_id: resolvedId,
            department_id: parseInt(departmentId),
            parameter_scores: parameterScores
        };
    }

    async getMatrix(surveyId) {
        const resolvedId = await this.resolveSurveyId(surveyId);
        if (!resolvedId) {
            return {
                matrix: [],
                departments: []
            };
        }

        const rawMatrix = await dashboardRepository.getFeedbackMatrix(resolvedId);

        // Find all departments involved
        const depts = await dashboardRepository.getDepartmentWiseScores(resolvedId);
        const deptCodes = depts.map(d => d.department_code);

        return {
            matrix: rawMatrix,
            departments: deptCodes
        };
    }
}

module.exports = new DashboardService();
