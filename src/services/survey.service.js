const surveyRepository =
    require("../repositories/survey.repository");

const departmentRepository =
    require("../repositories/department.repository");

const ApiError =
    require("../utils/ApiError");


class SurveyService {


    // =====================================================
    // GET ALL SURVEYS
    // =====================================================

    async getAllSurveys(
        userId,
        roleName
    ) {

        if (
            roleName === "ADMIN"
        ) {

            return await surveyRepository
                .findAll();

        }


        if (
            roleName === "HOD"
        ) {

            return await surveyRepository
                .findByCreatedBy(
                    userId
                );

        }


        return [];

    }


    // =====================================================
    // GET SURVEY BY ID
    // =====================================================

    async getSurveyById(
        surveyId
    ) {

        const survey =
            await surveyRepository
                .findById(
                    surveyId
                );


        if (!survey) {

            throw new ApiError(
                404,
                "Survey not found"
            );

        }


        return survey;

    }


    // =====================================================
    // GET ONE ACTIVE SURVEY
    // =====================================================

    async getActiveSurvey() {

        const survey =
            await surveyRepository
                .findActiveSurvey();


        if (!survey) {

            throw new ApiError(
                404,
                "No active survey found at the moment"
            );

        }


        return survey;

    }


    // =====================================================
    // GET ALL ACTIVE SURVEYS
    // =====================================================

    async getActiveSurveys() {

        return await surveyRepository
            .findActiveSurveys();

    }


    // =====================================================
    // GET MY SURVEYS
    // =====================================================

    async getMySurveys(
        departmentId,
        userId
    ) {

        if (
            !departmentId
        ) {

            throw new ApiError(
                400,
                "Department ID not found for current user"
            );

        }


        return await surveyRepository
            .findMySurveys(
                departmentId,
                userId
            );

    }


    // =====================================================
    // CREATE SURVEY
    // =====================================================

    async createSurvey(
        surveyData,
        created_by
    ) {

        let {

            survey_name,

            survey_type,

            start_date,

            end_date,

            status,

            target_department_id,

            evaluating_department_ids,

            special_parameters

        } = surveyData;


        // =================================================
        // DATE NORMALIZATION
        // =================================================

        if (
            start_date
        ) {

            start_date =
                String(
                    start_date
                )
                    .split("T")[0];

        }


        if (
            end_date
        ) {

            end_date =
                String(
                    end_date
                )
                    .split("T")[0];

        }


        // =================================================
        // SURVEY TYPE
        // =================================================

        survey_type =
            String(
                survey_type ||
                "general"
            )
                .toLowerCase()
                .trim();


        if (
            ![
                "general",
                "special"
            ].includes(
                survey_type
            )
        ) {

            throw new ApiError(
                400,
                "Invalid survey type"
            );

        }


        // =================================================
        // REQUIRED FIELDS
        // =================================================

        if (
            !survey_name ||
            !start_date ||
            !end_date
        ) {

            throw new ApiError(
                400,
                "survey_name, start_date, and end_date are required"
            );

        }


        // =================================================
        // TARGET DEPARTMENT
        // =================================================

        if (
            !target_department_id
        ) {

            throw new ApiError(
                400,
                "Target department is required"
            );

        }


        // =================================================
        // EVALUATORS
        // =================================================

        if (
            !Array.isArray(
                evaluating_department_ids
            ) ||
            evaluating_department_ids.length === 0
        ) {

            throw new ApiError(
                400,
                "At least one evaluating department is required"
            );

        }


        // =================================================
        // DATE VALIDATION
        // =================================================

        if (
            new Date(start_date) >
            new Date(end_date)
        ) {

            throw new ApiError(
                400,
                "start_date cannot be after end_date"
            );

        }


        // =================================================
        // IDS
        // =================================================

        const targetDepartmentId =
            Number(
                target_department_id
            );


        if (
            !Number.isInteger(
                targetDepartmentId
            ) ||
            targetDepartmentId <= 0
        ) {

            throw new ApiError(
                400,
                "Invalid target department ID"
            );

        }


        const evaluatorDepartmentIds =
            evaluating_department_ids
                .map(
                    id =>
                        Number(id)
                )
                .filter(
                    id =>
                        Number.isInteger(id) &&
                        id > 0
                );


        const uniqueEvaluatorIds =
            [
                ...new Set(
                    evaluatorDepartmentIds
                )
            ];


        // =================================================
        // SELF EVALUATION
        // =================================================

        if (
            uniqueEvaluatorIds.includes(
                targetDepartmentId
            )
        ) {

            throw new ApiError(
                400,
                "Target department cannot evaluate itself"
            );

        }


        // =================================================
        // VERIFY TARGET
        // =================================================

        const targetDepartment =
            await departmentRepository
                .findById(
                    targetDepartmentId
                );


        if (
            !targetDepartment
        ) {

            throw new ApiError(
                400,
                "Invalid target department"
            );

        }


        // =================================================
        // VERIFY EVALUATORS
        // =================================================

        for (
            const evaluatorId
            of uniqueEvaluatorIds
        ) {

            const evaluator =
                await departmentRepository
                    .findById(
                        evaluatorId
                    );


            if (
                !evaluator
            ) {

                throw new ApiError(
                    400,
                    `Invalid evaluating department: ${evaluatorId}`
                );

            }

        }


        // =================================================
        // SPECIAL PARAMETERS VALIDATION
        // =================================================

        let normalizedSpecialParameters =
            [];


        if (
            survey_type === "special"
        ) {

            if (
                !Array.isArray(
                    special_parameters
                )
            ) {

                throw new ApiError(
                    400,
                    "Special survey parameters are required"
                );

            }


            normalizedSpecialParameters =
                special_parameters

                    .map(
                        (
                            parameter,
                            index
                        ) => {

                            const parameterName =
                                String(
                                    parameter?.parameter_name ||
                                    parameter?.name ||
                                    ""
                                ).trim();


                            const description =
                                parameter?.description
                                    ? String(
                                        parameter.description
                                      ).trim()
                                    : null;


                            const importance =
                                Number(
                                    parameter?.importance ??
                                    parameter?.weightage ??
                                    5
                                );


                            return {

                                parameter_name:
                                    parameterName,

                                description,

                                importance:
                                    Number.isFinite(
                                        importance
                                    )
                                        ? importance
                                        : 5,

                                display_order:
                                    Number(
                                        parameter?.display_order
                                    ) > 0
                                        ? Number(
                                            parameter.display_order
                                          )
                                        : index + 1,

                                status:
                                    parameter?.status ||
                                    "active"

                            };

                        }
                    )

                    .filter(
                        parameter =>
                            parameter.parameter_name
                                .length > 0
                    );


            if (
                normalizedSpecialParameters.length === 0
            ) {

                throw new ApiError(
                    400,
                    "At least one special survey parameter is required"
                );

            }

        }


        // =================================================
        // CREATE SURVEY
        // =================================================

        const surveyId =
            await surveyRepository
                .createSurveyWithDepartments({

                    survey_name,

                    survey_type,

                    start_date,

                    end_date,

                    status:
                        status ||
                        "draft",

                    created_by,

                    target_department_id:
                        targetDepartmentId,

                    evaluating_department_ids:
                        uniqueEvaluatorIds,

                    special_parameters:
                        normalizedSpecialParameters

                });


        // =================================================
        // RETURN COMPLETE SURVEY
        // =================================================

        const createdSurvey =
            await surveyRepository
                .findById(
                    surveyId
                );


        return createdSurvey;

    }


    // =====================================================
    // UPDATE SURVEY
    // =====================================================

    async updateSurvey(
        surveyId,
        surveyData
    ) {

        let {

            survey_name,

            survey_type,

            start_date,

            end_date,

            status

        } = surveyData;


        if (
            start_date
        ) {

            start_date =
                String(
                    start_date
                )
                    .split("T")[0];

        }


        if (
            end_date
        ) {

            end_date =
                String(
                    end_date
                )
                    .split("T")[0];

        }


        if (
            !survey_name ||
            !start_date ||
            !end_date
        ) {

            throw new ApiError(
                400,
                "survey_name, start_date, and end_date are required"
            );

        }


        if (
            new Date(start_date) >
            new Date(end_date)
        ) {

            throw new ApiError(
                400,
                "start_date cannot be after end_date"
            );

        }


        const survey =
            await surveyRepository
                .findById(
                    surveyId
                );


        if (
            !survey
        ) {

            throw new ApiError(
                404,
                "Survey not found"
            );

        }


        await surveyRepository
            .update(
                surveyId,
                {

                    survey_name,

                    survey_type:
                        survey_type ||
                        survey.survey_type ||
                        "general",

                    start_date,

                    end_date,

                    status:
                        status ||
                        survey.status

                }
            );


        return await surveyRepository
            .findById(
                surveyId
            );

    }


    // =====================================================
    // DELETE SURVEY
    // =====================================================

    async deleteSurvey(
        surveyId
    ) {

        const survey =
            await surveyRepository
                .findById(
                    surveyId
                );


        if (
            !survey
        ) {

            throw new ApiError(
                404,
                "Survey not found"
            );

        }


        return await surveyRepository
            .delete(
                surveyId
            );

    }

}


module.exports =
    new SurveyService();