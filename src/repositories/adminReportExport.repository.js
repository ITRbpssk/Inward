const { pool } =
    require("../config/db");


class AdminReportExportRepository {


    // =====================================================
    // ADMIN - GENERAL EXPORT SOURCE
    //
    // Admin report:
    //
    // Department | Q1 | Q2 | Q3 | Q4 | Yearly Average
    //
    // For Q1/Q2/Q3/Q4:
    // only selected quarter is returned.
    //
    // For YEARLY:
    // all four quarters are returned.
    //
    // Only submitted feedback is joined.
    // =====================================================

    async getGeneralExportSource(
        financialYear,
        period = "YEARLY"
    ) {

        let query = `

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
        `;


        const params = [
            financialYear
        ];


        // =================================================
        // PERIOD FILTER
        // =================================================

        const normalizedPeriod =
            String(
                period || "YEARLY"
            )
                .trim()
                .toUpperCase();


        if (
            [
                "Q1",
                "Q2",
                "Q3",
                "Q4"
            ].includes(
                normalizedPeriod
            )
        ) {

            query += `

                AND s.quarter = ?

            `;


            params.push(
                normalizedPeriod
            );

        }


        query += `

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


        const [
            rows
        ] =
            await pool.query(
                query,
                params
            );


        return rows;

    }


    // =====================================================
    // ADMIN - SPECIAL EXPORT SOURCE
    //
    // ALL:
    //     all special surveys
    //
    // Special 1:
    //     only selected survey
    //
    // Only submitted feedback is joined.
    // =====================================================

    async getSpecialExportSource(
        financialYear,
        surveyId = null
    ) {

        let query = `

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
        `;


        const params = [
            financialYear
        ];


        // =================================================
        // OPTIONAL SURVEY FILTER
        // =================================================

        if (
            surveyId !== null &&
            surveyId !== undefined &&
            surveyId !== ''
        ) {

            query += `

                AND s.survey_id = ?

            `;


            params.push(
                Number(surveyId)
            );

        }


        query += `

            ORDER BY

                s.survey_id ASC,

                target.department_name ASC,

                evaluator.department_name ASC,

                dm.mapping_id ASC
        `;


        const [
            rows
        ] =
            await pool.query(
                query,
                params
            );


        return rows;

    }


    // =====================================================
    // GET ALL ACTIVE DEPARTMENTS
    //
    // Admin report must contain all active departments.
    //
    // No evaluation:
    //     null
    //
    // NOT:
    //     0
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


        const [
            rows
        ] =
            await pool.query(
                query
            );


        return rows;

    }


    // =====================================================
    // GET SPECIAL SURVEYS
    //
    // Used to convert:
    //
    // survey_id
    //
    // into:
    //
    // Special 1
    // Special 2
    // Special 3
    // =====================================================

    async getSpecialSurveys(
        financialYear
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

                financial_year = ?

                AND LOWER(
                    TRIM(
                        COALESCE(
                            survey_type,
                            ''
                        )
                    )
                ) = 'special'

                AND status <> 'draft'

            ORDER BY

                survey_id ASC

        `;


        const [
            rows
        ] =
            await pool.query(
                query,
                [
                    financialYear
                ]
            );


        return rows;

    }

}


module.exports =
    new AdminReportExportRepository();