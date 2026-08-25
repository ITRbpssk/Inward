const surveyService =
    require("../services/survey.service");

const ApiResponse =
    require("../utils/ApiResponse");


// =====================================================
// GET ALL SURVEYS
// =====================================================

const getAllSurveys =
    async (req, res, next) => {

        try {

            const surveys =
                await surveyService
                    .getAllSurveys(
                        req.user.user_id,
                        req.user.role_name
                    );

            res.status(200).json(

                new ApiResponse(
                    200,
                    surveys,
                    "Surveys fetched successfully"
                )

            );

        } catch (error) {

            next(error);

        }

    };


// =====================================================
// GET SURVEY BY ID
// =====================================================

const getSurveyById =
    async (req, res, next) => {

        try {

            const survey =
                await surveyService
                    .getSurveyById(
                        req.params.id
                    );


            res.status(200).json(

                new ApiResponse(
                    200,
                    survey,
                    "Survey fetched successfully"
                )

            );

        } catch (error) {

            next(error);

        }

    };


// =====================================================
// GET ONE ACTIVE SURVEY
//
// BACKWARD COMPATIBILITY
//
// Returns latest active survey.
// =====================================================

const getActiveSurvey =
    async (req, res, next) => {

        try {

            const survey =
                await surveyService
                    .getActiveSurvey();


            res.status(200).json(

                new ApiResponse(
                    200,
                    survey,
                    "Active survey fetched successfully"
                )

            );

        } catch (error) {

            next(error);

        }

    };


// =====================================================
// GET ALL ACTIVE SURVEYS
//
// Multiple active surveys supported.
// =====================================================

const getActiveSurveys =
    async (req, res, next) => {

        try {

            const surveys =
                await surveyService
                    .getActiveSurveys();


            res.status(200).json(

                new ApiResponse(
                    200,
                    surveys,
                    "Active surveys fetched successfully"
                )

            );

        } catch (error) {

            next(error);

        }

    };


// =====================================================
// GET MY SURVEYS
// =====================================================

const getMySurveys =
    async (req, res, next) => {

        try {

            const departmentId =
                req.user.department_id;

            const userId =
                req.user.user_id;

            const surveys =
                await surveyService
                    .getMySurveys(
                        departmentId,
                        userId
                    );


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


// =====================================================
// CREATE SURVEY
// =====================================================

const createSurvey =
    async (req, res, next) => {

        try {

            console.log("");
            console.log(
                "🔥 CREATE SURVEY REQUEST"
            );

            console.log(
                "REQUEST BODY:",
                req.body
            );


            const survey =
                await surveyService
                    .createSurvey(
                        req.body,
                        req.user.user_id
                    );


            console.log(
                "✅ SURVEY CREATED:",
                survey
            );


            res.status(201).json(

                new ApiResponse(
                    201,
                    survey,
                    "Survey created successfully"
                )

            );

        } catch (error) {

            console.error(
                "❌ CREATE SURVEY ERROR:",
                error
            );

            next(error);

        }

    };


// =====================================================
// UPDATE SURVEY
// =====================================================

const updateSurvey =
    async (req, res, next) => {

        try {

            console.log("");
            console.log(
                "========================================"
            );

            console.log(
                "🔥 UPDATE SURVEY REQUEST"
            );

            console.log(
                "SURVEY ID:",
                req.params.id
            );

            console.log(
                "REQUEST BODY:",
                req.body
            );

            console.log(
                "========================================"
            );


            const survey =
                await surveyService
                    .updateSurvey(
                        req.params.id,
                        req.body
                    );


            console.log(
                "✅ SURVEY UPDATED:"
            );

            console.log(
                survey
            );


            res.status(200).json(

                new ApiResponse(
                    200,
                    survey,
                    "Survey updated successfully"
                )

            );

        } catch (error) {

            console.error(
                "❌ UPDATE SURVEY ERROR:",
                error
            );

            next(error);

        }

    };


// =====================================================
// DELETE SURVEY
// =====================================================

const deleteSurvey =
    async (req, res, next) => {

        try {

            await surveyService
                .deleteSurvey(
                    req.params.id
                );


            res.status(200).json(

                new ApiResponse(
                    200,
                    null,
                    "Survey deleted successfully"
                )

            );

        } catch (error) {

            next(error);

        }

    };


// =====================================================
// EXPORT
// =====================================================

module.exports = {

    getAllSurveys,

    getSurveyById,

    getActiveSurvey,

    getActiveSurveys,

    getMySurveys,

    createSurvey,

    updateSurvey,

    deleteSurvey

};