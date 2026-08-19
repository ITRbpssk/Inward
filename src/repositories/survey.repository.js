const { pool } = require("../config/db");

class SurveyRepository {

    // =====================================================
    // GET ALL SURVEYS
    // =====================================================

    async findAll() {

        const query = `
            SELECT *
            FROM surveys
            ORDER BY survey_id DESC
        `;

        const [rows] = await pool.query(query);

        return rows;
    }


    // =====================================================
    // GET SURVEYS BY DEPARTMENT
    // =====================================================

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


    // =====================================================
    // GET SURVEY BY ID
    // =====================================================

    async findById(surveyId) {

        const query = `
            SELECT *
            FROM surveys
            WHERE survey_id = ?
        `;

        const [rows] =
            await pool.query(
                query,
                [surveyId]
            );

        return rows[0] || null;
    }


    // =====================================================
    // GET ONE ACTIVE SURVEY
    //
    // BACKWARD COMPATIBILITY
    //
    // This method is kept for existing code that expects
    // a single survey.
    //
    // IMPORTANT:
    // Multiple active surveys ARE allowed.
    // This simply returns the latest active survey.
    // =====================================================

    async findActiveSurvey() {

        const query = `
            SELECT *
            FROM surveys
            WHERE status = 'active'
              AND CURDATE() BETWEEN start_date AND end_date
            ORDER BY survey_id DESC
            LIMIT 1
        `;

        const [rows] =
            await pool.query(query);

        return rows[0] || null;
    }


    // =====================================================
    // GET ALL ACTIVE SURVEYS
    //
    // IMPORTANT:
    // Multiple active surveys are allowed.
    // =====================================================

    async findActiveSurveys() {

        const query = `
            SELECT *
            FROM surveys
            WHERE status = 'active'
              AND CURDATE() BETWEEN start_date AND end_date
            ORDER BY survey_id DESC
        `;

        const [rows] =
            await pool.query(query);

        return rows;
    }


    // =====================================================
    // CREATE SURVEY
    // =====================================================

    async create(surveyData) {

        const {
            survey_name,
            start_date,
            end_date,
            status
        } = surveyData;

        const query = `
            INSERT INTO surveys
            (
                survey_name,
                start_date,
                end_date,
                status
            )
            VALUES (?, ?, ?, ?)
        `;

        const [result] =
            await pool.query(
                query,
                [
                    survey_name,
                    start_date,
                    end_date,
                    status || "draft"
                ]
            );

        return result.insertId;
    }


    // =====================================================
    // UPDATE SURVEY
    // =====================================================

    async update(
        surveyId,
        surveyData
    ) {

        const {
            survey_name,
            start_date,
            end_date,
            status
        } = surveyData;

        const query = `
            UPDATE surveys

            SET
                survey_name = ?,
                start_date = ?,
                end_date = ?,
                status = ?

            WHERE survey_id = ?
        `;

        const [result] =
            await pool.query(
                query,
                [
                    survey_name,
                    start_date,
                    end_date,
                    status,
                    surveyId
                ]
            );

        return result.affectedRows > 0;
    }


    // =====================================================
    // DELETE SURVEY
    // =====================================================

    async delete(surveyId) {

        const query = `
            DELETE FROM surveys
            WHERE survey_id = ?
        `;

        const [result] =
            await pool.query(
                query,
                [surveyId]
            );

        return result.affectedRows > 0;
    }

}

module.exports = new SurveyRepository();