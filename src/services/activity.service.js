const activityRepository =
    require("../repositories/activity.repository");


// =====================================================
// ACTIVITY SERVICE
// =====================================================

class ActivityService {


    // =================================================
    // GET ALL ACTIVITY LOGS
    // =================================================

    async getAllActivityLogs() {

        const logs =
            await activityRepository
                .getAllActivityLogs();

        return logs;

    }


    // =================================================
    // GET ACTIVITY LOGS BY USER
    // =================================================

    async getActivityLogsByUser(
        userId
    ) {

        const logs =
            await activityRepository
                .getActivityLogsByUser(
                    userId
                );

        return logs;

    }

}


// =====================================================
// EXPORT
// =====================================================

module.exports =
    new ActivityService();