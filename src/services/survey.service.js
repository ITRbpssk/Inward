const surveyRepository =
    require("../repositories/survey.repository");

const ApiError =
    require("../utils/ApiError");


class SurveyService {


    // =====================================================
    // GET ALL SURVEYS
    // =====================================================

    async getAllSurveys() {

        return await surveyRepository.findAll();

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
    //
    // Multiple active surveys are allowed.
    // This returns the latest active survey.
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
    //
    // IMPORTANT:
    // Multiple surveys can be active simultaneously.
    // =====================================================

    async getActiveSurveys() {

        return await surveyRepository
            .findActiveSurveys();

    }


    // =====================================================
    // GET MY SURVEYS
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
            .findSurveysByDepartmentId(
                departmentId
            );
    }


    // =====================================================
    // CREATE SURVEY
    // =====================================================

    async createSurvey(
        surveyData
    ) {

        const {
            survey_name,
            start_date,
            end_date,
            status
        } = surveyData;


        // -------------------------------------------------
        // REQUIRED FIELDS
        // -------------------------------------------------

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


        // -------------------------------------------------
        // DATE VALIDATION
        // -------------------------------------------------

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
        // IMPORTANT CHANGE
        // =================================================
        //
        // DO NOT CHECK FOR ANOTHER ACTIVE SURVEY.
        //
        // Multiple active surveys are allowed.
        //
        // Example:
        //
        // Survey 1 -> ACTIVE
        // Survey 2 -> ACTIVE
        // Survey 3 -> DRAFT
        // Survey 4 -> ACTIVE
        //
        // =================================================


        const newId =
            await surveyRepository.create({

                survey_name,
                start_date,
                end_date,
                status: status || "draft"

            });


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


        // -------------------------------------------------
        // ISO DATE -> MYSQL DATE
        // -------------------------------------------------

        if (start_date) {

            start_date =
                start_date.split("T")[0];

        }

        if (end_date) {

            end_date =
                end_date.split("T")[0];

        }


        // -------------------------------------------------
        // REQUIRED FIELDS
        // -------------------------------------------------

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


        // -------------------------------------------------
        // DATE VALIDATION
        // -------------------------------------------------

        if (
            new Date(start_date) >
            new Date(end_date)
        ) {

            throw new ApiError(
                400,
                "start_date cannot be after end_date"
            );

        }


        // -------------------------------------------------
        // CHECK SURVEY EXISTS
        // -------------------------------------------------

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
        // IMPORTANT CHANGE
        // =================================================
        //
        // NO ACTIVE SURVEY VALIDATION HERE.
        //
        // Any survey can be changed to ACTIVE.
        //
        // Example:
        //
        // Existing:
        // Survey 1 -> ACTIVE
        //
        // Update:
        // Survey 2 -> ACTIVE
        //
        // Result:
        // Survey 1 -> ACTIVE
        // Survey 2 -> ACTIVE
        //
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