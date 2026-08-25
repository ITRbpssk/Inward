const feedbackService =
    require("../services/feedback.service");

const ApiResponse =
    require("../utils/ApiResponse");

const ApiError =
    require("../utils/ApiError");


// =====================================================
// GET FEEDBACK BY ID
// ADMIN + HOD
// =====================================================

const getFeedbackById = async (
    req,
    res,
    next
) => {

    console.log("");
    console.log("========================================");
    console.log("🔥 CONTROLLER: getFeedbackById");
    console.log("METHOD:", req.method);
    console.log("URL:", req.originalUrl);
    console.log("FEEDBACK ID:", req.params.id);
    console.log("USER:", req.user);
    console.log("========================================");

    try {

        const feedback =
            await feedbackService
                .getFeedbackById(
                    req.params.id,
                    req.user.user_id,
                    req.user.role_name
                );


        console.log(
            "✅ getFeedbackById SERVICE SUCCESS"
        );


        res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    feedback,
                    "Feedback fetched successfully"
                )
            );


    } catch (error) {

        console.error(
            "❌ getFeedbackById ERROR:",
            error
        );

        next(error);

    }

};


// =====================================================
// HOD - FEEDBACK STATUS
// =====================================================

const getFeedbackStatusForHOD = async (
    req,
    res,
    next
) => {

    console.log("");
    console.log("========================================");
    console.log("🔥 CONTROLLER: getFeedbackStatusForHOD");
    console.log("URL:", req.originalUrl);
    console.log("USER:", req.user);
    console.log("========================================");


    try {

        const {
            survey_id
        } = req.query;


        const fromDeptId =
            Number(
                req.user.department_id
            );


        const surveyId =
            Number(
                survey_id
            );


        console.log(
            "SURVEY ID:",
            surveyId
        );

        console.log(
            "FROM / EVALUATOR DEPARTMENT ID:",
            fromDeptId
        );

        console.log(
            "USER ID:",
            req.user.user_id
        );


        if (
            !surveyId ||
            !fromDeptId
        ) {

            throw new ApiError(
                400,
                "survey_id and user department are required"
            );

        }


        const status =
            await feedbackService
                .getFeedbackStatusForHOD(
                    surveyId,
                    fromDeptId,
                    req.user.user_id
                );


        console.log(
            "✅ HOD STATUS SERVICE SUCCESS"
        );

        console.log(
            "STATUS RESULT:",
            status
        );


        res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    status,
                    "Feedback status list fetched successfully"
                )
            );


    } catch (error) {

        console.error(
            "❌ HOD STATUS ERROR:",
            error
        );

        next(error);

    }

};


// =====================================================
// ADMIN - EVALUATION STATUS
//
// ADMIN functionality
// =====================================================

const getFeedbackStatusForAdmin = async (
    req,
    res,
    next
) => {

    console.log("");
    console.log("========================================");
    console.log("🔥 CONTROLLER: getFeedbackStatusForAdmin");
    console.log("METHOD:", req.method);
    console.log("URL:", req.originalUrl);
    console.log("USER:", req.user);
    console.log("========================================");


    try {

        const {
            survey_id,
            from_department_id
        } = req.query;


        console.log(
            "📥 QUERY PARAMETERS"
        );

        console.log(
            "SURVEY ID:",
            survey_id
        );

        console.log(
            "FROM DEPARTMENT ID:",
            from_department_id
        );


        const status =
            await feedbackService
                .getFeedbackStatusForAdmin(
                    survey_id,
                    from_department_id
                );


        console.log(
            "✅ ADMIN FEEDBACK STATUS SERVICE SUCCESS"
        );

        console.log(
            "📤 SERVICE RESULT:",
            status
        );


        res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    status,
                    "Feedback status fetched successfully"
                )
            );


    } catch (error) {

        console.error(
            "❌ ADMIN STATUS CONTROLLER ERROR:",
            error
        );

        next(error);

    }

};


// =====================================================
// HOD - CREATOR FEEDBACK STATUS
// =====================================================

const getCreatorFeedbackStatus = async (
    req,
    res,
    next
) => {

    console.log("");
    console.log("========================================");
    console.log("🔥 CREATOR FEEDBACK STATUS");
    console.log("URL:", req.originalUrl);
    console.log("USER:", req.user);
    console.log("========================================");


    try {

        const surveyId =
            Number(
                req.query.survey_id
            );


        const targetDepartmentId =
            Number(
                req.query.target_department_id
            );


        if (
            !surveyId ||
            !targetDepartmentId
        ) {

            throw new ApiError(
                400,
                "survey_id and target_department_id are required"
            );

        }


        const result =
            await feedbackService
                .getCreatorFeedbackStatus(
                    surveyId,
                    targetDepartmentId,
                    req.user.user_id
                );


        res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    result,
                    "Creator feedback status fetched successfully"
                )
            );


    } catch (error) {

        console.error(
            "❌ CREATOR FEEDBACK STATUS ERROR:",
            error
        );

        next(error);

    }

};


// =====================================================
// ADMIN - FEEDBACK DETAILS
// =====================================================

const getFeedbackDetailsForAdmin = async (
    req,
    res,
    next
) => {

    console.log("");
    console.log("========================================");
    console.log("🔥 CONTROLLER: getFeedbackDetailsForAdmin");
    console.log("URL:", req.originalUrl);
    console.log("USER:", req.user);
    console.log("========================================");


    try {

        const {
            survey_id,
            from_department_id,
            to_department_id
        } = req.query;


        console.log(
            "SURVEY ID:",
            survey_id
        );

        console.log(
            "FROM DEPARTMENT ID:",
            from_department_id
        );

        console.log(
            "TO DEPARTMENT ID:",
            to_department_id
        );


        const feedback =
            await feedbackService
                .getFeedbackDetailsForAdmin(
                    survey_id,
                    from_department_id,
                    to_department_id
                );


        console.log(
            "✅ ADMIN FEEDBACK DETAILS SERVICE SUCCESS"
        );


        res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    feedback,
                    "Feedback details fetched successfully"
                )
            );


    } catch (error) {

        console.error(
            "❌ ADMIN DETAILS ERROR:",
            error
        );

        next(error);

    }

};


// =====================================================
// HOD - FEEDBACK DETAILS
// =====================================================

const getFeedbackDetails = async (
    req,
    res,
    next
) => {

    console.log("");
    console.log("========================================");
    console.log("🔥 CONTROLLER: getFeedbackDetails");
    console.log("URL:", req.originalUrl);
    console.log("USER:", req.user);
    console.log("========================================");


    try {

        const {
            survey_id,
            from_department_id,
            to_department_id
        } = req.query;


        const fromDeptId =
            from_department_id ||
            req.user.department_id;


        console.log(
            "SURVEY ID:",
            survey_id
        );

        console.log(
            "FROM DEPARTMENT ID:",
            fromDeptId
        );

        console.log(
            "TO DEPARTMENT ID:",
            to_department_id
        );


        const feedback =
            await feedbackService
                .getFeedbackDetails(
                    survey_id,
                    fromDeptId,
                    to_department_id,
                    req.user.user_id
                );


        console.log(
            "✅ HOD FEEDBACK DETAILS SUCCESS"
        );


        res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    feedback,
                    "Feedback details fetched successfully"
                )
            );


    } catch (error) {

        console.error(
            "❌ HOD FEEDBACK DETAILS ERROR:",
            error
        );

        next(error);

    }

};


// =====================================================
// HOD - SUBMIT / SAVE FEEDBACK
// =====================================================

const submitOrSaveFeedback = async (
    req,
    res,
    next
) => {

    console.log("");
    console.log("========================================");
    console.log("🔥 CONTROLLER: submitOrSaveFeedback");
    console.log("USER:", req.user);
    console.log("BODY:", req.body);
    console.log("========================================");


    try {

        const result =
            await feedbackService
                .submitOrSaveFeedback(
                    req.user,
                    req.body
                );


        console.log(
            "✅ submitOrSaveFeedback SUCCESS"
        );


        const message =
            req.body.status === "submitted"
                ? "Feedback submitted successfully"
                : "Feedback draft saved successfully";


        res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    result,
                    message
                )
            );


    } catch (error) {

        console.error(
            "❌ submitOrSaveFeedback ERROR:",
            error
        );

        next(error);

    }

};


// =====================================================
// EXPORTS
// =====================================================

module.exports = {

    getFeedbackById,

    getFeedbackStatusForHOD,

    getCreatorFeedbackStatus,

    getFeedbackDetails,

    submitOrSaveFeedback,

    getFeedbackStatusForAdmin,

    getFeedbackDetailsForAdmin

};