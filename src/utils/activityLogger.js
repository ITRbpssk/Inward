const { pool } =
    require("../config/db");


// =====================================================
// ACTIVITY LOGGER
// =====================================================
//
// This utility stores user activities in:
// usi.activity_logs
//
// IMPORTANT:
// Logging failure must NEVER break the main API request.
// =====================================================


const logActivity = async ({
    userId = null,
    action,
    module = null,
    description = null,
    method = null,
    endpoint = null,
    ipAddress = null,
    userAgent = null
}) => {

    try {

        // -------------------------------------------------
        // VALIDATION
        // -------------------------------------------------

        if (!action) {

            console.warn(
                "⚠️ ACTIVITY LOG SKIPPED: action missing"
            );

            return;

        }


        // -------------------------------------------------
        // INSERT ACTIVITY
        // -------------------------------------------------

        const query = `

            INSERT INTO activity_logs (

                user_id,
                action,
                module,
                description,
                method,
                endpoint,
                ip_address,
                user_agent

            )

            VALUES (?, ?, ?, ?, ?, ?, ?, ?)

        `;


        await pool.query(
            query,
            [

                userId,

                String(action)
                    .substring(0, 100),

                module
                    ? String(module)
                        .substring(0, 100)
                    : null,

                description
                    ? String(description)
                        .substring(0, 500)
                    : null,

                method
                    ? String(method)
                        .substring(0, 10)
                    : null,

                endpoint
                    ? String(endpoint)
                        .substring(0, 255)
                    : null,

                ipAddress
                    ? String(ipAddress)
                        .substring(0, 45)
                    : null,

                userAgent
                    ? String(userAgent)
                        .substring(0, 500)
                    : null

            ]
        );


        console.log(
            "📝 ACTIVITY LOG SAVED:",
            action
        );


    } catch (error) {

        // -------------------------------------------------
        // IMPORTANT
        // Activity logging failure must NOT affect
        // the original API request.
        // -------------------------------------------------

        console.error(
            "❌ ACTIVITY LOG ERROR:",
            error.message
        );

    }

};


// =====================================================
// EXPORT
// =====================================================

module.exports = {
    logActivity
};