const activityService =
    require("../services/activity.service");

const ApiResponse =
    require("../utils/ApiResponse");


// =====================================================
// GET ALL ACTIVITY LOGS
// =====================================================

const getAllActivityLogs = async (
    req,
    res,
    next
) => {

    try {

        const logs =
            await activityService
                .getAllActivityLogs();


        res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    logs,
                    "Activity logs fetched successfully"
                )
            );

    } catch (error) {

        next(error);

    }

};


// =====================================================
// GET ACTIVITY LOGS BY USER
// =====================================================

const getActivityLogsByUser = async (
    req,
    res,
    next
) => {

    try {

        const {
            userId
        } = req.params;


        const logs =
            await activityService
                .getActivityLogsByUser(
                    userId
                );


        res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    logs,
                    "User activity logs fetched successfully"
                )
            );

    } catch (error) {

        next(error);

    }

};


// =====================================================
// EXPORTS
// =====================================================

module.exports = {

    getAllActivityLogs,

    getActivityLogsByUser

};