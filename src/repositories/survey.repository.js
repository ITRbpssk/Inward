const { pool } = require("../config/db");

class SurveyRepository {
    async findAll() {
        const [rows] = await pool.query("SELECT * FROM surveys ORDER BY survey_id DESC");
        return rows;
    }

    async findById(surveyId) {
        const [rows] = await pool.query("SELECT * FROM surveys WHERE survey_id = ?", [surveyId]);
        return rows[0] || null;
    }

    async findActiveSurvey() {
        const query = `
            SELECT * FROM surveys 
            WHERE status = 'active' AND CURDATE() BETWEEN start_date AND end_date
            LIMIT 1
        `;
        const [rows] = await pool.query(query);
        return rows[0] || null;
    }

    async create(surveyData) {
        const { survey_name, start_date, end_date, status } = surveyData;
        const query = `
            INSERT INTO surveys (survey_name, start_date, end_date, status)
            VALUES (?, ?, ?, ?)
        `;
        const [result] = await pool.query(query, [
            survey_name,
            start_date,
            end_date,
            status || "draft"
        ]);
        return result.insertId;
    }

    async update(surveyId, surveyData) {
        const { survey_name, start_date, end_date, status } = surveyData;
        const query = `
            UPDATE surveys 
            SET survey_name = ?, start_date = ?, end_date = ?, status = ?
            WHERE survey_id = ?
        `;
        const [result] = await pool.query(query, [
            survey_name,
            start_date,
            end_date,
            status,
            surveyId
        ]);
        return result.affectedRows > 0;
    }

    async delete(surveyId) {
        const query = "DELETE FROM surveys WHERE survey_id = ?";
        const [result] = await pool.query(query, [surveyId]);
        return result.affectedRows > 0;
    }
}

module.exports = new SurveyRepository();
