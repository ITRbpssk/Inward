const { pool } = require("../config/db");

class DepartmentMappingRepository {
    async findAll() {
        const query = `
            SELECT dm.mapping_id, dm.from_department_id, dm.to_department_id, dm.status, dm.created_at, dm.updated_at,
                   f.department_name AS from_department_name, f.department_code AS from_department_code,
                   t.department_name AS to_department_name, t.department_code AS to_department_code
            FROM department_mappings dm
            JOIN departments f ON dm.from_department_id = f.department_id
            JOIN departments t ON dm.to_department_id = t.department_id
            ORDER BY dm.mapping_id DESC
        `;
        const [rows] = await pool.query(query);
        return rows;
    }

    async findById(mappingId) {
        const query = `
            SELECT dm.*,
                   f.department_name AS from_department_name, f.department_code AS from_department_code,
                   t.department_name AS to_department_name, t.department_code AS to_department_code
            FROM department_mappings dm
            JOIN departments f ON dm.from_department_id = f.department_id
            JOIN departments t ON dm.to_department_id = t.department_id
            WHERE dm.mapping_id = ?
        `;
        const [rows] = await pool.query(query, [mappingId]);
        return rows[0] || null;
    }

    async findByFromAndTo(fromDeptId, toDeptId) {
        const query = `
            SELECT * FROM department_mappings 
            WHERE from_department_id = ? AND to_department_id = ?
        `;
        const [rows] = await pool.query(query, [fromDeptId, toDeptId]);
        return rows[0] || null;
    }

    async findMappedToDepartments(fromDeptId) {
        const query = `
            SELECT dm.mapping_id, dm.to_department_id, d.department_name, d.department_code
            FROM department_mappings dm
            JOIN departments d ON dm.to_department_id = d.department_id
            WHERE dm.from_department_id = ? AND dm.status = 'active' AND d.status = 'active'
        `;
        const [rows] = await pool.query(query, [fromDeptId]);
        return rows;
    }

    async create(mappingData) {
        const { from_department_id, to_department_id, status } = mappingData;
        const query = `
            INSERT INTO department_mappings (from_department_id, to_department_id, status)
            VALUES (?, ?, ?)
        `;
        const [result] = await pool.query(query, [
            from_department_id,
            to_department_id,
            status || "active"
        ]);
        return result.insertId;
    }

    async update(mappingId, mappingData) {
        const { from_department_id, to_department_id, status } = mappingData;
        const query = `
            UPDATE department_mappings 
            SET from_department_id = ?, to_department_id = ?, status = ?
            WHERE mapping_id = ?
        `;
        const [result] = await pool.query(query, [
            from_department_id,
            to_department_id,
            status,
            mappingId
        ]);
        return result.affectedRows > 0;
    }

    async delete(mappingId) {
        const query = "DELETE FROM department_mappings WHERE mapping_id = ?";
        const [result] = await pool.query(query, [mappingId]);
        return result.affectedRows > 0;
    }
}

module.exports = new DepartmentMappingRepository();
