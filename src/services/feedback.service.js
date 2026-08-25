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

const specialParameterRepository =
    require("../repositories/specialParameter.repository");

const ApiError =
    require("../utils/ApiError");


class FeedbackService {


    // =====================================================
    // USI CALCULATION
    //
    // Importance = 5
    // Rating = 1 to 5
    //
    // Score = Importance × Rating
    //
    // Maximum Score =
    // Active Parameters × 5 × 5
    //
    // USI =
    // Total Score / Maximum Score × 100
    // =====================================================

    calculateUSI(
        ratings,
        activeParams
    ) {

        const IMPORTANCE = 5;
        const MAX_RATING = 5;


        const maximumScorePerParameter =
            IMPORTANCE * MAX_RATING;


        const maximumTotalScore =
            maximumScorePerParameter *
            activeParams.length;


        const calculatedRatings =
            ratings.map(
                item => {

                    const rating =
                        parseInt(
                            item.rating,
                            10
                        );


                    const score =
                        IMPORTANCE *
                        rating;


                    return {

                        ...item,

                        importance:
                            IMPORTANCE,

                        score:
                            score

                    };

                }
            );


        const totalScore =
            calculatedRatings.reduce(
                (
                    sum,
                    item
                ) =>
                    sum +
                    item.score,

                0
            );


        const usiPercentage =
            maximumTotalScore > 0
                ? (
                    totalScore /
                    maximumTotalScore
                ) * 100
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
    // GET ACTIVE PARAMETERS FOR SURVEY
    //
    // GENERAL SURVEY
    //     parameters table
    //
    // SPECIAL SURVEY
    //     special_parameters table
    // =====================================================

    async getActiveParametersForSurvey(
        survey
    ) {

        if (!survey) {

            throw new ApiError(
                404,
                "Survey not found"
            );

        }


        // =================================================
        // SPECIAL SURVEY
        // =================================================

        if (
            String(
                survey.survey_type || ""
            ).toLowerCase() === "special"
        ) {

            const specialParameters =
                await specialParameterRepository
                    .findBySurveyId(
                        survey.survey_id
                    );


            return specialParameters.filter(
                parameter =>
                    parameter.status === "active"
            );

        }


        // =================================================
        // GENERAL SURVEY
        // =================================================

        const parameters =
            await parameterRepository
                .findAll();


        return parameters.filter(
            parameter =>
                parameter.status === "active"
        );

    }


    // =====================================================
    // GET FEEDBACK BY ID
    //
    // ADMIN:
    //     Can view feedback.
    //
    // HOD:
    //     Can view if:
    //
    //     1. Survey creator
    //     2. Feedback submitter
    //     3. Active evaluator mapping exists
    // =====================================================

    async getFeedbackById(
        feedbackId,
        userId,
        roleName
    ) {

        const feedback =
            await feedbackRepository
                .findById(
                    feedbackId
                );


        if (!feedback) {

            throw new ApiError(
                404,
                "Feedback record not found"
            );

        }


        // =================================================
        // GET SURVEY
        // =================================================

        const survey =
            await surveyRepository
                .findById(
                    feedback.survey_id
                );


        if (!survey) {

            throw new ApiError(
                404,
                "Survey not found"
            );

        }


        // =================================================
        // HOD AUTHORIZATION
        // =================================================

        if (
            String(
                roleName || ""
            ).toUpperCase() === "HOD"
        ) {

            // ---------------------------------------------
            // CASE 1: SURVEY CREATOR
            // ---------------------------------------------

            const isCreator =
                Number(
                    survey.created_by
                ) ===
                Number(
                    userId
                );


            // ---------------------------------------------
            // CASE 2: FEEDBACK SUBMITTER
            // ---------------------------------------------

            const isSubmitter =
                Number(
                    feedback.submitted_by
                ) ===
                Number(
                    userId
                );


            // ---------------------------------------------
            // CASE 3: ACTIVE EVALUATOR MAPPING
            // ---------------------------------------------

            let hasActiveMapping =
                false;


            const mapping =
                await departmentMappingRepository
                    .findByFromAndTo(

                        Number(
                            feedback.survey_id
                        ),

                        Number(
                            feedback.from_department_id
                        ),

                        Number(
                            feedback.to_department_id
                        )

                    );


            if (
                mapping &&
                mapping.status === "active"
            ) {

                hasActiveMapping =
                    true;

            }


            console.log(
                "========================================"
            );

            console.log(
                "🔥 FEEDBACK VIEW AUTHORIZATION"
            );

            console.log(
                "USER ID:",
                userId
            );

            console.log(
                "FEEDBACK ID:",
                feedback.feedback_id
            );

            console.log(
                "SURVEY ID:",
                feedback.survey_id
            );

            console.log(
                "FROM DEPARTMENT:",
                feedback.from_department_id
            );

            console.log(
                "TO DEPARTMENT:",
                feedback.to_department_id
            );

            console.log(
                "SUBMITTED BY:",
                feedback.submitted_by
            );

            console.log(
                "IS CREATOR:",
                isCreator
            );

            console.log(
                "IS SUBMITTER:",
                isSubmitter
            );

            console.log(
                "HAS ACTIVE MAPPING:",
                hasActiveMapping
            );

            console.log(
                "========================================"
            );


            if (
                !isCreator &&
                !isSubmitter &&
                !hasActiveMapping
            ) {

                throw new ApiError(
                    403,
                    "You are not authorized to view this feedback."
                );

            }

        }


        // =================================================
        // GET FEEDBACK DETAILS
        // =================================================

        const details =
            await feedbackDetailRepository
                .findByFeedbackId(
                    feedbackId
                );


        // =================================================
        // GET ACTIVE PARAMETERS
        // =================================================

        const activeParams =
            await this.getActiveParametersForSurvey(
                survey
            );


        // =================================================
        // CALCULATE USI
        // =================================================

        const usi =
            this.calculateUSI(
                details,
                activeParams
            );


        return {

            ...feedback,

            survey_type:
                survey.survey_type,

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
    // ADMIN - FEEDBACK STATUS
    // =====================================================

    async getFeedbackStatusForAdmin(
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
    // ADMIN - FEEDBACK DETAILS
    // =====================================================

    async getFeedbackDetailsForAdmin(
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


        // =================================================
        // GET SURVEY
        // =================================================

        const survey =
            await surveyRepository
                .findById(
                    Number(
                        surveyId
                    )
                );


        if (!survey) {

            throw new ApiError(
                404,
                "Survey not found"
            );

        }


        // =================================================
        // GET FEEDBACK
        // =================================================

        const feedback =
            await feedbackRepository
                .findBySurveyAndDepts(

                    Number(
                        surveyId
                    ),

                    Number(
                        fromDeptId
                    ),

                    Number(
                        toDeptId
                    )

                );


        if (!feedback) {

            return null;

        }


        // =================================================
        // GET RATINGS
        // =================================================

        const ratings =
            await feedbackDetailRepository
                .findByFeedbackId(
                    feedback.feedback_id
                );


        // =================================================
        // GET ACTIVE PARAMETERS
        // =================================================

        const activeParams =
            await this.getActiveParametersForSurvey(
                survey
            );


        // =================================================
        // CALCULATE USI
        // =================================================

        const usi =
            this.calculateUSI(
                ratings,
                activeParams
            );


        return {

            ...feedback,

            survey_type:
                survey.survey_type,

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
        fromDeptId,
        userId
    ) {

        if (
            !surveyId ||
            !fromDeptId ||
            !userId
        ) {

            throw new ApiError(
                400,
                "surveyId, fromDeptId and userId are required"
            );

        }


        // =================================================
        // GET SURVEY
        // =================================================

        const survey =
            await surveyRepository
                .findById(
                    Number(
                        surveyId
                    )
                );


        if (!survey) {

            throw new ApiError(
                404,
                "Survey not found"
            );

        }


        // =================================================
        // CREATOR CHECK
        // =================================================

        const isCreator =
            Number(
                survey.created_by
            ) ===
            Number(
                userId
            );


        // =================================================
        // GET MAPPINGS
        // =================================================

        const mappings =
            await departmentMappingRepository
                .findBySurveyId(
                    Number(
                        surveyId
                    )
                );


        // =================================================
        // CHECK EVALUATOR
        // =================================================

        const isEvaluator =
            mappings.some(
                mapping =>

                    Number(
                        mapping.from_department_id
                    ) ===
                    Number(
                        fromDeptId
                    )

            );


        console.log(
            "========================================"
        );

        console.log(
            "🔥 HOD FEEDBACK STATUS AUTHORIZATION"
        );

        console.log(
            "SURVEY ID:",
            surveyId
        );

        console.log(
            "USER ID:",
            userId
        );

        console.log(
            "USER DEPARTMENT:",
            fromDeptId
        );

        console.log(
            "IS CREATOR:",
            isCreator
        );

        console.log(
            "IS EVALUATOR:",
            isEvaluator
        );

        console.log(
            "========================================"
        );


        if (
            !isCreator &&
            !isEvaluator
        ) {

            throw new ApiError(
                403,
                "You are not authorized to view feedback for this survey."
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
        toDeptId,
        userId
    ) {

        if (
            !surveyId ||
            !fromDeptId ||
            !toDeptId ||
            !userId
        ) {

            throw new ApiError(
                400,
                "surveyId, fromDeptId, toDeptId and userId are required"
            );

        }


        // =================================================
        // GET SURVEY
        // =================================================

        const survey =
            await surveyRepository
                .findById(
                    Number(
                        surveyId
                    )
                );


        if (!survey) {

            throw new ApiError(
                404,
                "Survey not found"
            );

        }


        // =================================================
        // CHECK CREATOR
        // =================================================

        const isCreator =
            Number(
                survey.created_by
            ) ===
            Number(
                userId
            );


        // =================================================
        // CHECK ACTIVE MAPPING
        // =================================================

        const mapping =
            await departmentMappingRepository
                .findByFromAndTo(

                    Number(
                        surveyId
                    ),

                    Number(
                        fromDeptId
                    ),

                    Number(
                        toDeptId
                    )

                );


        const hasActiveMapping =
            !!mapping &&
            mapping.status === "active";


        console.log(
            "========================================"
        );

        console.log(
            "🔥 HOD FEEDBACK DETAILS AUTH"
        );

        console.log(
            "SURVEY ID:",
            surveyId
        );

        console.log(
            "USER ID:",
            userId
        );

        console.log(
            "FROM DEPARTMENT:",
            fromDeptId
        );

        console.log(
            "TO DEPARTMENT:",
            toDeptId
        );

        console.log(
            "IS CREATOR:",
            isCreator
        );

        console.log(
            "HAS ACTIVE MAPPING:",
            hasActiveMapping
        );

        console.log(
            "========================================"
        );


        if (
            !isCreator &&
            !hasActiveMapping
        ) {

            throw new ApiError(
                403,
                "You are not authorized to view this feedback."
            );

        }


        // =================================================
        // GET FEEDBACK
        // =================================================

        const feedback =
            await feedbackRepository
                .findBySurveyAndDepts(

                    Number(
                        surveyId
                    ),

                    Number(
                        fromDeptId
                    ),

                    Number(
                        toDeptId
                    )

                );


        if (!feedback) {

            return null;

        }


        // =================================================
        // GET RATINGS
        // =================================================

        const ratings =
            await feedbackDetailRepository
                .findByFeedbackId(
                    feedback.feedback_id
                );


        // =================================================
        // GET ACTIVE PARAMETERS
        // =================================================

        const activeParams =
            await this.getActiveParametersForSurvey(
                survey
            );


        // =================================================
        // CALCULATE USI
        // =================================================

        const usi =
            this.calculateUSI(
                ratings,
                activeParams
            );


        return {

            ...feedback,

            survey_type:
                survey.survey_type,

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
    // HOD - CREATOR FEEDBACK STATUS
    // =====================================================

    async getCreatorFeedbackStatus(
        surveyId,
        targetDepartmentId,
        userId
    ) {

        if (
            !surveyId ||
            !targetDepartmentId ||
            !userId
        ) {

            throw new ApiError(
                400,
                "surveyId, targetDepartmentId and userId are required"
            );

        }


        // =================================================
        // GET SURVEY
        // =================================================

        const survey =
            await surveyRepository
                .findById(
                    Number(
                        surveyId
                    )
                );


        if (!survey) {

            throw new ApiError(
                404,
                "Survey not found"
            );

        }


        // =================================================
        // CREATOR AUTHORIZATION
        // =================================================

        if (
            Number(
                survey.created_by
            ) !==
            Number(
                userId
            )
        ) {

            throw new ApiError(
                403,
                "You are not authorized to view feedback for this survey."
            );

        }


        // =================================================
        // GET EVALUATOR STATUS
        // =================================================

        return await feedbackRepository
            .getFeedbackSubmissionStatusForCreator(

                Number(
                    surveyId
                ),

                Number(
                    targetDepartmentId
                )

            );

    }


    // =====================================================
    // HOD - SUBMIT / SAVE FEEDBACK
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


        // =================================================
        // BASIC VALIDATION
        // =================================================

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


        // =================================================
        // STATUS VALIDATION
        // =================================================

        if (
            status !== "draft" &&
            status !== "submitted"
        ) {

            throw new ApiError(
                400,
                "Invalid status: must be 'draft' or 'submitted'"
            );

        }


        // =================================================
        // RATINGS ARRAY VALIDATION
        // =================================================

        if (
            !Array.isArray(
                ratings
            )
        ) {

            throw new ApiError(
                400,
                "ratings must be an array of parameter rating objects."
            );

        }


        // =================================================
        // FROM DEPARTMENT
        // =================================================

        const from_department_id =
            Number(
                user.department_id
            );


        if (
            !from_department_id
        ) {

            throw new ApiError(
                400,
                "The user does not belong to any department and cannot submit feedback."
            );

        }


        const surveyId =
            Number(
                survey_id
            );


        const toDepartmentId =
            Number(
                to_department_id
            );


        // =================================================
        // ID VALIDATION
        // =================================================

        if (
            !Number.isInteger(
                surveyId
            ) ||
            surveyId <= 0
        ) {

            throw new ApiError(
                400,
                "Invalid survey_id"
            );

        }


        if (
            !Number.isInteger(
                toDepartmentId
            ) ||
            toDepartmentId <= 0
        ) {

            throw new ApiError(
                400,
                "Invalid to_department_id"
            );

        }


        // =================================================
        // SAME DEPARTMENT CHECK
        // =================================================

        if (
            from_department_id ===
            toDepartmentId
        ) {

            throw new ApiError(
                400,
                "You cannot submit feedback to your own department."
            );

        }


        // =================================================
        // GET SURVEY
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
        // ACTIVE SURVEY VALIDATION
        // =================================================

        const activeSurvey =
            await surveyRepository
                .findActiveSurvey();


        if (
            !activeSurvey ||
            Number(
                activeSurvey.survey_id
            ) !== surveyId
        ) {

            throw new ApiError(
                400,
                "Feedback can only be saved or submitted for a currently active survey."
            );

        }


        // =================================================
        // DEPARTMENT MAPPING
        // =================================================

        const mapping =
            await departmentMappingRepository
                .findByFromAndTo(

                    surveyId,

                    from_department_id,

                    toDepartmentId

                );


        console.log(
            "========================================"
        );

        console.log(
            "🔥 FEEDBACK SUBMIT AUTHORIZATION"
        );

        console.log(
            "USER ID:",
            user.user_id
        );

        console.log(
            "USER ROLE:",
            user.role_name
        );

        console.log(
            "SURVEY ID:",
            surveyId
        );

        console.log(
            "SURVEY TYPE:",
            survey.survey_type
        );

        console.log(
            "FROM DEPARTMENT:",
            from_department_id
        );

        console.log(
            "TO DEPARTMENT:",
            toDepartmentId
        );

        console.log(
            "MAPPING:",
            mapping
        );

        console.log(
            "========================================"
        );


        if (!mapping) {

            throw new ApiError(
                403,
                "You do not have mapping permission to evaluate this department."
            );

        }


        if (
            mapping.status !== "active"
        ) {

            throw new ApiError(
                403,
                "This department evaluation mapping is inactive."
            );

        }


        // =================================================
        // CHECK EXISTING FEEDBACK
        // =================================================

        const feedback =
            await feedbackRepository
                .findBySurveyAndDepts(

                    surveyId,

                    from_department_id,

                    toDepartmentId

                );


        // =================================================
        // PREVENT MODIFYING SUBMITTED FEEDBACK
        // =================================================

        if (
            feedback &&
            feedback.status === "submitted"
        ) {

            throw new ApiError(
                400,
                "Feedback has already been finalized and submitted. You cannot modify it."
            );

        }


        // =================================================
        // GET ACTIVE PARAMETERS
        // =================================================

        const activeParams =
            await this.getActiveParametersForSurvey(
                survey
            );


        // =================================================
        // NO ACTIVE PARAMETERS
        // =================================================

        if (
            activeParams.length === 0
        ) {

            throw new ApiError(
                400,
                "No active parameters are configured for this survey."
            );

        }


        // =================================================
        // DETERMINE SURVEY TYPE
        // =================================================

        const isSpecialSurvey =
            String(
                survey.survey_type || ""
            ).toLowerCase() === "special";


        // =================================================
        // VALIDATE EACH RATING
        // =================================================

        for (
            const item of ratings
        ) {

            const {
                parameter_id,
                survey_parameter_id,
                rating
            } = item;


            // ---------------------------------------------
            // RATING REQUIRED
            // ---------------------------------------------

            if (
                rating === undefined ||
                rating === null
            ) {

                throw new ApiError(
                    400,
                    "Each rating object must contain rating."
                );

            }


            // ---------------------------------------------
            // RATING MUST BE INTEGER 1-5
            // ---------------------------------------------

            const rVal =
                Number(
                    rating
                );


            if (
                !Number.isInteger(
                    rVal
                ) ||
                rVal < 1 ||
                rVal > 5
            ) {

                throw new ApiError(
                    400,
                    "Ratings must be integers between 1 and 5 (inclusive)."
                );

            }


            // ---------------------------------------------
            // SPECIAL SURVEY
            // ---------------------------------------------

            if (
                isSpecialSurvey
            ) {

                if (
                    !survey_parameter_id
                ) {

                    throw new ApiError(
                        400,
                        "Each rating must contain survey_parameter_id for special survey."
                    );

                }


                const specialParameterExists =
                    activeParams.find(
                        parameter =>

                            Number(
                                parameter.survey_parameter_id
                            ) ===
                            Number(
                                survey_parameter_id
                            )
                    );


                if (
                    !specialParameterExists
                ) {

                    throw new ApiError(
                        400,
                        `Special parameter ID ${survey_parameter_id} is invalid or inactive.`
                    );

                }

            }


            // ---------------------------------------------
            // GENERAL SURVEY
            // ---------------------------------------------

            else {

                if (
                    !parameter_id
                ) {

                    throw new ApiError(
                        400,
                        "Each rating must contain parameter_id for general survey."
                    );

                }


                const parameterExists =
                    activeParams.find(
                        parameter =>

                            Number(
                                parameter.parameter_id
                            ) ===
                            Number(
                                parameter_id
                            )
                    );


                if (
                    !parameterExists
                ) {

                    throw new ApiError(
                        400,
                        `Parameter ID ${parameter_id} is invalid or inactive.`
                    );

                }

            }

        }


        // =================================================
        // PREVENT DUPLICATE PARAMETERS
        // =================================================

        const ratingIds =
            isSpecialSurvey

                ? ratings.map(
                    item =>
                        Number(
                            item.survey_parameter_id
                        )
                )

                : ratings.map(
                    item =>
                        Number(
                            item.parameter_id
                        )
                );


        const uniqueRatingIds =
            new Set(
                ratingIds
            );


        if (
            uniqueRatingIds.size !==
            ratingIds.length
        ) {

            throw new ApiError(
                400,
                "Duplicate parameter ratings are not allowed."
            );

        }


        // =================================================
        // SUBMITTED -> ALL ACTIVE PARAMETERS REQUIRED
        // =================================================

        if (
            status === "submitted"
        ) {

            const missingParams =
                activeParams.filter(
                    parameter => {

                        const parameterId =
                            isSpecialSurvey

                                ? Number(
                                    parameter.survey_parameter_id
                                )

                                : Number(
                                    parameter.parameter_id
                                );


                        return !uniqueRatingIds
                            .has(
                                parameterId
                            );

                    }
                );


            if (
                missingParams.length > 0
            ) {

                const missingNames =
                    missingParams
                        .map(
                            parameter =>
                                parameter.parameter_name
                        )
                        .join(", ");


                throw new ApiError(
                    400,
                    `Cannot submit. Missing ratings for parameters: ${missingNames}`
                );

            }

        }


        // =================================================
        // CREATE / UPDATE FEEDBACK
        // =================================================

        let feedbackId;


        if (!feedback) {

            feedbackId =
                await feedbackRepository
                    .create({

                        survey_id:
                            surveyId,

                        from_department_id:
                            from_department_id,

                        to_department_id:
                            toDepartmentId,

                        submitted_by:
                            user.user_id,

                        overall_comment:
                            overall_comment,

                        status:
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

                        overall_comment:
                            overall_comment,

                        status:
                            status

                    }

                );

        }


        // =================================================
        // UPSERT FEEDBACK DETAILS
        //
        // GENERAL:
        //     upsertGeneral()
        //
        // SPECIAL:
        //     upsertSpecial()
        // =================================================

        for (
            const item of ratings
        ) {

            const {
                parameter_id,
                survey_parameter_id,
                rating,
                comment
            } = item;


            if (
                isSpecialSurvey
            ) {

                await feedbackDetailRepository
                    .upsertSpecial(

                        feedbackId,

                        Number(
                            survey_parameter_id
                        ),

                        Number(
                            rating
                        ),

                        comment || null

                    );

            }

            else {

                await feedbackDetailRepository
                    .upsertGeneral(

                        feedbackId,

                        Number(
                            parameter_id
                        ),

                        Number(
                            rating
                        ),

                        comment || null

                    );

            }

        }


        // =================================================
        // RETURN UPDATED FEEDBACK
        // =================================================

        return await this
            .getFeedbackById(

                feedbackId,

                user.user_id,

                user.role_name

            );

    }

}


module.exports =
    new FeedbackService();