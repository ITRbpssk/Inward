const {
    pool
} = require("../config/db");


class ReportRepository {

    // =====================================================
    // FINANCIAL YEAR SURVEYS
    //
    // Example:
    // 2026 => 01-Apr-2026 to 31-Mar-2027
    // =====================================================

    async findSurveysForFinancialYear(
        financialYearStart
    ) {

        const startYear =
            Number(financialYearStart);

        const endYear =
            startYear + 1;

        const startDate =
            `${startYear}-04-01`;

        const endDate =
            `${endYear}-03-31`;


        const query = `
            SELECT
                s.survey_id,
                s.survey_name,
                LOWER(
                    TRIM(
                        COALESCE(
                            s.survey_type,
                            'general'
                        )
                    )
                ) AS survey_type,
                s.start_date,
                s.end_date,
                s.status,
                s.created_by
            FROM surveys s
            WHERE
                s.start_date <= ?
                AND s.end_date >= ?
            ORDER BY
                s.start_date ASC,
                s.survey_id ASC
        `;


        const [
            rows
        ] = await pool.query(
            query,
            [
                endDate,
                startDate
            ]
        );


        return rows;

    }


    // =====================================================
    // SINGLE SURVEY
    // =====================================================

    async findSurveyById(
        surveyId
    ) {

        const query = `
            SELECT
                s.survey_id,
                s.survey_name,
                LOWER(
                    TRIM(
                        COALESCE(
                            s.survey_type,
                            'general'
                        )
                    )
                ) AS survey_type,
                s.start_date,
                s.end_date,
                s.status,
                s.created_by
            FROM surveys s
            WHERE
                s.survey_id = ?
            LIMIT 1
        `;


        const [
            rows
        ] = await pool.query(
            query,
            [
                Number(surveyId)
            ]
        );


        return rows[0] || null;

    }


    // =====================================================
    // ALL ACTIVE DEPARTMENTS
    //
    // ADMIN REPORT
    // =====================================================

    async findAllDepartments() {

        const query = `
            SELECT
                department_id,
                department_code,
                department_name,
                status
            FROM departments
            WHERE
                status = 'active'
            ORDER BY
                department_name ASC
        `;


        const [
            rows
        ] = await pool.query(
            query
        );


        return rows;

    }


    // =====================================================
    // HOD TARGET DEPARTMENTS
    //
    // Used for quarterly report.
    //
    // Logged-in HOD department:
    //
    // from_department_id
    //
    // Target:
    //
    // to_department_id
    // =====================================================

    async findHODTargetDepartments(
        fromDepartmentId,
        financialYearStart
    ) {

        const startYear =
            Number(financialYearStart);

        const endYear =
            startYear + 1;

        const startDate =
            `${startYear}-04-01`;

        const endDate =
            `${endYear}-03-31`;


        const query = `
            SELECT DISTINCT
                d.department_id,
                d.department_code,
                d.department_name
            FROM department_mappings dm
            INNER JOIN surveys s
                ON dm.survey_id =
                   s.survey_id
            INNER JOIN departments d
                ON dm.to_department_id =
                   d.department_id
            WHERE
                dm.from_department_id = ?
                AND dm.status = 'active'
                AND d.status = 'active'
                AND s.start_date <= ?
                AND s.end_date >= ?
            ORDER BY
                d.department_name ASC
        `;


        const [
            rows
        ] = await pool.query(
            query,
            [
                Number(fromDepartmentId),
                endDate,
                startDate
            ]
        );


        return rows;

    }


    // =====================================================
    // HOD TARGET DEPARTMENTS FOR ONE SURVEY
    //
    // Used for special report.
    // =====================================================

    async findHODTargetDepartmentsForSurvey(
        fromDepartmentId,
        surveyId
    ) {

        const query = `
            SELECT DISTINCT
                d.department_id,
                d.department_code,
                d.department_name
            FROM department_mappings dm
            INNER JOIN departments d
                ON dm.to_department_id =
                   d.department_id
            WHERE
                dm.survey_id = ?
                AND dm.from_department_id = ?
                AND dm.status = 'active'
                AND d.status = 'active'
            ORDER BY
                d.department_name ASC
        `;


        const [
            rows
        ] = await pool.query(
            query,
            [
                Number(surveyId),
                Number(fromDepartmentId)
            ]
        );


        return rows;

    }


    // =====================================================
    // DEPARTMENT BY ID
    // =====================================================

    async findDepartmentById(
        departmentId
    ) {

        const query = `
            SELECT
                department_id,
                department_code,
                department_name,
                status
            FROM departments
            WHERE
                department_id = ?
            LIMIT 1
        `;


        const [
            rows
        ] = await pool.query(
            query,
            [
                Number(departmentId)
            ]
        );


        return rows[0] || null;

    }


    // =====================================================
    // ACTIVE MAPPINGS
    // =====================================================

    async findActiveMappings(
        surveyIds
    ) {

        if (
            !Array.isArray(surveyIds) ||
            surveyIds.length === 0
        ) {

            return [];

        }


        const placeholders =
            surveyIds
                .map(
                    () => '?'
                )
                .join(',');


        const query = `
            SELECT
                dm.mapping_id,
                dm.survey_id,
                dm.from_department_id,
                dm.to_department_id,
                dm.status,

                from_dept.department_code
                    AS from_department_code,

                from_dept.department_name
                    AS from_department_name,

                to_dept.department_code
                    AS to_department_code,

                to_dept.department_name
                    AS to_department_name

            FROM department_mappings dm

            INNER JOIN departments from_dept
                ON dm.from_department_id =
                   from_dept.department_id

            INNER JOIN departments to_dept
                ON dm.to_department_id =
                   to_dept.department_id

            WHERE
                dm.survey_id IN (
                    ${placeholders}
                )
                AND dm.status = 'active'
                AND from_dept.status = 'active'
                AND to_dept.status = 'active'

            ORDER BY
                dm.survey_id ASC,
                dm.mapping_id ASC
        `;


        const [
            rows
        ] = await pool.query(
            query,
            surveyIds
        );


        return rows;

    }


    // =====================================================
    // SUBMITTED FEEDBACK RATINGS
    //
    // GENERAL:
    // parameter_id
    //
    // SPECIAL:
    // survey_parameter_id
    // =====================================================

    async findSubmittedFeedbackRatings(
        surveyIds
    ) {

        if (
            !Array.isArray(surveyIds) ||
            surveyIds.length === 0
        ) {

            return [];

        }


        const placeholders =
            surveyIds
                .map(
                    () => '?'
                )
                .join(',');


        const query = `
            SELECT

                f.feedback_id,

                f.survey_id,

                f.from_department_id,

                f.to_department_id,

                f.status
                    AS feedback_status,

                s.survey_name,

                LOWER(
                    TRIM(
                        COALESCE(
                            s.survey_type,
                            'general'
                        )
                    )
                ) AS survey_type,

                s.start_date,

                s.end_date,

                fd.feedback_detail_id,

                fd.parameter_id,

                fd.survey_parameter_id,

                fd.rating,

                p.parameter_name
                    AS general_parameter_name,

                p.weightage
                    AS general_weightage,

                sp.parameter_name
                    AS special_parameter_name,

                sp.importance
                    AS special_importance

            FROM feedbacks f

            INNER JOIN surveys s
                ON f.survey_id =
                   s.survey_id

            INNER JOIN feedback_details fd
                ON f.feedback_id =
                   fd.feedback_id

            LEFT JOIN parameters p
                ON fd.parameter_id =
                   p.parameter_id

            LEFT JOIN special_parameters sp
                ON fd.survey_parameter_id =
                   sp.survey_parameter_id

            WHERE
                f.survey_id IN (
                    ${placeholders}
                )
                AND f.status = 'submitted'
                AND fd.rating IS NOT NULL

            ORDER BY
                f.survey_id ASC,
                f.feedback_id ASC,
                fd.feedback_detail_id ASC
        `;


        const [
            rows
        ] = await pool.query(
            query,
            surveyIds
        );


        return rows;

    }


    // =====================================================
    // ACTIVE GENERAL PARAMETERS
    // =====================================================

    async findActiveGeneralParameters() {

        const query = `
            SELECT
                parameter_id,
                parameter_name,
                weightage,
                status,
                display_order
            FROM parameters
            WHERE
                status = 'active'
            ORDER BY
                display_order ASC,
                parameter_id ASC
        `;


        const [
            rows
        ] = await pool.query(
            query
        );


        return rows;

    }


    // =====================================================
    // ACTIVE SPECIAL PARAMETERS
    // =====================================================

    async findActiveSpecialParameters(
        surveyIds
    ) {

        if (
            !Array.isArray(surveyIds) ||
            surveyIds.length === 0
        ) {

            return [];

        }


        const placeholders =
            surveyIds
                .map(
                    () => '?'
                )
                .join(',');


        const query = `
            SELECT
                survey_parameter_id,
                survey_id,
                parameter_id,
                parameter_name,
                importance,
                status,
                display_order
            FROM special_parameters
            WHERE
                survey_id IN (
                    ${placeholders}
                )
                AND status = 'active'
            ORDER BY
                survey_id ASC,
                display_order ASC,
                survey_parameter_id ASC
        `;


        const [
            rows
        ] = await pool.query(
            query,
            surveyIds
        );


        return rows;

    }

}


module.exports =
    new ReportRepository();