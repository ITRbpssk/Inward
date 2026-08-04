const surveyRepository = require("../repositories/survey.repository");
const ApiError = require("../utils/ApiError");

class SurveyService {
    async getAllSurveys() {
        return await surveyRepository.findAll();
    }

    async getSurveyById(surveyId) {
        const survey = await surveyRepository.findById(surveyId);
        if (!survey) {
            throw new ApiError(404, "Survey not found");
        }
        return survey;
    }

    async getActiveSurvey() {
        const survey = await surveyRepository.findActiveSurvey();
        if (!survey) {
            throw new ApiError(404, "No active survey found at the moment");
        }
        return survey;
    }

    async createSurvey(surveyData) {
        const { survey_name, start_date, end_date, status } = surveyData;

        if (!survey_name || !start_date || !end_date) {
            throw new ApiError(400, "survey_name, start_date, and end_date are required");
        }

        if (new Date(start_date) > new Date(end_date)) {
            throw new ApiError(400, "start_date cannot be after end_date");
        }

        // If status is 'active', verify if there's already another active survey
        if (status === "active") {
            const activeSurvey = await surveyRepository.findActiveSurvey();
            if (activeSurvey) {
                throw new ApiError(400, `Another survey is currently active (ID: ${activeSurvey.survey_id}). Close it before activating a new one.`);
            }
        }

        const newId = await surveyRepository.create({
            survey_name,
            start_date,
            end_date,
            status
        });
        return await surveyRepository.findById(newId);
    }

    async updateSurvey(surveyId, surveyData) {
        const { survey_name, start_date, end_date, status } = surveyData;

        if (!survey_name || !start_date || !end_date) {
            throw new ApiError(400, "survey_name, start_date, and end_date are required");
        }

        if (new Date(start_date) > new Date(end_date)) {
            throw new ApiError(400, "start_date cannot be after end_date");
        }

        const survey = await surveyRepository.findById(surveyId);
        if (!survey) {
            throw new ApiError(404, "Survey not found");
        }

        // If activating, verify if there's another active survey
        if (status === "active" && survey.status !== "active") {
            const activeSurvey = await surveyRepository.findActiveSurvey();
            if (activeSurvey && activeSurvey.survey_id !== parseInt(surveyId)) {
                throw new ApiError(400, `Another survey is currently active (ID: ${activeSurvey.survey_id}). Close it before activating this one.`);
            }
        }

        await surveyRepository.update(surveyId, {
            survey_name,
            start_date,
            end_date,
            status: status || survey.status
        });
        return await surveyRepository.findById(surveyId);
    }

    async deleteSurvey(surveyId) {
        const survey = await surveyRepository.findById(surveyId);
        if (!survey) {
            throw new ApiError(404, "Survey not found");
        }
        return await surveyRepository.delete(surveyId);
    }
}

module.exports = new SurveyService();
