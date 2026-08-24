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



    async findByCreatedBy(userId) {

    const [rows] =
        await pool.query(
            `
            SELECT *
            FROM surveys
            WHERE created_by = ?
            ORDER BY survey_id DESC
            `,
            [userId]
        );

    return rows;

}

    // =====================================================
    // GET SURVEYS BY TARGET DEPARTMENT
    //
    // Used when a department is the target department
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
    // GET SURVEYS WHERE CURRENT DEPARTMENT IS EVALUATOR
    //
    // Example:
    //
    // HR evaluates IT
    //
    // HR HOD logs in
    //     ↓
    // HR is from_department
    //     ↓
    // IT is to_department
    //
    // Only surveys assigned to HR as evaluator are returned.
    // =====================================================

    async findSurveysByEvaluatorDepartmentId(departmentId) {

        const query = `
            SELECT
                s.survey_id,
                s.survey_name,
                s.start_date,
                s.end_date,
                s.status,

                dm.mapping_id,
                dm.from_department_id,
                dm.to_department_id,

                target.department_code AS target_department_code,
                target.department_name AS target_department_name,

                evaluator.department_code AS evaluator_department_code,
                evaluator.department_name AS evaluator_department_name

            FROM department_mappings dm

            INNER JOIN surveys s
                ON dm.survey_id = s.survey_id

            INNER JOIN departments evaluator
                ON dm.from_department_id = evaluator.department_id

            INNER JOIN departments target
                ON dm.to_department_id = target.department_id

            WHERE dm.from_department_id = ?
              AND dm.status = 'active'
              AND evaluator.status = 'active'
              AND target.status = 'active'

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
    // Returns latest active survey.
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
    //
    // OLD / BACKWARD COMPATIBILITY METHOD
    //
    // This creates only the survey record.
    //
    // New Create Survey flow should use:
    // createSurveyWithDepartments()
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
    // CREATE SURVEY WITH DEPARTMENT ASSIGNMENT
    //
    // This is the NEW main Create Survey method.
    //
    // Flow:
    //
    // 1. Create survey
    //
    // 2. Save target department
    //    survey_departments
    //
    // 3. Save evaluating departments
    //    department_mappings
    //
    // Everything happens inside ONE transaction.
    // =====================================================
async createSurveyWithDepartments(surveyData) {

    const {
        survey_name,
        start_date,
        end_date,
        status,
        created_by,
        target_department_id,
        evaluating_department_ids
    } = surveyData;


    const connection =
        await pool.getConnection();


    try {

        // =================================================
        // START TRANSACTION
        // =================================================

        await connection.beginTransaction();


        // =================================================
        // 1. CREATE SURVEY
        // =================================================

        const surveyQuery = `
            INSERT INTO surveys
            (
                survey_name,
                start_date,
                end_date,
                status,
                created_by
            )
            VALUES (?, ?, ?, ?, ?)
        `;


        const [surveyResult] =
            await connection.query(
                surveyQuery,
                [
                    survey_name,
                    start_date,
                    end_date,
                    status || "draft",
                    created_by
                ]
            );


        const surveyId =
            surveyResult.insertId;


        // =================================================
        // 2. SAVE TARGET DEPARTMENT
        // =================================================

        const targetDepartmentQuery = `
            INSERT INTO survey_departments
            (
                survey_id,
                department_id
            )
            VALUES (?, ?)
        `;


        await connection.query(
            targetDepartmentQuery,
            [
                surveyId,
                target_department_id
            ]
        );


        // =================================================
        // 3. SAVE EVALUATING DEPARTMENTS
        // =================================================

        const mappingQuery = `
            INSERT INTO department_mappings
            (
                survey_id,
                from_department_id,
                to_department_id,
                status
            )
            VALUES (?, ?, ?, ?)
        `;


        for (
            const evaluatingDepartmentId
            of evaluating_department_ids
        ) {

            await connection.query(
                mappingQuery,
                [
                    surveyId,
                    evaluatingDepartmentId,
                    target_department_id,
                    "active"
                ]
            );

        }


        // =================================================
        // COMMIT TRANSACTION
        // =================================================

        await connection.commit();


        return surveyId;


    } catch (error) {

        // =================================================
        // ROLLBACK
        // =================================================

        await connection.rollback();

        throw error;


    } finally {

        // =================================================
        // RELEASE CONNECTION
        // =================================================

        connection.release();

    }

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