const departmentMappingService =
    require("../services/departmentMapping.service");

const ApiResponse =
    require("../utils/ApiResponse");


// =====================================================
// GET ALL
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
// GET GENERAL MAPPINGS
// =====================================================

const getGeneralMappings =
    async (req, res, next) => {

        try {

            const mappings =
                await departmentMappingService
                    .getGeneralMappings();

            res.status(200).json(
                new ApiResponse(
                    200,
                    mappings,
                    "General department mappings fetched successfully"
                )
            );

        } catch (error) {

            next(error);

        }
    };


// =====================================================
// GET BY ID
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
// CREATE SINGLE
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
// CREATE SURVEY BULK
// =====================================================

const createBulkMappings =
    async (req, res, next) => {

        try {

            console.log(
                "🔥 CREATE SURVEY BULK MAPPING:"
            );

            console.log(
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

            console.error(
                "❌ CREATE SURVEY BULK MAPPING ERROR:",
                error
            );

            next(error);

        }
    };


// =====================================================
// CREATE GENERAL DEPARTMENT BULK
// =====================================================

const createDepartmentBulkMappings =
    async (req, res, next) => {

        try {

            console.log(
                "🔥 CREATE DEPARTMENT BULK MAPPING:"
            );

            console.log(
                req.body
            );


            const mappings =
                await departmentMappingService
                    .createDepartmentBulkMappings(
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

            console.error(
                "❌ CREATE DEPARTMENT BULK MAPPING ERROR:",
                error
            );

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
// UPDATE ALL SURVEY MAPPINGS
// =====================================================

const updateSurveyMappings =
    async (req, res, next) => {

        try {

            const {
                target_department_id,
                evaluating_department_ids,
                status
            } = req.body;


            const mappings =
                await departmentMappingService
                    .updateSurveyMappings(
                        req.params.surveyId,

                        target_department_id,

                        evaluating_department_ids,

                        status || "active"
                    );


            res.status(200).json(
                new ApiResponse(
                    200,
                    mappings,
                    "Survey mappings updated successfully"
                )
            );

        } catch (error) {

            next(error);

        }
    };


// =====================================================
// UPDATE SINGLE
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
// DELETE
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
// HOD TARGETS
// =====================================================
// =====================================================
// HOD TARGETS - SURVEY WISE
// =====================================================

const getMyEvaluationTargets =
    async (req, res, next) => {

        try {

            const fromDeptId =
                req.user.department_id;


            const surveyId =
                req.query.survey_id;


            const targets =
                await departmentMappingService
                    .getMappedToDepartments(
                        fromDeptId,
                        surveyId
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

    getGeneralMappings,

    getMappingById,

    createMapping,

    createBulkMappings,

    createDepartmentBulkMappings,

    getMappingsBySurveyId,

    updateSurveyMappings,

    updateMapping,

    deleteMapping,

    getMyEvaluationTargets

};