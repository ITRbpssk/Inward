const { pool } = require("../config/db");

class UserRepository {
    async findByEmail(email) {
        const query = `
            SELECT u.*, r.role_name, d.department_name, d.department_code 
            FROM users u 
            JOIN roles r ON u.role_id = r.role_id 
            LEFT JOIN departments d ON u.department_id = d.department_id 
            WHERE u.email = ?
        `;
        const [rows] = await pool.query(query, [email]);
        return rows[0] || null;
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
            SELECT u.user_id, u.role_id, u.department_id, u.full_name, u.email, u.mobile, u.status, u.last_login, u.created_at, u.updated_at,
                   r.role_name, d.department_name, d.department_code 
            FROM users u 
            JOIN roles r ON u.role_id = r.role_id 
            LEFT JOIN departments d ON u.department_id = d.department_id
            ORDER BY u.user_id DESC
        `;
        const [rows] = await pool.query(query);
        return rows;
    }

    async create(userData) {
        const { role_id, department_id, full_name, email, mobile, password, status } = userData;
        const query = `
            INSERT INTO users (role_id, department_id, full_name, email, mobile, password, status)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `;
        const [result] = await pool.query(query, [
            role_id,
            department_id,
            full_name,
            email,
            mobile,
            password,
            status || "active"
        ]);
        return result.insertId;
    }

    async update(userId, userData) {
        const { role_id, department_id, full_name, email, mobile, status } = userData;
        const query = `
            UPDATE users 
            SET role_id = ?, department_id = ?, full_name = ?, email = ?, mobile = ?, status = ?
            WHERE user_id = ?
        `;
        const [result] = await pool.query(query, [
            role_id,
            department_id,
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
