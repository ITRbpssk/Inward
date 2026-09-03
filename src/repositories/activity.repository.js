const { pool } =
    require("../config/db");


// =====================================================
// ACTIVITY REPOSITORY
// =====================================================

class ActivityRepository {


    // =================================================
    // GET ALL ACTIVITY LOGS
    // =================================================

    async getAllActivityLogs() {

        const query = `

            SELECT

                al.log_id,

                al.user_id,

                u.employee_id,

                u.full_name,

                al.action,

                al.module,

                al.description,

                al.method,

                al.endpoint,

                al.ip_address,

                al.user_agent,

                al.created_at

            FROM activity_logs al

            LEFT JOIN users u
                ON al.user_id = u.user_id

            ORDER BY
                al.created_at DESC

        `;


        const [
            rows
        ] =
            await pool.query(
                query
            );


        return rows;

    }


    // =================================================
    // GET ACTIVITY LOGS BY USER
    // =================================================

    async getActivityLogsByUser(
        userId
    ) {

        const query = `

            SELECT

                al.log_id,

                al.user_id,

                u.employee_id,

                u.full_name,

                al.action,

                al.module,

                al.description,

                al.method,

                al.endpoint,

                al.ip_address,

                al.user_agent,

                al.created_at

            FROM activity_logs al

            LEFT JOIN users u
                ON al.user_id = u.user_id

            WHERE
                al.user_id = ?

            ORDER BY
                al.created_at DESC

        `;


        const [
            rows
        ] =
            await pool.query(
                query,
                [
                    userId
                ]
            );


        return rows;

    }


}


// =====================================================
// EXPORT
// =====================================================

module.exports =
    new ActivityRepository();