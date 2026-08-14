const { pool } = require("../config/db");

class ProfileRepository {

    async findMyProfile(userId) {

        const query = `
            SELECT
                u.user_id,
                u.employee_id,
                u.full_name,
                u.email,
                u.mobile,
                u.status,
                u.last_login,
                u.created_at,

                r.role_id,
                r.role_name,

                d.department_id,
                d.department_name,
                d.department_code

            FROM users u

            INNER JOIN roles r
                ON u.role_id = r.role_id

            LEFT JOIN departments d
                ON u.department_id = d.department_id

            WHERE u.user_id = ?
        `;

        const [rows] =
            await pool.query(
                query,
                [userId]
            );

        return rows[0] || null;
    }

}

module.exports = new ProfileRepository();