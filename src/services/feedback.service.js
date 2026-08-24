const feedbackRepository =
    require("../repositories/feedback.repository");

const feedbackDetailRepository =
    require("../repositories/feedbackDetail.repository");

const departmentMappingRepository =
    require("../repositories/departmentMapping.repository");

const surveyRepository =
    require("../repositories/survey.repository");

const parameterRepository =
    require("../repositories/parameter.repository");

const ApiError =
    require("../utils/ApiError");


class FeedbackService {


    // =====================================================
    // USI CALCULATION
    // =====================================================

    calculateUSI(ratings, activeParams) {

        // -------------------------------------------------
        // IMPORTANCE
        // Every parameter has fixed importance = 5
        // -------------------------------------------------

        const IMPORTANCE = 5;


        // -------------------------------------------------
        // MAXIMUM RATING
        // Rating is from 1 to 5
        // -------------------------------------------------

        const MAX_RATING = 5;


        // -------------------------------------------------
        // MAXIMUM SCORE PER PARAMETER
        // -------------------------------------------------

        const maximumScorePerParameter =
            IMPORTANCE * MAX_RATING;


        // -------------------------------------------------
        // MAXIMUM TOTAL SCORE
        //
        // 6 parameters × 25
        // = 150
        //
        // Using activeParams.length keeps it dynamic.
        // With your current 6 parameters:
        // 6 × 25 = 150
        // -------------------------------------------------

        const maximumTotalScore =
            maximumScorePerParameter *
            activeParams.length;


        // -------------------------------------------------
        // CALCULATE EACH PARAMETER SCORE
        // -------------------------------------------------

        const calculatedRatings =
            ratings.map(item => {

                const rating =
                    parseInt(item.rating);


                const score =
                    IMPORTANCE * rating;


                return {

                    ...item,

                    importance:
                        IMPORTANCE,

                    score:
                        score

                };

            });


        // -------------------------------------------------
        // TOTAL SCORE
        // -------------------------------------------------

        const totalScore =
            calculatedRatings.reduce(
                (sum, item) =>
                    sum + item.score,
                0
            );


        // -------------------------------------------------
        // USI PERCENTAGE
        // -------------------------------------------------

        const usiPercentage =
            maximumTotalScore > 0
                ? (totalScore / maximumTotalScore) * 100
                : 0;


        return {

            ratings:
                calculatedRatings,

            total_score:
                totalScore,

            maximum_score:
                maximumTotalScore,

            usi_percentage:
                Number(
                    usiPercentage.toFixed(2)
                )

        };

    }


    // =====================================================
    // GET FEEDBACK BY ID
    // =====================================================

    async getFeedbackById(feedbackId) {

        const feedback =
            await feedbackRepository
                .findById(feedbackId);


        if (!feedback) {

            throw new ApiError(
                404,
                "Feedback record not found"
            );

        }


        const details =
            await feedbackDetailRepository
                .findByFeedbackId(
                    feedbackId
                );


        // -------------------------------------------------
        // GET ACTIVE PARAMETERS
        // -------------------------------------------------

        const parameters =
            await parameterRepository
                .findAll();


        const activeParams =
            parameters.filter(
                p => p.status === "active"
            );


        // -------------------------------------------------
        // CALCULATE USI
        // -------------------------------------------------

        const usi =
            this.calculateUSI(
                details,
                activeParams
            );


        return {

            ...feedback,

            ratings:
                usi.ratings,

            total_score:
                usi.total_score,

            maximum_score:
                usi.maximum_score,

            usi_percentage:
                usi.usi_percentage

        };

    }


    // =====================================================
    // HR - EVALUATION STATUS
    // =====================================================

    async getFeedbackStatusForHR(
        surveyId,
        fromDeptId
    ) {

        if (
            !surveyId ||
            !fromDeptId
        ) {

            throw new ApiError(
                400,
                "surveyId and fromDeptId are required"
            );

        }


        return await feedbackRepository
            .getFeedbackSubmissionStatus(
                surveyId,
                fromDeptId
            );

    }


    // =====================================================
    // HR - FEEDBACK DETAILS
    // =====================================================

    async getFeedbackDetailsForHR(
        surveyId,
        fromDeptId,
        toDeptId
    ) {

        if (
            !surveyId ||
            !fromDeptId ||
            !toDeptId
        ) {

            throw new ApiError(
                400,
                "surveyId, fromDeptId and toDeptId are required"
            );

        }


        const feedback =
            await feedbackRepository
                .findBySurveyAndDepts(
                    surveyId,
                    fromDeptId,
                    toDeptId
                );


        if (!feedback) {

            return null;

        }


        // -------------------------------------------------
        // GET RATINGS
        // -------------------------------------------------

        const ratings =
            await feedbackDetailRepository
                .findByFeedbackId(
                    feedback.feedback_id
                );


        // -------------------------------------------------
        // GET ACTIVE PARAMETERS
        // -------------------------------------------------

        const parameters =
            await parameterRepository
                .findAll();


        const activeParams =
            parameters.filter(
                p => p.status === "active"
            );


        // -------------------------------------------------
        // CALCULATE USI
        // -------------------------------------------------

        const usi =
            this.calculateUSI(
                ratings,
                activeParams
            );


        return {

            ...feedback,

            ratings:
                usi.ratings,

            total_score:
                usi.total_score,

            maximum_score:
                usi.maximum_score,

            usi_percentage:
                usi.usi_percentage

        };

    }


    // =====================================================
    // HOD - FEEDBACK STATUS
    // =====================================================

    async getFeedbackStatusForHOD(
        surveyId,
        fromDeptId
    ) {

        if (
            !surveyId ||
            !fromDeptId
        ) {

            throw new ApiError(
                400,
                "surveyId and fromDeptId are required"
            );

        }


        return await feedbackRepository
            .getFeedbackSubmissionStatus(
                surveyId,
                fromDeptId
            );

    }


    // =====================================================
    // HOD - FEEDBACK DETAILS
    // =====================================================

    async getFeedbackDetails(
        surveyId,
        fromDeptId,
        toDeptId
    ) {

        const feedback =
            await feedbackRepository
                .findBySurveyAndDepts(
                    surveyId,
                    fromDeptId,
                    toDeptId
                );


        if (!feedback) {

            return null;

        }


        const ratings =
            await feedbackDetailRepository
                .findByFeedbackId(
                    feedback.feedback_id
                );


        // -------------------------------------------------
        // GET ACTIVE PARAMETERS
        // -------------------------------------------------

        const parameters =
            await parameterRepository
                .findAll();


        const activeParams =
            parameters.filter(
                p => p.status === "active"
            );


        // -------------------------------------------------
        // CALCULATE USI
        // -------------------------------------------------

        const usi =
            this.calculateUSI(
                ratings,
                activeParams
            );


        return {

            ...feedback,

            ratings:
                usi.ratings,

            total_score:
                usi.total_score,

            maximum_score:
                usi.maximum_score,

            usi_percentage:
                usi.usi_percentage

        };

    }


    // =====================================================
    // SUBMIT / SAVE FEEDBACK
    // =====================================================

    async submitOrSaveFeedback(
        user,
        payload
    ) {

        const {
            survey_id,
            to_department_id,
            overall_comment,
            ratings,
            status
        } = payload;


        // -------------------------------------------------
        // BASIC VALIDATION
        // -------------------------------------------------

        if (
            !survey_id ||
            !to_department_id ||
            !ratings ||
            !status
        ) {

            throw new ApiError(
                400,
                "Required fields: survey_id, to_department_id, ratings, status"
            );

        }


        // -------------------------------------------------
        // STATUS VALIDATION
        // -------------------------------------------------

        if (
            status !== "draft" &&
            status !== "submitted"
        ) {

            throw new ApiError(
                400,
                "Invalid status: must be 'draft' or 'submitted'"
            );

        }


        // -------------------------------------------------
        // FROM DEPARTMENT
        // -------------------------------------------------

        const from_department_id =
            user.department_id;


        if (!from_department_id) {

            throw new ApiError(
                400,
                "The user does not belong to any department and cannot submit feedback."
            );

        }


        // -------------------------------------------------
        // SAME DEPARTMENT CHECK
        // -------------------------------------------------

        if (
            parseInt(from_department_id) ===
            parseInt(to_department_id)
        ) {

            throw new ApiError(
                400,
                "You cannot submit feedback to your own department."
            );

        }


        // -------------------------------------------------
        // ACTIVE SURVEY VALIDATION
        // -------------------------------------------------

        const activeSurvey =
            await surveyRepository
                .findActiveSurvey();


        if (
            !activeSurvey ||
            activeSurvey.survey_id !==
            parseInt(survey_id)
        ) {

            throw new ApiError(
                400,
                "Feedback can only be saved or submitted for a currently active survey."
            );

        }


        // -------------------------------------------------
        // DEPARTMENT MAPPING
        // -------------------------------------------------

        const mapping =
            await departmentMappingRepository
                .findByFromAndTo(
                    Number(survey_id),
                    Number(from_department_id),
                    Number(to_department_id)
                );
        if (
            !mapping ||
            mapping.status !== "active"
        ) {

            throw new ApiError(
                403,
                "You do not have mapping permission to evaluate this department."
            );

        }


        // -------------------------------------------------
        // CHECK EXISTING FEEDBACK
        // -------------------------------------------------

        let feedback =
            await feedbackRepository
                .findBySurveyAndDepts(
                    survey_id,
                    from_department_id,
                    to_department_id
                );


        if (
            feedback &&
            feedback.status === "submitted"
        ) {

            throw new ApiError(
                400,
                "Feedback has already been finalized and submitted. You cannot modify it."
            );

        }


        // -------------------------------------------------
        // GET ACTIVE PARAMETERS
        // -------------------------------------------------

        const parameters =
            await parameterRepository
                .findAll();


        const activeParams =
            parameters.filter(
                p => p.status === "active"
            );


        // -------------------------------------------------
        // VALIDATE RATINGS ARRAY
        // -------------------------------------------------

        if (
            !Array.isArray(ratings)
        ) {

            throw new ApiError(
                400,
                "ratings must be an array of parameter rating objects."
            );

        }


        // -------------------------------------------------
        // VALIDATE EACH RATING
        // -------------------------------------------------

        for (
            const item of ratings
        ) {

            const {
                parameter_id,
                rating
            } = item;


            if (
                !parameter_id ||
                rating === undefined
            ) {

                throw new ApiError(
                    400,
                    "Each rating object must contain parameter_id and rating."
                );

            }


            const paramExists =
                activeParams.find(
                    p =>
                        p.parameter_id ===
                        parseInt(parameter_id)
                );


            if (!paramExists) {

                throw new ApiError(
                    400,
                    `Parameter ID ${parameter_id} is invalid or inactive.`
                );

            }


            const rVal =
                parseInt(rating);


            if (
                isNaN(rVal) ||
                rVal < 1 ||
                rVal > 5
            ) {

                throw new ApiError(
                    400,
                    "Ratings must be integers between 1 and 5 (inclusive)."
                );

            }

        }


        // -------------------------------------------------
        // SUBMITTED → ALL PARAMETERS REQUIRED
        // -------------------------------------------------

        if (
            status === "submitted"
        ) {

            const ratedParamIds =
                ratings.map(
                    r =>
                        parseInt(
                            r.parameter_id
                        )
                );


            const missingParams =
                activeParams.filter(
                    ap =>
                        !ratedParamIds.includes(
                            ap.parameter_id
                        )
                );


            if (
                missingParams.length > 0
            ) {

                const missingNames =
                    missingParams
                        .map(
                            mp =>
                                mp.parameter_name
                        )
                        .join(", ");


                throw new ApiError(
                    400,
                    `Cannot submit. Missing ratings for parameters: ${missingNames}`
                );

            }

        }


        // -------------------------------------------------
        // CREATE / UPDATE FEEDBACK
        // -------------------------------------------------

        let feedbackId;


        if (!feedback) {

            feedbackId =
                await feedbackRepository
                    .create({

                        survey_id,

                        from_department_id,

                        to_department_id,

                        submitted_by:
                            user.user_id,

                        overall_comment,

                        status

                    });

        }

        else {

            feedbackId =
                feedback.feedback_id;


            await feedbackRepository
                .update(
                    feedbackId,
                    {
                        overall_comment,
                        status
                    }
                );

        }


        // -------------------------------------------------
        // UPSERT FEEDBACK DETAILS
        // -------------------------------------------------

        for (
            const item of ratings
        ) {

            const {
                parameter_id,
                rating,
                comment
            } = item;


            await feedbackDetailRepository
                .upsert(
                    feedbackId,
                    parameter_id,
                    rating,
                    comment || null
                );

        }


        // -------------------------------------------------
        // RETURN UPDATED FEEDBACK
        // -------------------------------------------------

        return await this
            .getFeedbackById(
                feedbackId
            );

    }

}


module.exports =
    new FeedbackService();