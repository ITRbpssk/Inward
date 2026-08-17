const { pool } = require("../config/db");


class ProfileRepository {


    // =====================================================
    // GET MY PROFILE
    // =====================================================

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


    // =====================================================
    // GET USER WITH PASSWORD
    // =====================================================

    async findUserWithPassword(userId) {

        const query = `
            SELECT
                user_id,
                password
            FROM users
            WHERE user_id = ?
        `;


        const [rows] =
            await pool.query(
                query,
                [userId]
            );


        return rows[0] || null;

    }


    // =====================================================
    // UPDATE PASSWORD
    // =====================================================

    async updatePassword(
        userId,
        hashedPassword
    ) {

        const query = `
            UPDATE users
            SET password = ?
            WHERE user_id = ?
        `;


        const [result] =
            await pool.query(
                query,
                [
                    hashedPassword,
                    userId
                ]
            );


        return result.affectedRows > 0;

    }

}


module.exports =
    new ProfileRepository();