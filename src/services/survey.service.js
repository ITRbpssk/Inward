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
        roleName === "ADMIN" ||
        roleName === "HR"
    ) {

        return await surveyRepository.findAll();

    }


    if (roleName === "HOD") {

        return await surveyRepository
            .findByCreatedBy(userId);

    }


    return [];

}


    // =====================================================
    // GET SURVEY BY ID
    // =====================================================

    async getSurveyById(surveyId) {

        const survey =
            await surveyRepository.findById(
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
    //
    // BACKWARD COMPATIBILITY
    // =====================================================

    async getActiveSurvey() {

        const survey =
            await surveyRepository.findActiveSurvey();


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
    //
    // IMPORTANT:
    //
    // Current logged-in HOD/HR department is treated
    // as EVALUATING DEPARTMENT.
    //
    // Example:
    //
    // Logged-in department = HR
    //
    // Survey mapping:
    // HR → IT
    //
    // Result:
    // HR sees that survey to evaluate IT.
    // =====================================================

    async getMySurveys(
        departmentId
    ) {

        if (!departmentId) {

            throw new ApiError(
                400,
                "Department ID not found for current user"
            );

        }


        return await surveyRepository
            .findSurveysByEvaluatorDepartmentId(
                departmentId
            );

    }


    // =====================================================
    // CREATE SURVEY
    //
    // NEW REQUIREMENT
    //
    // Admin decides:
    //
    // 1. Survey name
    // 2. Target department
    // 3. Evaluating departments
    //
    // Example:
    //
    // Target = IT
    //
    // Evaluators:
    // HR
    // QA
    // ACC
    //
    // Database:
    //
    // surveys
    // survey_departments
    // department_mappings
    // =====================================================

    async createSurvey(
        surveyData,
        created_by
    ) {

        let {
            survey_name,
            start_date,
            end_date,
            status,
            target_department_id,
            evaluating_department_ids
        } = surveyData;


        // =================================================
        // DATE NORMALIZATION
        // =================================================

        if (start_date) {

            start_date =
                start_date.split("T")[0];

        }


        if (end_date) {

            end_date =
                end_date.split("T")[0];

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
        // TARGET DEPARTMENT REQUIRED
        // =================================================

        if (!target_department_id) {

            throw new ApiError(
                400,
                "Target department is required"
            );

        }


        // =================================================
        // EVALUATING DEPARTMENTS REQUIRED
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
        // CONVERT IDs TO INTEGER
        // =================================================

        const targetDepartmentId =
            parseInt(
                target_department_id
            );


        const evaluatorDepartmentIds =
            evaluating_department_ids.map(
                id => parseInt(id)
            );


        // =================================================
        // CHECK INVALID IDs
        // =================================================

        if (
            Number.isNaN(
                targetDepartmentId
            )
        ) {

            throw new ApiError(
                400,
                "Invalid target department ID"
            );

        }


        // =================================================
        // REMOVE DUPLICATE EVALUATORS
        // =================================================

        const uniqueEvaluatorIds =
            [
                ...new Set(
                    evaluatorDepartmentIds
                )
            ];


        // =================================================
        // SELF EVALUATION CHECK
        //
        // IT cannot evaluate IT
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
        // VERIFY TARGET DEPARTMENT
        // =================================================

        const targetDepartment =
            await departmentRepository.findById(
                targetDepartmentId
            );


        if (!targetDepartment) {

            throw new ApiError(
                400,
                "Invalid target department"
            );

        }


        // =================================================
        // VERIFY EVALUATING DEPARTMENTS
        // =================================================

        for (
            const evaluatorId
            of uniqueEvaluatorIds
        ) {

            const evaluatorDepartment =
                await departmentRepository.findById(
                    evaluatorId
                );


            if (!evaluatorDepartment) {

                throw new ApiError(
                    400,
                    `Invalid evaluating department ID: ${evaluatorId}`
                );

            }

        }


        // =================================================
        // CREATE EVERYTHING IN ONE TRANSACTION
        // =================================================

      const newId =
    await surveyRepository
        .createSurveyWithDepartments({

            survey_name,

            start_date,

            end_date,

            status:
                status || "draft",

            created_by:
                created_by,

            target_department_id:
                targetDepartmentId,

            evaluating_department_ids:
                uniqueEvaluatorIds

        });

        // =================================================
        // RETURN CREATED SURVEY
        // =================================================

        return await surveyRepository.findById(
            newId
        );

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
            start_date,
            end_date,
            status
        } = surveyData;


        // =================================================
        // ISO DATE → MYSQL DATE
        // =================================================

        if (start_date) {

            start_date =
                start_date.split("T")[0];

        }


        if (end_date) {

            end_date =
                end_date.split("T")[0];

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
        // CHECK SURVEY EXISTS
        // =================================================

        const survey =
            await surveyRepository.findById(
                surveyId
            );


        if (!survey) {

            throw new ApiError(
                404,
                "Survey not found"
            );

        }


        // =================================================
        // UPDATE SURVEY
        // =================================================

        await surveyRepository.update(
            surveyId,
            {

                survey_name,

                start_date,

                end_date,

                status:
                    status || survey.status

            }
        );


        // =================================================
        // RETURN UPDATED SURVEY
        // =================================================

        return await surveyRepository.findById(
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
            await surveyRepository.findById(
                surveyId
            );


        if (!survey) {

            throw new ApiError(
                404,
                "Survey not found"
            );

        }


        return await surveyRepository.delete(
            surveyId
        );

    }

}


module.exports = new SurveyService();