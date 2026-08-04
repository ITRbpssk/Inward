const { pool } = require("../config/db");

class RoleRepository {
    async findAll() {
        const [rows] = await pool.query("SELECT * FROM roles ORDER BY role_id ASC");
        return rows;
    }

    async findById(roleId) {
        const [rows] = await pool.query("SELECT * FROM roles WHERE role_id = ?", [roleId]);
        return rows[0] || null;
    }

    async findByName(roleName) {
        const [rows] = await pool.query("SELECT * FROM roles WHERE role_name = ?", [roleName]);
        return rows[0] || null;
    }
}

module.exports = new RoleRepository();
