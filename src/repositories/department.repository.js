const { pool } = require("../config/db");

class DepartmentRepository {
    async findAll() {
        const [rows] = await pool.query("SELECT * FROM departments ORDER BY department_id ASC");
        return rows;
    }

    async findById(departmentId) {
        const [rows] = await pool.query("SELECT * FROM departments WHERE department_id = ?", [departmentId]);
        return rows[0] || null;
    }

    async findByCode(departmentCode) {
        const [rows] = await pool.query("SELECT * FROM departments WHERE department_code = ?", [departmentCode]);
        return rows[0] || null;
    }

    async create(deptData) {
        const { department_code, department_name, description, status } = deptData;
        const query = `
            INSERT INTO departments (department_code, department_name, description, status)
            VALUES (?, ?, ?, ?)
        `;
        const [result] = await pool.query(query, [
            department_code,
            department_name,
            description,
            status || "active"
        ]);
        return result.insertId;
    }

    async update(departmentId, deptData) {
        const { department_code, department_name, description, status } = deptData;
        const query = `
            UPDATE departments 
            SET department_code = ?, department_name = ?, description = ?, status = ?
            WHERE department_id = ?
        `;
        const [result] = await pool.query(query, [
            department_code,
            department_name,
            description,
            status,
            departmentId
        ]);
        return result.affectedRows > 0;
    }

    async delete(departmentId) {
        const query = "DELETE FROM departments WHERE department_id = ?";
        const [result] = await pool.query(query, [departmentId]);
        return result.affectedRows > 0;
    }
}

module.exports = new DepartmentRepository();
