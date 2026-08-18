const feedbackService =
    require("../services/feedback.service");

const ApiResponse =
    require("../utils/ApiResponse");


// =====================================================
// GET FEEDBACK BY ID
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
                    req.params.id
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
            req.user.department_id;

        console.log(
            "SURVEY ID:",
            survey_id
        );

        console.log(
            "FROM DEPARTMENT ID:",
            fromDeptId
        );

        const status =
            await feedbackService
                .getFeedbackStatusForHOD(
                    survey_id,
                    fromDeptId
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
// HR / ADMIN - EVALUATION STATUS
// =====================================================

const getFeedbackStatusForHR = async (
    req,
    res,
    next
) => {

    console.log("");
    console.log("========================================");
    console.log("🔥🔥 CONTROLLER REACHED 🔥🔥");
    console.log("CONTROLLER: getFeedbackStatusForHR");
    console.log("METHOD:", req.method);
    console.log("URL:", req.originalUrl);

    console.log(
        "USER:",
        req.user
    );

    console.log(
        "USER ID:",
        req.user?.user_id
    );

    console.log(
        "USER ROLE:",
        req.user?.role_name
    );

    console.log(
        "USER DEPARTMENT:",
        req.user?.department_id
    );

    console.log(
        "========================================");


    try {

        // -------------------------------------------------
        // QUERY PARAMETERS
        // -------------------------------------------------

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

        console.log(
            "SURVEY ID TYPE:",
            typeof survey_id
        );

        console.log(
            "FROM DEPARTMENT ID TYPE:",
            typeof from_department_id
        );


        // -------------------------------------------------
        // SERVICE CALL
        // -------------------------------------------------

        console.log(
            "➡️ CALLING feedbackService.getFeedbackStatusForHR()"
        );


        const status =
            await feedbackService
                .getFeedbackStatusForHR(
                    survey_id,
                    from_department_id
                );


        // -------------------------------------------------
        // SERVICE SUCCESS
        // -------------------------------------------------

        console.log(
            "✅ feedbackService.getFeedbackStatusForHR() SUCCESS"
        );

        console.log(
            "📤 SERVICE RESULT:",
            status
        );


        // -------------------------------------------------
        // RESPONSE
        // -------------------------------------------------

        console.log(
            "📤 SENDING 200 RESPONSE"
        );


        res
            .status(200)
            .json(

                new ApiResponse(
                    200,
                    status,
                    "HR feedback status fetched successfully"
                )

            );


    } catch (error) {

        console.error("");
        console.error(
            "❌❌ HR STATUS CONTROLLER ERROR ❌❌"
        );

        console.error(
            "ERROR MESSAGE:",
            error.message
        );

        console.error(
            "ERROR STATUS:",
            error.statusCode
        );

        console.error(
            "FULL ERROR:",
            error
        );

        console.error(
            "========================================"
        );

        next(error);

    }

};


// =====================================================
// HR / ADMIN - FEEDBACK DETAILS
// =====================================================

const getFeedbackDetailsForHR = async (
    req,
    res,
    next
) => {

    console.log("");
    console.log("========================================");
    console.log("🔥 CONTROLLER: getFeedbackDetailsForHR");
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


        console.log(
            "➡️ Calling getFeedbackDetailsForHR service"
        );


        const feedback =
            await feedbackService
                .getFeedbackDetailsForHR(
                    survey_id,
                    from_department_id,
                    to_department_id
                );


        console.log(
            "✅ getFeedbackDetailsForHR SERVICE SUCCESS"
        );

        console.log(
            "FEEDBACK RESULT:",
            feedback
        );


        res
            .status(200)
            .json(

                new ApiResponse(
                    200,
                    feedback,
                    "HR feedback details fetched successfully"
                )

            );


    } catch (error) {

        console.error(
            "❌ HR DETAILS ERROR:",
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
            to_department_id
        } = req.query;


        const fromDeptId =
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
                    to_department_id
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

    getFeedbackDetails,

    submitOrSaveFeedback,

    // HR / ADMIN
    getFeedbackStatusForHR,

    getFeedbackDetailsForHR

};