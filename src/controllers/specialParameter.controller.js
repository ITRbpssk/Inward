const specialParameterService =
    require("../services/specialParameter.service");

const ApiResponse =
    require("../utils/ApiResponse");


// =====================================================
// GET SPECIAL PARAMETERS BY SURVEY
// =====================================================

const getParametersBySurvey =
    async (req, res, next) => {

        try {

            const parameters =
                await specialParameterService
                    .getParametersBySurvey(
                        req.params.surveyId
                    );


            res
                .status(200)
                .json(
                    new ApiResponse(
                        200,
                        parameters,
                        "Special parameters fetched successfully"
                    )
                );

        } catch (error) {

            next(error);

        }

    };


// =====================================================
// GET SPECIAL PARAMETER BY ID
// =====================================================

const getParameterById =
    async (req, res, next) => {

        try {

            const parameter =
                await specialParameterService
                    .getParameterById(
                        req.params.id
                    );


            res
                .status(200)
                .json(
                    new ApiResponse(
                        200,
                        parameter,
                        "Special parameter fetched successfully"
                    )
                );

        } catch (error) {

            next(error);

        }

    };


// =====================================================
// CREATE SPECIAL PARAMETER
// =====================================================

const createParameter =
    async (req, res, next) => {

        try {

            const parameter =
                await specialParameterService
                    .createParameter(
                        req.params.surveyId,
                        req.body
                    );


            res
                .status(201)
                .json(
                    new ApiResponse(
                        201,
                        parameter,
                        "Special parameter created successfully"
                    )
                );

        } catch (error) {

            next(error);

        }

    };


// =====================================================
// UPDATE SPECIAL PARAMETER
// =====================================================

const updateParameter =
    async (req, res, next) => {

        try {

            const parameter =
                await specialParameterService
                    .updateParameter(
                        req.params.id,
                        req.body
                    );


            res
                .status(200)
                .json(
                    new ApiResponse(
                        200,
                        parameter,
                        "Special parameter updated successfully"
                    )
                );

        } catch (error) {

            next(error);

        }

    };


// =====================================================
// DELETE SPECIAL PARAMETER
// =====================================================

const deleteParameter =
    async (req, res, next) => {

        try {

            await specialParameterService
                .deleteParameter(
                    req.params.id
                );


            res
                .status(200)
                .json(
                    new ApiResponse(
                        200,
                        null,
                        "Special parameter deleted successfully"
                    )
                );

        } catch (error) {

            next(error);

        }

    };


module.exports = {

    getParametersBySurvey,

    getParameterById,

    createParameter,

    updateParameter,

    deleteParameter

};