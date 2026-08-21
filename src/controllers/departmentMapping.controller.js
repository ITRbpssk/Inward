const departmentMappingService =
    require("../services/departmentMapping.service");

const ApiResponse =
    require("../utils/ApiResponse");


// =====================================================
// GET ALL MAPPINGS
// =====================================================

const getAllMappings =
    async (req, res, next) => {

        try {

            const mappings =
                await departmentMappingService
                    .getAllMappings();


            res.status(200).json(
                new ApiResponse(
                    200,
                    mappings,
                    "Department mappings fetched successfully"
                )
            );

        } catch (error) {

            next(error);
        }
    };


// =====================================================
// GET MAPPING BY ID
// =====================================================

const getMappingById =
    async (req, res, next) => {

        try {

            const mapping =
                await departmentMappingService
                    .getMappingById(
                        req.params.id
                    );


            res.status(200).json(
                new ApiResponse(
                    200,
                    mapping,
                    "Department mapping fetched successfully"
                )
            );

        } catch (error) {

            next(error);
        }
    };


// =====================================================
// CREATE SINGLE MAPPING
// =====================================================

const createMapping =
    async (req, res, next) => {

        try {

            const mapping =
                await departmentMappingService
                    .createMapping(
                        req.body
                    );


            res.status(201).json(
                new ApiResponse(
                    201,
                    mapping,
                    "Department mapping created successfully"
                )
            );

        } catch (error) {

            next(error);
        }
    };


// =====================================================
// CREATE BULK MAPPINGS
// =====================================================

const createBulkMappings =
    async (req, res, next) => {

        try {

            console.log(
                "CREATE SURVEY MAPPING:",
                req.body
            );


            const mappings =
                await departmentMappingService
                    .createBulkMappings(
                        req.body
                    );


            res.status(201).json(
                new ApiResponse(
                    201,
                    mappings,
                    "Department mappings created successfully"
                )
            );

        } catch (error) {

            next(error);
        }
    };


// =====================================================
// UPDATE / REPLACE SURVEY MAPPINGS
// =====================================================

const updateSurveyMappings =
    async (req, res, next) => {

        try {

            console.log(
                "UPDATE SURVEY MAPPINGS:",
                req.body
            );


            const mappings =
                await departmentMappingService
                    .updateSurveyMappings(
                        req.body
                    );


            res.status(200).json(
                new ApiResponse(
                    200,
                    mappings,
                    "Survey department mappings updated successfully"
                )
            );

        } catch (error) {

            next(error);
        }
    };


// =====================================================
// GET MAPPINGS BY SURVEY
// =====================================================

const getMappingsBySurveyId =
    async (req, res, next) => {

        try {

            const mappings =
                await departmentMappingService
                    .getMappingsBySurveyId(
                        req.params.surveyId
                    );


            res.status(200).json(
                new ApiResponse(
                    200,
                    mappings,
                    "Survey department mappings fetched successfully"
                )
            );

        } catch (error) {

            next(error);
        }
    };


// =====================================================
// UPDATE SINGLE MAPPING
// =====================================================

const updateMapping =
    async (req, res, next) => {

        try {

            const mapping =
                await departmentMappingService
                    .updateMapping(
                        req.params.id,
                        req.body
                    );


            res.status(200).json(
                new ApiResponse(
                    200,
                    mapping,
                    "Department mapping updated successfully"
                )
            );

        } catch (error) {

            next(error);
        }
    };


// =====================================================
// DELETE MAPPING
// =====================================================

const deleteMapping =
    async (req, res, next) => {

        try {

            await departmentMappingService
                .deleteMapping(
                    req.params.id
                );


            res.status(200).json(
                new ApiResponse(
                    200,
                    null,
                    "Department mapping deleted successfully"
                )
            );

        } catch (error) {

            next(error);
        }
    };


// =====================================================
// HOD - MY TARGETS
// =====================================================

const getMyEvaluationTargets =
    async (req, res, next) => {

        try {

            const surveyId =
                req.query.survey_id;

            const fromDeptId =
                req.user.department_id;


            const targets =
                await departmentMappingService
                    .getMappedToDepartments(
                        surveyId,
                        fromDeptId
                    );


            res.status(200).json(
                new ApiResponse(
                    200,
                    targets,
                    "Evaluation target departments fetched successfully"
                )
            );

        } catch (error) {

            next(error);
        }
    };


module.exports = {

    getAllMappings,

    getMappingById,

    createMapping,

    createBulkMappings,

    updateSurveyMappings,

    getMappingsBySurveyId,

    updateMapping,

    deleteMapping,

    getMyEvaluationTargets

};