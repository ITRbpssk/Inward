const { pool } =
    require("../config/db");


class HodReportRepository {


    // =====================================================
    // HOD - GENERAL REPORT SOURCE
    //
    // IMPORTANT:
    //
    // HOD ला फक्त त्याच्या स्वतःच्या department ला
    // मिळालेला report दिसला पाहिजे.
    //
    // Example:
    //
    // IT HOD
    //
    // Agriculture -> IT
    // Accounts    -> IT
    // HR          -> IT
    // Computer    -> IT
    //
    // Report:
    //
    // IT | Q1 | Q2 | Q3 | Q4 | Yearly Average
    //
    // Evaluator departments चे submitted feedback
    // average करून IT चा score तयार होईल.
    // =====================================================

    async getGeneralReportSource(
        userId,
        financialYear,
        period = null
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

               AND f.status =
                   'submitted'

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

        `;


        const params = [

            Number(userId),

            financialYear

        ];


        // =================================================
        // PERIOD FILTER
        // =================================================

        if (
            period &&
            [
                "Q1",
                "Q2",
                "Q3",
                "Q4"
            ].includes(
                String(period)
                    .trim()
                    .toUpperCase()
            )
        ) {

            query += `

                AND s.quarter = ?

            `;


            params.push(

                String(period)
                    .trim()
                    .toUpperCase()

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
    // HOD - SPECIAL REPORT SOURCE
    // =====================================================

    async getSpecialReportSource(
        userId,
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

               AND f.status =
                   'submitted'

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

        `;


        const params = [

            Number(userId),

            financialYear

        ];


        // =================================================
        // OPTIONAL SPECIAL SURVEY FILTER
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
    // GET HOD'S TARGET DEPARTMENTS
    //
    // Normally this will contain the HOD's own department.
    //
    // Example:
    //
    // IT HOD
    //     -> IT
    //
    // The service uses this to make sure another
    // department can never appear in the HOD report.
    // =====================================================

    async getTargetDepartments(
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


        const [
            rows
        ] =
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
    // GET HOD SPECIAL SURVEYS
    // =====================================================

    async getSpecialSurveys(
        userId,
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

                created_by = ?

                AND financial_year = ?

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

                    Number(userId),

                    financialYear

                ]
            );


        return rows;

    }


    // =====================================================
    // GET ACTIVE GENERAL PARAMETERS
    // =====================================================

    async getActiveGeneralParameters() {

        const query = `

            SELECT

                parameter_id

            FROM parameters

            WHERE status = 'active'

            ORDER BY

                display_order ASC,

                parameter_id ASC

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
    // GET SPECIAL PARAMETERS
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

            WHERE

                survey_id = ?

                AND status = 'active'

            ORDER BY

                display_order ASC,

                survey_parameter_id ASC

        `;


        const [
            rows
        ] =
            await pool.query(
                query,
                [
                    Number(surveyId)
                ]
            );


        return rows;

    }

}


module.exports =
    new HodReportRepository();