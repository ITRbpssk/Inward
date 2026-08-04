const { pool } = require("../config/db");

class ParameterRepository {
    async findAll() {
        const [rows] = await pool.query("SELECT * FROM parameters ORDER BY display_order ASC");
        return rows;
    }

    async findById(parameterId) {
        const [rows] = await pool.query("SELECT * FROM parameters WHERE parameter_id = ?", [parameterId]);
        return rows[0] || null;
    }

    async create(paramData) {
        const { parameter_name, description, display_order, weightage, status } = paramData;
        const query = `
            INSERT INTO parameters (parameter_name, description, display_order, weightage, status)
            VALUES (?, ?, ?, ?, ?)
        `;
        const [result] = await pool.query(query, [
            parameter_name,
            description,
            display_order || 0,
            weightage || 0.00,
            status || "active"
        ]);
        return result.insertId;
    }

    async update(parameterId, paramData) {
        const { parameter_name, description, display_order, weightage, status } = paramData;
        const query = `
            UPDATE parameters 
            SET parameter_name = ?, description = ?, display_order = ?, weightage = ?, status = ?
            WHERE parameter_id = ?
        `;
        const [result] = await pool.query(query, [
            parameter_name,
            description,
            display_order,
            weightage,
            status,
            parameterId
        ]);
        return result.affectedRows > 0;
    }

    async delete(parameterId) {
        const query = "DELETE FROM parameters WHERE parameter_id = ?";
        const [result] = await pool.query(query, [parameterId]);
        return result.affectedRows > 0;
    }
}

module.exports = new ParameterRepository();
