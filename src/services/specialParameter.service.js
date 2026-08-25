const specialParameterRepository =
    require("../repositories/specialParameter.repository");

const surveyRepository =
    require("../repositories/survey.repository");

const ApiError =
    require("../utils/ApiError");


class SpecialParameterService {


    // =====================================================
    // GET PARAMETERS BY SURVEY
    // =====================================================

    async getParametersBySurvey(
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


        // =================================================
        // ONLY SPECIAL SURVEY
        // =================================================

        if (
            String(survey.survey_type)
                .toLowerCase() !== "special"
        ) {

            throw new ApiError(
                400,
                "Special parameters are only available for special surveys"
            );

        }


        return await specialParameterRepository
            .findBySurveyId(
                Number(surveyId)
            );

    }


    // =====================================================
    // GET SINGLE SPECIAL PARAMETER
    // =====================================================

    async getParameterById(
        surveyParameterId
    ) {

        const parameter =
            await specialParameterRepository
                .findById(
                    surveyParameterId
                );


        if (!parameter) {

            throw new ApiError(
                404,
                "Special parameter not found"
            );

        }


        // =================================================
        // VERIFY SURVEY
        // =================================================

        const survey =
            await surveyRepository
                .findById(
                    parameter.survey_id
                );


        if (!survey) {

            throw new ApiError(
                404,
                "Survey associated with this parameter was not found"
            );

        }


        // =================================================
        // ONLY SPECIAL SURVEY
        // =================================================

        if (
            String(survey.survey_type)
                .toLowerCase() !== "special"
        ) {

            throw new ApiError(
                400,
                "This parameter does not belong to a special survey"
            );

        }


        return parameter;

    }


    // =====================================================
    // CREATE SPECIAL PARAMETER
    // =====================================================

    async createParameter(
        surveyId,
        paramData
    ) {

        const {
            parameter_name,
            description,
            display_order,
            status
        } = paramData;


        // =================================================
        // CHECK SURVEY
        // =================================================

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


        // =================================================
        // ONLY SPECIAL SURVEY
        // =================================================

        if (
            String(survey.survey_type)
                .toLowerCase() !== "special"
        ) {

            throw new ApiError(
                400,
                "Special parameters can only be created for special surveys"
            );

        }


        // =================================================
        // PARAMETER NAME REQUIRED
        // =================================================

        if (
            !parameter_name ||
            !String(parameter_name).trim()
        ) {

            throw new ApiError(
                400,
                "parameter_name is required"
            );

        }


        // =================================================
        // IMPORTANCE
        //
        // FIXED = 5
        //
        // Frontend value is ignored.
        // =================================================

        const finalImportance = 5;


        // =================================================
        // DISPLAY ORDER
        // =================================================

        const finalDisplayOrder =
            display_order !== undefined
                ? Number(display_order)
                : 0;


        if (
            Number.isNaN(
                finalDisplayOrder
            ) ||
            finalDisplayOrder < 0
        ) {

            throw new ApiError(
                400,
                "display_order must be a valid non-negative number"
            );

        }


        // =================================================
        // STATUS
        // =================================================

        const finalStatus =
            status || "active";


        if (
            ![
                "active",
                "inactive"
            ].includes(
                finalStatus
            )
        ) {

            throw new ApiError(
                400,
                "Invalid status. Must be active or inactive"
            );

        }


        // =================================================
        // CREATE
        // =================================================

        const newId =
            await specialParameterRepository
                .create({

                    survey_id:
                        Number(surveyId),

                    parameter_id:
                        null,

                    parameter_name:
                        String(
                            parameter_name
                        ).trim(),

                    description:
                        description || null,

                    importance:
                        finalImportance,

                    display_order:
                        finalDisplayOrder,

                    status:
                        finalStatus

                });


        return await specialParameterRepository
            .findById(
                newId
            );

    }


    // =====================================================
    // UPDATE SPECIAL PARAMETER
    // =====================================================

    async updateParameter(
        surveyParameterId,
        paramData
    ) {

        const existing =
            await specialParameterRepository
                .findById(
                    surveyParameterId
                );


        if (!existing) {

            throw new ApiError(
                404,
                "Special parameter not found"
            );

        }


        // =================================================
        // VERIFY SURVEY
        // =================================================

        const survey =
            await surveyRepository
                .findById(
                    existing.survey_id
                );


        if (!survey) {

            throw new ApiError(
                404,
                "Survey associated with this parameter was not found"
            );

        }


        // =================================================
        // ONLY SPECIAL SURVEY
        // =================================================

        if (
            String(survey.survey_type)
                .toLowerCase() !== "special"
        ) {

            throw new ApiError(
                400,
                "Only parameters of special surveys can be updated"
            );

        }


        const {
            parameter_name,
            description,
            display_order,
            status
        } = paramData;


        // =================================================
        // PARAMETER NAME
        // =================================================

        if (
            parameter_name !== undefined &&
            !String(
                parameter_name
            ).trim()
        ) {

            throw new ApiError(
                400,
                "parameter_name cannot be empty"
            );

        }


        // =================================================
        // DISPLAY ORDER
        // =================================================

        const finalDisplayOrder =
            display_order !== undefined
                ? Number(display_order)
                : existing.display_order;


        if (
            Number.isNaN(
                finalDisplayOrder
            ) ||
            finalDisplayOrder < 0
        ) {

            throw new ApiError(
                400,
                "display_order must be a valid non-negative number"
            );

        }


        // =================================================
        // STATUS
        // =================================================

        const finalStatus =
            status !== undefined
                ? status
                : existing.status;


        if (
            ![
                "active",
                "inactive"
            ].includes(
                finalStatus
            )
        ) {

            throw new ApiError(
                400,
                "Invalid status. Must be active or inactive"
            );

        }


        // =================================================
        // UPDATE
        //
        // Importance ALWAYS remains 5.
        // =================================================

        await specialParameterRepository
            .update(

                surveyParameterId,

                {

                    parameter_name:
                        parameter_name !== undefined
                            ? String(
                                parameter_name
                            ).trim()
                            : existing.parameter_name,

                    description:
                        description !== undefined
                            ? description
                            : existing.description,

                    importance:
                        5,

                    display_order:
                        finalDisplayOrder,

                    status:
                        finalStatus

                }

            );


        return await specialParameterRepository
            .findById(
                surveyParameterId
            );

    }


    // =====================================================
    // DELETE SPECIAL PARAMETER
    // =====================================================

    async deleteParameter(
        surveyParameterId
    ) {

        const existing =
            await specialParameterRepository
                .findById(
                    surveyParameterId
                );


        if (!existing) {

            throw new ApiError(
                404,
                "Special parameter not found"
            );

        }


        // =================================================
        // VERIFY SURVEY
        // =================================================

        const survey =
            await surveyRepository
                .findById(
                    existing.survey_id
                );


        if (!survey) {

            throw new ApiError(
                404,
                "Survey associated with this parameter was not found"
            );

        }


        // =================================================
        // ONLY SPECIAL SURVEY
        // =================================================

        if (
            String(survey.survey_type)
                .toLowerCase() !== "special"
        ) {

            throw new ApiError(
                400,
                "Only parameters of special surveys can be deleted"
            );

        }


        await specialParameterRepository
            .delete(
                surveyParameterId
            );


        return true;

    }

}


module.exports =
    new SpecialParameterService();