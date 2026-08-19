const { pool } = require("../config/db");

class DepartmentRepository {

    // =====================================================
    // GET ALL DEPARTMENTS WITH HOD
    // =====================================================

    async findAll() {

        const query = `
            SELECT
                d.department_id,
                d.department_code,
                d.department_name,
                d.description,
                d.status,

                h.user_id AS hod_id,
                h.employee_id AS hod_employee_id,
                h.full_name AS hod_name,
                h.email AS hod_email,
                h.mobile AS hod_mobile

            FROM departments d

            LEFT JOIN users h
                ON h.department_id = d.department_id
                AND h.status = 'active'
                AND h.role_id = (
                    SELECT role_id
                    FROM roles
                    WHERE role_name = 'HOD'
                    LIMIT 1
                )

            ORDER BY d.department_id ASC
        `;

        const [rows] = await pool.query(query);

        return rows;
    }


    // =====================================================
    // GET DEPARTMENT BY ID WITH HOD
    // =====================================================

    async findById(departmentId) {

        const query = `
            SELECT
                d.department_id,
                d.department_code,
                d.department_name,
                d.description,
                d.status,

                h.user_id AS hod_id,
                h.employee_id AS hod_employee_id,
                h.full_name AS hod_name,
                h.email AS hod_email,
                h.mobile AS hod_mobile

            FROM departments d

            LEFT JOIN users h
                ON h.department_id = d.department_id
                AND h.status = 'active'
                AND h.role_id = (
                    SELECT role_id
                    FROM roles
                    WHERE role_name = 'HOD'
                    LIMIT 1
                )

            WHERE d.department_id = ?

            LIMIT 1
        `;

        const [rows] =
            await pool.query(
                query,
                [departmentId]
            );

        return rows[0] || null;
    }


    // =====================================================
    // FIND DEPARTMENT BY CODE
    // =====================================================

    async findByCode(departmentCode) {

        const [rows] = await pool.query(
            `
            SELECT *
            FROM departments
            WHERE department_code = ?
            `,
            [departmentCode]
        );

        return rows[0] || null;
    }


    // =====================================================
    // CREATE DEPARTMENT
    // =====================================================

    async create(deptData) {

        const {
            department_code,
            department_name,
            description,
            status
        } = deptData;

        const query = `
            INSERT INTO departments
            (
                department_code,
                department_name,
                description,
                status
            )
            VALUES (?, ?, ?, ?)
        `;

        const [result] =
            await pool.query(
                query,
                [
                    department_code,
                    department_name,
                    description,
                    status || "active"
                ]
            );

        return result.insertId;
    }


    // =====================================================
    // UPDATE DEPARTMENT
    // =====================================================

    async update(
        departmentId,
        deptData
    ) {

        const {
            department_code,
            department_name,
            description,
            status
        } = deptData;

        const query = `
            UPDATE departments
            SET
                department_code = ?,
                department_name = ?,
                description = ?,
                status = ?
            WHERE department_id = ?
        `;

        const [result] =
            await pool.query(
                query,
                [
                    department_code,
                    department_name,
                    description,
                    status,
                    departmentId
                ]
            );

        return result.affectedRows > 0;
    }


    // =====================================================
    // DELETE DEPARTMENT
    // =====================================================

    async delete(departmentId) {

        const query = `
            DELETE FROM departments
            WHERE department_id = ?
        `;

        const [result] =
            await pool.query(
                query,
                [departmentId]
            );

        return result.affectedRows > 0;
    }

}

module.exports = new DepartmentRepository();