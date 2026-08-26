const { pool } = require("../config/db");

class DashboardRepository {

    // =====================================================
    // GET TARGET DEPARTMENTS
    //
    // Departments which are configured as target departments
    // in at least one survey.
    // =====================================================

    async findTargetDepartments() {

        const query = `
            SELECT DISTINCT

                d.department_id,
                d.department_code,
                d.department_name

            FROM survey_departments sd

            INNER JOIN surveys s
                ON s.survey_id = sd.survey_id

            INNER JOIN departments d
                ON d.department_id = sd.department_id

            WHERE
                d.status = 'active'

                AND s.status <> 'draft'

            ORDER BY
                d.department_name ASC
        `;

        const [rows] =
            await pool.query(query);

        return rows;
    }


    // =====================================================
    // FIND LATEST SURVEY
    //
    // Target Department + Quarter
    //
    // If multiple surveys exist for same combination,
    // latest survey_id is selected.
    // =====================================================

    async findSurveyByTargetDepartmentAndQuarter(
        targetDepartmentId,
        quarter
    ) {

        const query = `
            SELECT

                s.survey_id,
                s.survey_name,
                s.survey_type,
                s.financial_year,
                s.quarter,
                s.start_date,
                s.end_date,
                s.status,
                s.created_by

            FROM surveys s

            INNER JOIN survey_departments sd
                ON sd.survey_id = s.survey_id

            WHERE
                sd.department_id = ?

                AND s.quarter = ?

                AND s.status <> 'draft'

            ORDER BY
                s.survey_id DESC

            LIMIT 1
        `;

        const [rows] =
            await pool.query(
                query,
                [
                    targetDepartmentId,
                    quarter
                ]
            );

        return rows[0] || null;
    }


    // =====================================================
    // GET EVALUATION OVERVIEW
    //
    // Mapping:
    //
    // from_department_id
    //        =
    // Evaluating Department
    //
    // to_department_id
    //        =
    // Evaluation Target
    //
    // LEFT JOIN feedbacks:
    //
    // mapping exists + feedback exists
    //     => submitted
    //
    // mapping exists + feedback missing
    //     => pending
    // =====================================================

    async getEvaluationOverview(
        surveyId,
        targetDepartmentId
    ) {

        const query = `
            SELECT

                dm.mapping_id,

                dm.survey_id,

                dm.from_department_id
                    AS evaluating_department_id,

                dm.to_department_id
                    AS evaluation_target_id,

                evaluator.department_code
                    AS evaluating_department_code,

                evaluator.department_name
                    AS evaluating_department_name,

                target.department_code
                    AS evaluation_target_code,

                target.department_name
                    AS evaluation_target_name,

                f.feedback_id,

                COALESCE(
                    f.status,
                    'pending'
                ) AS feedback_status,

                f.submitted_on

            FROM department_mappings dm

            INNER JOIN departments evaluator
                ON evaluator.department_id =
                   dm.from_department_id

            INNER JOIN departments target
                ON target.department_id =
                   dm.to_department_id

            LEFT JOIN feedbacks f
                ON f.survey_id =
                   dm.survey_id

               AND f.from_department_id =
                   dm.from_department_id

               AND f.to_department_id =
                   dm.to_department_id

            WHERE
                dm.survey_id = ?

                AND dm.to_department_id = ?

                AND dm.status = 'active'

                AND evaluator.status = 'active'

                AND target.status = 'active'

            ORDER BY
                evaluator.department_name ASC
        `;

        const [rows] =
            await pool.query(
                query,
                [
                    surveyId,
                    targetDepartmentId
                ]
            );

        return rows;
    }

}

module.exports =
    new DashboardRepository();