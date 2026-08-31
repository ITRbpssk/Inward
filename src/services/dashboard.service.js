const dashboardRepository =
    require("../repositories/dashboard.repository");

const feedbackService =
    require("./feedback.service");

const ApiError =
    require("../utils/ApiError");


class DashboardService {

    // =====================================================
    // GET TARGET DEPARTMENTS
    // =====================================================

    async getTargetDepartments() {

        return await dashboardRepository
            .findTargetDepartments();

    }


    // =====================================================
    // GENERAL EVALUATION OVERVIEW
    //
    // INPUT:
    // targetDepartmentId
    // quarter
    // =====================================================

    async getEvaluationOverview(
        targetDepartmentId,
        quarter
    ) {

        const targetId =
            Number(
                targetDepartmentId
            );

        const normalizedQuarter =
            String(
                quarter || ""
            )
                .trim()
                .toUpperCase();


        // =================================================
        // VALIDATION
        // =================================================

        if (
            !Number.isInteger(targetId) ||
            targetId <= 0
        ) {

            throw new ApiError(
                400,
                "Valid targetDepartmentId is required."
            );

        }


        const validQuarters = [
            "Q1",
            "Q2",
            "Q3",
            "Q4"
        ];


        if (
            !validQuarters.includes(
                normalizedQuarter
            )
        ) {

            throw new ApiError(
                400,
                "Valid quarter is required. Allowed values: Q1, Q2, Q3, Q4."
            );

        }


        // =================================================
        // FIND GENERAL SURVEY
        // Target Department + Quarter
        // =================================================

        const survey =
            await dashboardRepository
                .findSurveyByTargetDepartmentAndQuarter(
                    targetId,
                    normalizedQuarter
                );


        if (!survey) {

            return {

                survey: null,

                evaluations: []

            };

        }


        // =================================================
        // GET MAPPINGS + FEEDBACK
        // =================================================

        const rows =
            await dashboardRepository
                .getEvaluationOverview(
                    survey.survey_id,
                    targetId
                );


        // =================================================
        // ADD SCORE
        // =================================================

        const evaluations =
            await Promise.all(

                rows.map(
                    async row => {

                        let score = null;


                        if (
                            row.feedback_id &&
                            row.feedback_status ===
                                "submitted"
                        ) {

                            const feedback =
                                await feedbackService
                                    .getFeedbackById(

                                        row.feedback_id,

                                        null,

                                        "ADMIN"

                                    );


                            score =
                                Number(
                                    feedback.usi_percentage
                                );

                        }


                        return {

                            mapping_id:
                                row.mapping_id,

                            survey_id:
                                row.survey_id,

                            evaluating_department_id:
                                row.evaluating_department_id,

                            evaluating_department_code:
                                row.evaluating_department_code,

                            evaluating_department_name:
                                row.evaluating_department_name,

                            evaluation_target_id:
                                row.evaluation_target_id,

                            evaluation_target_code:
                                row.evaluation_target_code,

                            evaluation_target_name:
                                row.evaluation_target_name,

                            feedback_id:
                                row.feedback_id,

                            status:
                                row.feedback_status,

                            submitted_on:
                                row.submitted_on,

                            score:
                                score

                        };

                    }
                )

            );


        return {

            survey: {

                survey_id:
                    survey.survey_id,

                survey_name:
                    survey.survey_name,

                survey_type:
                    survey.survey_type,

                financial_year:
                    survey.financial_year,

                quarter:
                    survey.quarter,

                start_date:
                    survey.start_date,

                end_date:
                    survey.end_date,

                status:
                    survey.status

            },

            evaluations

        };

    }


    // =====================================================
    // SPECIAL EVALUATION OVERVIEW
    //
    // INPUT:
    // targetDepartmentId
    //
    // IMPORTANT:
    // Special Survey does NOT use quarter.
    // =====================================================

    async getSpecialEvaluationOverview(
        targetDepartmentId
    ) {

        const targetId =
            Number(
                targetDepartmentId
            );


        // =================================================
        // VALIDATION
        // =================================================

        if (
            !Number.isInteger(targetId) ||
            targetId <= 0
        ) {

            throw new ApiError(
                400,
                "Valid targetDepartmentId is required."
            );

        }


        // =================================================
        // FIND SPECIAL SURVEY
        //
        // Target Department only
        // NO QUARTER
        // =================================================

        const survey =
            await dashboardRepository
                .findSpecialSurveyByTargetDepartment(
                    targetId
                );


        if (!survey) {

            return {

                survey: null,

                evaluations: []

            };

        }


        // =================================================
        // GET MAPPINGS + FEEDBACK
        // =================================================

        const rows =
            await dashboardRepository
                .getEvaluationOverview(
                    survey.survey_id,
                    targetId
                );


        // =================================================
        // ADD SCORE
        // =================================================

        const evaluations =
            await Promise.all(

                rows.map(
                    async row => {

                        let score = null;


                        if (
                            row.feedback_id &&
                            row.feedback_status ===
                                "submitted"
                        ) {

                            const feedback =
                                await feedbackService
                                    .getFeedbackById(

                                        row.feedback_id,

                                        null,

                                        "ADMIN"

                                    );


                            score =
                                Number(
                                    feedback.usi_percentage
                                );

                        }


                        return {

                            mapping_id:
                                row.mapping_id,

                            survey_id:
                                row.survey_id,

                            evaluating_department_id:
                                row.evaluating_department_id,

                            evaluating_department_code:
                                row.evaluating_department_code,

                            evaluating_department_name:
                                row.evaluating_department_name,

                            evaluation_target_id:
                                row.evaluation_target_id,

                            evaluation_target_code:
                                row.evaluation_target_code,

                            evaluation_target_name:
                                row.evaluation_target_name,

                            feedback_id:
                                row.feedback_id,

                            status:
                                row.feedback_status,

                            submitted_on:
                                row.submitted_on,

                            score:
                                score

                        };

                    }
                )

            );


        return {

            survey: {

                survey_id:
                    survey.survey_id,

                survey_name:
                    survey.survey_name,

                survey_type:
                    survey.survey_type,

                financial_year:
                    survey.financial_year,

                quarter:
                    survey.quarter,

                start_date:
                    survey.start_date,

                end_date:
                    survey.end_date,

                status:
                    survey.status

            },

            evaluations

        };

    }


    // =====================================================
    // VIEW RATING
    // =====================================================

    async getRatingDetails(
        feedbackId
    ) {

        const id =
            Number(
                feedbackId
            );


        if (
            !Number.isInteger(id) ||
            id <= 0
        ) {

            throw new ApiError(
                400,
                "Valid feedbackId is required."
            );

        }


        const feedback =
            await feedbackService
                .getFeedbackById(
                    id,
                    null,
                    "ADMIN"
                );


        return {

            feedback_id:
                feedback.feedback_id,

            survey_id:
                feedback.survey_id,

            survey_name:
                feedback.survey_name,

            survey_type:
                feedback.survey_type,

            from_department_name:
                feedback.from_department_name,

            from_department_code:
                feedback.from_department_code,

            to_department_name:
                feedback.to_department_name,

            to_department_code:
                feedback.to_department_code,

            status:
                feedback.status,

            submitted_on:
                feedback.submitted_on,

            overall_comment:
                feedback.overall_comment,

            ratings:
                feedback.ratings,

            total_score:
                feedback.total_score,

            maximum_score:
                feedback.maximum_score,

            usi_percentage:
                feedback.usi_percentage

        };

    }

}


module.exports =
    new DashboardService();