const { pool } = require("../config/db");

class UserRepository {
    async findByEmployeeId(employeeId) {
        const query = `
    SELECT u.*, r.role_name, d.department_name, d.department_code
    FROM users u
    JOIN roles r ON u.role_id = r.role_id
    LEFT JOIN departments d ON u.department_id = d.department_id
    WHERE u.employee_id = ?
`;
        const [rows] = await pool.query(query, [employeeId]);
        return rows[0] || null;
    }

    async findByEmail(email) {

        const query = `
        SELECT
            u.*,
            r.role_name,
            d.department_name,
            d.department_code
        FROM users u
        JOIN roles r
            ON u.role_id = r.role_id
        LEFT JOIN departments d
            ON u.department_id = d.department_id
        WHERE u.email = ?
    `;

        const [rows] = await pool.query(query, [email]);

        return rows[0] || null;
    }



async createPasswordResetOtp(
    userId,
    otpHash,
    expiresAt
) {

    const query = `
        INSERT INTO password_reset_otps
        (
            user_id,
            otp_hash,
            expires_at
        )
        VALUES (?, ?, ?)
    `;

    const [result] =
        await pool.query(
            query,
            [
                userId,
                otpHash,
                expiresAt
            ]
        );

    return result.insertId;
}


async invalidateOldOtps(userId) {

    const query = `
        UPDATE password_reset_otps
        SET verified_at = NOW()
        WHERE user_id = ?
        AND verified_at IS NULL
    `;

    await pool.query(
        query,
        [userId]
    );
}

async findLatestPasswordResetOtp(userId) {

    const query = `
        SELECT *
        FROM password_reset_otps
        WHERE user_id = ?
        ORDER BY id DESC
        LIMIT 1
    `;

    const [rows] =
        await pool.query(
            query,
            [userId]
        );

    return rows[0] || null;
}

async incrementOtpAttempts(id) {

    const query = `
        UPDATE password_reset_otps
        SET attempts = attempts + 1
        WHERE id = ?
    `;

    await pool.query(
        query,
        [id]
    );
}

async markOtpVerified(id) {

    const query = `
        UPDATE password_reset_otps
        SET verified_at = NOW()
        WHERE id = ?
    `;

    await pool.query(
        query,
        [id]
    );
}






    async findById(userId) {
        const query = `
            SELECT u.*, r.role_name, d.department_name, d.department_code 
            FROM users u 
            JOIN roles r ON u.role_id = r.role_id 
            LEFT JOIN departments d ON u.department_id = d.department_id 
            WHERE u.user_id = ?
        `;
        const [rows] = await pool.query(query, [userId]);
        return rows[0] || null;
    }

    async findHODByDepartment(departmentId) {
        const query = `
            SELECT u.*, r.role_name, d.department_name, d.department_code 
            FROM users u 
            JOIN roles r ON u.role_id = r.role_id 
            LEFT JOIN departments d ON u.department_id = d.department_id 
            WHERE u.department_id = ? AND r.role_name = 'HOD' AND u.status = 'active'
        `;
        const [rows] = await pool.query(query, [departmentId]);
        return rows[0] || null;
    }

    async findAll() {
        const query = `
           SELECT
    u.user_id,
    u.employee_id,
    u.role_id,
    u.department_id,
    u.full_name,
    u.email,
    u.mobile,
    u.status,
    u.last_login,
    u.created_at,
    u.updated_at,
    r.role_name,
    d.department_name,
    d.department_code
            FROM users u 
            JOIN roles r ON u.role_id = r.role_id 
            LEFT JOIN departments d ON u.department_id = d.department_id
            ORDER BY u.user_id DESC
        `;
        const [rows] = await pool.query(query);
        return rows;
    }

    async create(userData) {
        const { role_id, department_id, employee_id, full_name, email, mobile, password, status } = userData;
        const query = `
            INSERT INTO users (role_id, department_id, employee_id, full_name, email, mobile, password, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;
        const [result] = await pool.query(query, [
            role_id,
            department_id,
            employee_id,
            full_name,
            email,
            mobile,
            password,
            status || "active"
        ]);
        return result.insertId;
    }

    async update(userId, userData) {
        const { role_id, department_id, employee_id, full_name, email, mobile, status } = userData;
        const query = `
            UPDATE users 
            SET role_id = ?, department_id = ?, employee_id = ?, full_name = ?, email = ?, mobile = ?, status = ?
            WHERE user_id = ?
        `;
        const [result] = await pool.query(query, [
            role_id,
            department_id,
            employee_id,
            full_name,
            email,
            mobile,
            status,
            userId
        ]);
        return result.affectedRows > 0;
    }

    async updatePassword(userId, hashedPassword) {
        const query = "UPDATE users SET password = ? WHERE user_id = ?";
        const [result] = await pool.query(query, [hashedPassword, userId]);
        return result.affectedRows > 0;
    }

    async updateLastLogin(userId) {
        const query = "UPDATE users SET last_login = NOW() WHERE user_id = ?";
        const [result] = await pool.query(query, [userId]);
        return result.affectedRows > 0;
    }

    async delete(userId) {
        const query = "DELETE FROM users WHERE user_id = ?";
        const [result] = await pool.query(query, [userId]);
        return result.affectedRows > 0;
    }
}

module.exports = new UserRepository();
