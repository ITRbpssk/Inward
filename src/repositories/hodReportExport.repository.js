const { pool } =
    require("../config/db");


class HodReportExportRepository {


    // =====================================================
    // GET HOD GENERAL EXPORT SOURCE
    //
    // IMPORTANT:
    //
    // HOD = logged-in department
    //
    // Survey mapping:
    //
    // from_department_id = department evaluated BY HOD
    // to_department_id   = HOD department
    //
    // Therefore report department MUST be from_department_id.
    //
    // Example:
    //
    // Agriculture -> COMPUTER
    // Accounts    -> COMPUTER
    // HR          -> COMPUTER
    //
    // COMPUTER HOD report:
    //
    // Agriculture
    // Accounts
    // HR
    //
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


                /* =========================================
                   DEPARTMENT EVALUATED BY HOD

                   VERY IMPORTANT
                ========================================= */

                dm.from_department_id
                    AS target_department_id,


                evaluator.department_code
                    AS target_department_code,


                evaluator.department_name
                    AS target_department_name,


                /* =========================================
                   HOD / TARGET DEPARTMENT
                ========================================= */

                dm.to_department_id
                    AS hod_department_id,


                target.department_code
                    AS hod_department_code,


                target.department_name
                    AS hod_department_name,


                /* =========================================
                   MAPPING
                ========================================= */

                dm.mapping_id,


                dm.from_department_id
                    AS evaluator_department_id,


                evaluator.department_code
                    AS evaluator_department_code,


                evaluator.department_name
                    AS evaluator_department_name,


                /* =========================================
                   FEEDBACK
                ========================================= */

                f.feedback_id,

                f.status
                    AS feedback_status,

                f.submitted_on


            FROM surveys s


            /* =============================================
               SURVEY TARGET DEPARTMENT
            ============================================= */

            INNER JOIN survey_departments sd

                ON sd.survey_id =
                   s.survey_id


            INNER JOIN departments target

                ON target.department_id =
                   sd.department_id


            /* =============================================
               SURVEY MAPPINGS
            ============================================= */

            INNER JOIN department_mappings dm

                ON dm.survey_id =
                   s.survey_id

               AND dm.to_department_id =
                   sd.department_id


            /* =============================================
               DEPARTMENT EVALUATED BY HOD
            ============================================= */

            INNER JOIN departments evaluator

                ON evaluator.department_id =
                   dm.from_department_id


            /* =============================================
               SUBMITTED FEEDBACK ONLY
            ============================================= */

            LEFT JOIN feedbacks f

                ON f.survey_id =
                   dm.survey_id

               AND f.from_department_id =
                   dm.from_department_id

               AND f.to_department_id =
                   dm.to_department_id

               AND LOWER(
                    TRIM(
                        COALESCE(
                            f.status,
                            ''
                        )
                    )
               ) = 'submitted'


            WHERE

                /* =========================================
                   SURVEY CREATED BY LOGGED-IN HOD
                ========================================= */

                s.created_by = ?

                AND s.financial_year = ?


                /* =========================================
                   GENERAL SURVEY
                ========================================= */

                AND LOWER(
                    TRIM(
                        COALESCE(
                            s.survey_type,
                            'general'
                        )
                    )
                ) = 'general'


                /* =========================================
                   VALID QUARTER
                ========================================= */

                AND UPPER(
                    TRIM(
                        COALESCE(
                            s.quarter,
                            ''
                        )
                    )
                ) IN (

                    'Q1',
                    'Q2',
                    'Q3',
                    'Q4'

                )


                /* =========================================
                   DO NOT INCLUDE DRAFT
                ========================================= */

                AND LOWER(
                    TRIM(
                        COALESCE(
                            s.status,
                            ''
                        )
                    )
                ) <> 'draft'


                /* =========================================
                   ACTIVE MAPPING
                ========================================= */

                AND LOWER(
                    TRIM(
                        COALESCE(
                            dm.status,
                            ''
                        )
                    )
                ) = 'active'


                /* =========================================
                   ACTIVE HOD TARGET
                ========================================= */

                AND LOWER(
                    TRIM(
                        COALESCE(
                            target.status,
                            ''
                        )
                    )
                ) = 'active'


                /* =========================================
                   ACTIVE EVALUATED DEPARTMENT
                ========================================= */

                AND LOWER(
                    TRIM(
                        COALESCE(
                            evaluator.status,
                            ''
                        )
                    )
                ) = 'active'

        `;


        const params = [

            Number(userId),

            financialYear

        ];


        // =====================================================
        // QUARTER FILTER
        // =====================================================

        const normalizedPeriod =
            String(
                period || ""
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

                AND UPPER(
                    TRIM(
                        s.quarter
                    )
                ) = ?

            `;


            params.push(
                normalizedPeriod
            );

        }


        // =====================================================
        // ORDER
        //
        // HOD REPORT:
        //
        // Agriculture
        // Accounts
        // HR
        //
        // =====================================================

        query += `

            ORDER BY

                evaluator.department_name ASC,


                CASE
                    WHEN UPPER(
                        TRIM(
                            s.quarter
                        )
                    ) = 'Q1'
                    THEN 1

                    WHEN UPPER(
                        TRIM(
                            s.quarter
                        )
                    ) = 'Q2'
                    THEN 2

                    WHEN UPPER(
                        TRIM(
                            s.quarter
                        )
                    ) = 'Q3'
                    THEN 3

                    WHEN UPPER(
                        TRIM(
                            s.quarter
                        )
                    ) = 'Q4'
                    THEN 4

                    ELSE 5
                END,


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
    // GET HOD SPECIAL EXPORT SOURCE
    //
    // Same department logic as GENERAL.
    //
    // from_department_id = department evaluated by HOD
    // to_department_id   = HOD department
    //
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


                /* =========================================
                   DEPARTMENT EVALUATED BY HOD
                ========================================= */

                dm.from_department_id
                    AS target_department_id,


                evaluator.department_code
                    AS target_department_code,


                evaluator.department_name
                    AS target_department_name,


                /* =========================================
                   HOD DEPARTMENT
                ========================================= */

                dm.to_department_id
                    AS hod_department_id,


                target.department_code
                    AS hod_department_code,


                target.department_name
                    AS hod_department_name,


                /* =========================================
                   MAPPING
                ========================================= */

                dm.mapping_id,


                dm.from_department_id
                    AS evaluator_department_id,


                evaluator.department_code
                    AS evaluator_department_code,


                evaluator.department_name
                    AS evaluator_department_name,


                /* =========================================
                   FEEDBACK
                ========================================= */

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

               AND LOWER(
                    TRIM(
                        COALESCE(
                            f.status,
                            ''
                        )
               )) = 'submitted'


            WHERE

                s.created_by = ?

                AND s.financial_year = ?


                /* =========================================
                   SPECIAL SURVEY
                ========================================= */

                AND LOWER(
                    TRIM(
                        COALESCE(
                            s.survey_type,
                            ''
                        )
                    )
                ) = 'special'


                /* =========================================
                   DO NOT INCLUDE DRAFT
                ========================================= */

                AND LOWER(
                    TRIM(
                        COALESCE(
                            s.status,
                            ''
                        )
                    )
                ) <> 'draft'


                /* =========================================
                   ACTIVE MAPPING
                ========================================= */

                AND LOWER(
                    TRIM(
                        COALESCE(
                            dm.status,
                            ''
                        )
                    )
                ) = 'active'


                /* =========================================
                   ACTIVE DEPARTMENTS
                ========================================= */

                AND LOWER(
                    TRIM(
                        COALESCE(
                            target.status,
                            ''
                        )
                    )
                ) = 'active'


                AND LOWER(
                    TRIM(
                        COALESCE(
                            evaluator.status,
                            ''
                        )
                    )
                ) = 'active'

        `;


        const params = [

            Number(userId),

            financialYear

        ];


        // =====================================================
        // SPECIFIC SPECIAL SURVEY
        // =====================================================

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

                evaluator.department_name ASC,

                s.survey_id ASC,

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
    // GET HOD EVALUATED DEPARTMENTS
    //
    // VERY IMPORTANT
    //
    // This returns:
    //
    // from_department_id
    //
    // because HOD's report means:
    //
    // "Which departments did this HOD evaluate?"
    //
    // Example:
    //
    // Agriculture -> Computer
    // Accounts    -> Computer
    // HR          -> Computer
    //
    // Result:
    //
    // Agriculture
    // Accounts
    // HR
    //
    // =====================================================

    async getTargetDepartments(
        userId,
        financialYear,
        surveyType = "general"
    ) {

        const query = `

            SELECT DISTINCT

                evaluator.department_id,

                evaluator.department_code,

                evaluator.department_name


            FROM surveys s


            INNER JOIN survey_departments sd

                ON sd.survey_id =
                   s.survey_id


            INNER JOIN department_mappings dm

                ON dm.survey_id =
                   s.survey_id

               AND dm.to_department_id =
                   sd.department_id


            INNER JOIN departments target

                ON target.department_id =
                   dm.to_department_id


            INNER JOIN departments evaluator

                ON evaluator.department_id =
                   dm.from_department_id


            WHERE

                /* =========================================
                   LOGGED-IN HOD CREATED THE SURVEY
                ========================================= */

                s.created_by = ?

                AND s.financial_year = ?


                /* =========================================
                   SURVEY TYPE
                ========================================= */

                AND LOWER(
                    TRIM(
                        COALESCE(
                            s.survey_type,
                            'general'
                        )
                    )
                ) = LOWER(?)


                /* =========================================
                   DO NOT INCLUDE DRAFT
                ========================================= */

                AND LOWER(
                    TRIM(
                        COALESCE(
                            s.status,
                            ''
                        )
                    )
                ) <> 'draft'


                /* =========================================
                   ACTIVE MAPPING
                ========================================= */

                AND LOWER(
                    TRIM(
                        COALESCE(
                            dm.status,
                            ''
                        )
                    )
                ) = 'active'


                /* =========================================
                   ACTIVE TARGET
                ========================================= */

                AND LOWER(
                    TRIM(
                        COALESCE(
                            target.status,
                            ''
                        )
                    )
                ) = 'active'


                /* =========================================
                   ACTIVE EVALUATOR
                ========================================= */

                AND LOWER(
                    TRIM(
                        COALESCE(
                            evaluator.status,
                            ''
                        )
                    )
                ) = 'active'


            ORDER BY

                evaluator.department_name ASC

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


                AND LOWER(
                    TRIM(
                        COALESCE(
                            status,
                            ''
                        )
                    )
                ) <> 'draft'


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

}


module.exports =
    new HodReportExportRepository();