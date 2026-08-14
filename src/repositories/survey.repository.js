const { pool } = require("../config/db");

class SurveyRepository {
    async findAll() {
        const [rows] = await pool.query("SELECT * FROM surveys ORDER BY survey_id DESC");
        return rows;
    }



    async findSurveysByDepartmentId(departmentId) {

    const query = `
        SELECT
            s.survey_id,
            s.survey_name,
            s.start_date,
            s.end_date,
            s.status,
            sd.survey_department_id,
            sd.department_id,
            d.department_code,
            d.department_name
        FROM surveys s

        INNER JOIN survey_departments sd
            ON s.survey_id = sd.survey_id

        INNER JOIN departments d
            ON sd.department_id = d.department_id

        WHERE sd.department_id = ?

        ORDER BY s.survey_id DESC
    `;

    const [rows] =
        await pool.query(
            query,
            [departmentId]
        );

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
