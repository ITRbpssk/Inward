const { pool } = require("../config/db");


class ReportRepository {


    // =====================================================
    // HOD - GET GENERAL REPORT SOURCE DATA
    //
    // Logic:
    //
    // HOD creates:
    //     Q1
    //     Q2
    //     Q3
    //     Q4
    //
    // Each survey has:
    //
    //     target department
    //     evaluator departments
    //
    // Example:
    //
    // IT HOD creates Q1 for IT
    //
    // HR  -> IT
    // ACC -> IT
    // QA  -> IT
    //
    // Feedback scores will later be calculated by
    // FeedbackService.
    //
    // IMPORTANT:
    // Only SUBMITTED feedback is returned.
    //
    // Pending / draft feedback is NOT counted.
    // =====================================================

    async getHodGeneralReportSource(
        userId,
        financialYear
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
                s.created_by,

                sd.department_id
                    AS target_department_id,

                target.department_code
                    AS target_department_code,

                target.department_name
                    AS target_department_name,

                dm.mapping_id,

                dm.from_department_id
                    AS evaluator_department_id,

                evaluator.department_code
                    AS evaluator_department_code,

                evaluator.department_name
                    AS evaluator_department_name,

                f.feedback_id,

                f.status
                    AS feedback_status,

                f.submitted_on

            FROM surveys s

            INNER JOIN survey_departments sd
                ON sd.survey_id =
                   s.survey_id

            INNER JOIN departments target
                ON target.department_id =
                   sd.department_id

            INNER JOIN department_mappings dm
                ON dm.survey_id =
                   s.survey_id

               AND dm.to_department_id =
                   sd.department_id

            INNER JOIN departments evaluator
                ON evaluator.department_id =
                   dm.from_department_id

            LEFT JOIN feedbacks f
                ON f.survey_id =
                   dm.survey_id

               AND f.from_department_id =
                   dm.from_department_id

               AND f.to_department_id =
                   dm.to_department_id

               AND f.status = 'submitted'

            WHERE
                s.created_by = ?

                AND s.financial_year = ?

                AND LOWER(
                    TRIM(
                        COALESCE(
                            s.survey_type,
                            'general'
                        )
                    )
                ) = 'general'

                AND s.quarter IN (
                    'Q1',
                    'Q2',
                    'Q3',
                    'Q4'
                )

                AND s.status <> 'draft'

                AND dm.status = 'active'

                AND target.status = 'active'

                AND evaluator.status = 'active'

            ORDER BY

                CASE s.quarter
                    WHEN 'Q1' THEN 1
                    WHEN 'Q2' THEN 2
                    WHEN 'Q3' THEN 3
                    WHEN 'Q4' THEN 4
                    ELSE 5
                END,

                target.department_name ASC,

                evaluator.department_name ASC,

                dm.mapping_id ASC
        `;


        const [rows] =
            await pool.query(
                query,
                [
                    Number(userId),
                    financialYear
                ]
            );


        return rows;
    }


    // =====================================================
    // HOD - GET SPECIAL REPORT SOURCE DATA
    //
    // Special surveys do NOT use Q1/Q2/Q3/Q4.
    //
    // They are displayed as:
    //
    //     Special 1
    //     Special 2
    //     Special 3
    //     Special 4
    //
    // The order is based on survey_id ASC for the
    // selected financial year and HOD.
    //
    // IMPORTANT:
    // Only SUBMITTED feedback is returned.
    // =====================================================

    async getHodSpecialReportSource(
        userId,
        financialYear
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
                s.created_by,

                sd.department_id
                    AS target_department_id,

                target.department_code
                    AS target_department_code,

                target.department_name
                    AS target_department_name,

                dm.mapping_id,

                dm.from_department_id
                    AS evaluator_department_id,

                evaluator.department_code
                    AS evaluator_department_code,

                evaluator.department_name
                    AS evaluator_department_name,

                f.feedback_id,

                f.status
                    AS feedback_status,

                f.submitted_on

            FROM surveys s

            INNER JOIN survey_departments sd
                ON sd.survey_id =
                   s.survey_id

            INNER JOIN departments target
                ON target.department_id =
                   sd.department_id

            INNER JOIN department_mappings dm
                ON dm.survey_id =
                   s.survey_id

               AND dm.to_department_id =
                   sd.department_id

            INNER JOIN departments evaluator
                ON evaluator.department_id =
                   dm.from_department_id

            LEFT JOIN feedbacks f
                ON f.survey_id =
                   dm.survey_id

               AND f.from_department_id =
                   dm.from_department_id

               AND f.to_department_id =
                   dm.to_department_id

               AND f.status = 'submitted'

            WHERE
                s.created_by = ?

                AND s.financial_year = ?

                AND LOWER(
                    TRIM(
                        COALESCE(
                            s.survey_type,
                            ''
                        )
                    )
                ) = 'special'

                AND s.status <> 'draft'

                AND dm.status = 'active'

                AND target.status = 'active'

                AND evaluator.status = 'active'

            ORDER BY

                s.survey_id ASC,

                target.department_name ASC,

                evaluator.department_name ASC,

                dm.mapping_id ASC
        `;


        const [rows] =
            await pool.query(
                query,
                [
                    Number(userId),
                    financialYear
                ]
            );


        return rows;
    }


    // =====================================================
    // ADMIN - GET GENERAL REPORT SOURCE DATA
    //
    // Admin sees ALL departments.
    //
    // Structure later becomes:
    //
    // Department | Q1 | Q2 | Q3 | Q4 | Yearly Average
    //
    // Each quarter score is calculated from the
    // submitted evaluator feedback for that target
    // department.
    //
    // IMPORTANT:
    // Pending / draft feedback is NOT returned.
    // =====================================================

    async getAdminGeneralReportSource(
        financialYear
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
                s.created_by,

                sd.department_id
                    AS target_department_id,

                target.department_code
                    AS target_department_code,

                target.department_name
                    AS target_department_name,

                dm.mapping_id,

                dm.from_department_id
                    AS evaluator_department_id,

                evaluator.department_code
                    AS evaluator_department_code,

                evaluator.department_name
                    AS evaluator_department_name,

                f.feedback_id,

                f.status
                    AS feedback_status,

                f.submitted_on

            FROM surveys s

            INNER JOIN survey_departments sd
                ON sd.survey_id =
                   s.survey_id

            INNER JOIN departments target
                ON target.department_id =
                   sd.department_id

            INNER JOIN department_mappings dm
                ON dm.survey_id =
                   s.survey_id

               AND dm.to_department_id =
                   sd.department_id

            INNER JOIN departments evaluator
                ON evaluator.department_id =
                   dm.from_department_id

            LEFT JOIN feedbacks f
                ON f.survey_id =
                   dm.survey_id

               AND f.from_department_id =
                   dm.from_department_id

               AND f.to_department_id =
                   dm.to_department_id

               AND f.status = 'submitted'

            WHERE

                s.financial_year = ?

                AND LOWER(
                    TRIM(
                        COALESCE(
                            s.survey_type,
                            'general'
                        )
                    )
                ) = 'general'

                AND s.quarter IN (
                    'Q1',
                    'Q2',
                    'Q3',
                    'Q4'
                )

                AND s.status <> 'draft'

                AND dm.status = 'active'

                AND target.status = 'active'

                AND evaluator.status = 'active'

            ORDER BY

                target.department_name ASC,

                CASE s.quarter
                    WHEN 'Q1' THEN 1
                    WHEN 'Q2' THEN 2
                    WHEN 'Q3' THEN 3
                    WHEN 'Q4' THEN 4
                    ELSE 5
                END,

                evaluator.department_name ASC,

                dm.mapping_id ASC
        `;


        const [rows] =
            await pool.query(
                query,
                [
                    financialYear
                ]
            );


        return rows;
    }


    // =====================================================
    // ADMIN - GET SPECIAL REPORT SOURCE DATA
    //
    // ALL departments.
    //
    // Special surveys are numbered:
    //
    //     Special 1
    //     Special 2
    //     Special 3
    //     Special 4
    //
    // based on survey_id ASC.
    //
    // No yearly average will be calculated later.
    // =====================================================

    async getAdminSpecialReportSource(
        financialYear
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
                s.created_by,

                sd.department_id
                    AS target_department_id,

                target.department_code
                    AS target_department_code,

                target.department_name
                    AS target_department_name,

                dm.mapping_id,

                dm.from_department_id
                    AS evaluator_department_id,

                evaluator.department_code
                    AS evaluator_department_code,

                evaluator.department_name
                    AS evaluator_department_name,

                f.feedback_id,

                f.status
                    AS feedback_status,

                f.submitted_on

            FROM surveys s

            INNER JOIN survey_departments sd
                ON sd.survey_id =
                   s.survey_id

            INNER JOIN departments target
                ON target.department_id =
                   sd.department_id

            INNER JOIN department_mappings dm
                ON dm.survey_id =
                   s.survey_id

               AND dm.to_department_id =
                   sd.department_id

            INNER JOIN departments evaluator
                ON evaluator.department_id =
                   dm.from_department_id

            LEFT JOIN feedbacks f
                ON f.survey_id =
                   dm.survey_id

               AND f.from_department_id =
                   dm.from_department_id

               AND f.to_department_id =
                   dm.to_department_id

               AND f.status = 'submitted'

            WHERE

                s.financial_year = ?

                AND LOWER(
                    TRIM(
                        COALESCE(
                            s.survey_type,
                            ''
                        )
                    )
                ) = 'special'

                AND s.status <> 'draft'

                AND dm.status = 'active'

                AND target.status = 'active'

                AND evaluator.status = 'active'

            ORDER BY

                s.survey_id ASC,

                target.department_name ASC,

                evaluator.department_name ASC,

                dm.mapping_id ASC
        `;


        const [rows] =
            await pool.query(
                query,
                [
                    financialYear
                ]
            );


        return rows;
    }


    // =====================================================
    // GET ACTIVE GENERAL PARAMETERS
    //
    // Used by report calculation to keep report score
    // compatible with FeedbackService.calculateUSI().
    // =====================================================

    async getActiveGeneralParameterCount() {

        const query = `
            SELECT
                parameter_id
            FROM parameters
            WHERE status = 'active'
            ORDER BY
                display_order ASC,
                parameter_id ASC
        `;


        const [rows] =
            await pool.query(query);


        return rows;
    }


    // =====================================================
    // GET SPECIAL PARAMETERS FOR SURVEY
    //
    // Used by report calculation.
    // =====================================================

    async getActiveSpecialParameters(
        surveyId
    ) {

        const query = `
            SELECT

                survey_parameter_id,
                survey_id,
                parameter_id,
                parameter_name,
                description,
                importance,
                display_order,
                status

            FROM special_parameters

            WHERE survey_id = ?

              AND status = 'active'

            ORDER BY

                display_order ASC,

                survey_parameter_id ASC
        `;


        const [rows] =
            await pool.query(
                query,
                [
                    Number(surveyId)
                ]
            );


        return rows;
    }


    // =====================================================
    // GET DEPARTMENTS
    //
    // Used to build report rows even when a department has
    // no submitted evaluation.
    //
    // IMPORTANT:
    // This does NOT mean zero score.
    //
    // The service will represent it as null / NOT EVALUATED.
    // =====================================================

    async getActiveDepartments() {

        const query = `
            SELECT

                department_id,
                department_code,
                department_name

            FROM departments

            WHERE status = 'active'

            ORDER BY
                department_name ASC
        `;


        const [rows] =
            await pool.query(query);


        return rows;
    }


    // =====================================================
    // GET HOD TARGET DEPARTMENTS
    //
    // Used when building the HOD report.
    //
    // Only departments which were actually configured
    // as targets in the HOD's surveys are returned.
    // =====================================================

    async getHodTargetDepartments(
        userId,
        financialYear,
        surveyType
    ) {

        const query = `
            SELECT DISTINCT

                d.department_id,
                d.department_code,
                d.department_name

            FROM surveys s

            INNER JOIN survey_departments sd
                ON sd.survey_id =
                   s.survey_id

            INNER JOIN departments d
                ON d.department_id =
                   sd.department_id

            WHERE

                s.created_by = ?

                AND s.financial_year = ?

                AND LOWER(
                    TRIM(
                        COALESCE(
                            s.survey_type,
                            ''
                        )
                    )
                ) = LOWER(?)

                AND s.status <> 'draft'

                AND d.status = 'active'

            ORDER BY
                d.department_name ASC
        `;


        const [rows] =
            await pool.query(
                query,
                [
                    Number(userId),
                    financialYear,
                    surveyType
                ]
            );


        return rows;
    }


    // =====================================================
    // GET SURVEYS CREATED BY HOD
    //
    // Useful for determining Special 1, Special 2...
    //
    // The service assigns display labels.
    // =====================================================

    async getHodSurveys(
        userId,
        financialYear,
        surveyType
    ) {

        const query = `
            SELECT

                survey_id,
                survey_name,
                survey_type,
                financial_year,
                quarter,
                start_date,
                end_date,
                status,
                created_by

            FROM surveys

            WHERE

                created_by = ?

                AND financial_year = ?

                AND LOWER(
                    TRIM(
                        COALESCE(
                            survey_type,
                            ''
                        )
                    )
                ) = LOWER(?)

                AND status <> 'draft'

            ORDER BY

                survey_id ASC
        `;


        const [rows] =
            await pool.query(
                query,
                [
                    Number(userId),
                    financialYear,
                    surveyType
                ]
            );


        return rows;
    }

}


module.exports =
    new ReportRepository();