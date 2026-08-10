const { pool } = require("../config/db");

class SurveyDepartmentRepository {

    async findBySurveyId(surveyId) {

        const query = `
            SELECT
                sd.survey_department_id,
                sd.survey_id,
                sd.department_id,
                d.department_code,
                d.department_name
            FROM survey_departments sd
            JOIN departments d
                ON sd.department_id = d.department_id
            WHERE sd.survey_id = ?
            ORDER BY d.department_name ASC
        `;

        const [rows] = await pool.query(query, [surveyId]);

        return rows;
    }


    async deleteBySurveyId(surveyId) {

        const query = `
            DELETE FROM survey_departments
            WHERE survey_id = ?
        `;

        const [result] = await pool.query(query, [surveyId]);

        return result.affectedRows;
    }


    async create(surveyId, departmentId) {

        const query = `
            INSERT INTO survey_departments
                (survey_id, department_id)
            VALUES (?, ?)
        `;

        const [result] = await pool.query(query, [
            surveyId,
            departmentId
        ]);

        return result.insertId;
    }

}


module.exports = new SurveyDepartmentRepository();