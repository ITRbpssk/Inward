const surveyService = require("../services/survey.service");
const ApiResponse = require("../utils/ApiResponse");

const getAllSurveys = async (req, res, next) => {
    try {
        const surveys = await surveyService.getAllSurveys();
        res.status(200).json(new ApiResponse(200, surveys, "Surveys fetched successfully"));
    } catch (error) {
        next(error);
    }
};

const getSurveyById = async (req, res, next) => {
    try {
        const survey = await surveyService.getSurveyById(req.params.id);
        res.status(200).json(new ApiResponse(200, survey, "Survey fetched successfully"));
    } catch (error) {
        next(error);
    }
};

const getActiveSurvey = async (req, res, next) => {
    try {
        const survey = await surveyService.getActiveSurvey();
        res.status(200).json(new ApiResponse(200, survey, "Active survey fetched successfully"));
    } catch (error) {
        next(error);
    }
};




const getMySurveys = async (req, res, next) => {

    try {

        const departmentId =
            req.user.department_id;

        const surveys =
            await surveyService
                .getMySurveys(departmentId);

        res.status(200).json(
            new ApiResponse(
                200,
                surveys,
                "Assigned surveys fetched successfully"
            )
        );

    } catch (error) {

        next(error);

    }

};



const createSurvey = async (req, res, next) => {
    try {
        const survey = await surveyService.createSurvey(req.body);
        res.status(201).json(new ApiResponse(201, survey, "Survey created successfully"));
    } catch (error) {
        next(error);
    }
};

const updateSurvey = async (req, res, next) => {

    try {

        console.log("Survey ID:", req.params.id);
        console.log("Request Body:", req.body);

        const survey = await surveyService.updateSurvey(
            req.params.id,
            req.body
        );

        res.status(200).json(
            new ApiResponse(200, survey, "Survey updated successfully")
        );

    } catch (error) {

        console.error("Update Survey Error:", error);

        next(error);

    }

};
const deleteSurvey = async (req, res, next) => {
    try {
        await surveyService.deleteSurvey(req.params.id);
        res.status(200).json(new ApiResponse(200, null, "Survey deleted successfully"));
    } catch (error) {
        next(error);
    }
};

module.exports = {

    getAllSurveys,

    getSurveyById,

    getActiveSurvey,

    getMySurveys,

    createSurvey,

    updateSurvey,

    deleteSurvey

};