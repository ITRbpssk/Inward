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

        const [rows] =
            await pool.query(query);

        return rows;
    }


    // =====================================================
    // GET SURVEYS CREATED BY USER
    // =====================================================

    async findByCreatedBy(userId) {

        const query = `
            SELECT *
            FROM surveys
            WHERE created_by = ?
            ORDER BY survey_id DESC
        `;

        const [rows] =
            await pool.query(
                query,
                [userId]
            );

        return rows;
    }


    // =====================================================
    // GET SURVEYS BY TARGET DEPARTMENT
    // =====================================================

    async findSurveysByDepartmentId(
        departmentId
    ) {

        const query = `
            SELECT
                s.survey_id,
                s.survey_name,
                s.survey_type,
                s.start_date,
                s.end_date,
                s.status,
                s.created_by,

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
    // =====================================================

    async findSurveysByEvaluatorDepartmentId(
        departmentId
    ) {

        const query = `
            SELECT
                s.survey_id,
                s.survey_name,
                s.survey_type,
                s.start_date,
                s.end_date,
                s.status,
                s.created_by,

                dm.mapping_id,
                dm.from_department_id,
                dm.to_department_id,

                target.department_code
                    AS target_department_code,

                target.department_name
                    AS target_department_name,

                evaluator.department_code
                    AS evaluator_department_code,

                evaluator.department_name
                    AS evaluator_department_name

            FROM department_mappings dm

            INNER JOIN surveys s
                ON dm.survey_id = s.survey_id

            INNER JOIN departments evaluator
                ON dm.from_department_id =
                   evaluator.department_id

            INNER JOIN departments target
                ON dm.to_department_id =
                   target.department_id

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
    //
    // ALSO RETURNS SPECIAL PARAMETERS
    // =====================================================

    async findById(
        surveyId
    ) {

        const surveyQuery = `
            SELECT *
            FROM surveys
            WHERE survey_id = ?
        `;

        const [surveyRows] =
            await pool.query(
                surveyQuery,
                [surveyId]
            );

        if (
            surveyRows.length === 0
        ) {

            return null;

        }

        const survey =
            surveyRows[0];


        // =================================================
        // SPECIAL PARAMETERS
        // =================================================

        const specialParameterQuery = `
            SELECT
                survey_parameter_id,
                survey_id,
                parameter_id,
                parameter_name,
                description,
                importance,
                display_order,
                status,
                created_at,
                updated_at

            FROM special_parameters

            WHERE survey_id = ?

            ORDER BY
                display_order ASC,
                survey_parameter_id ASC
        `;


        const [specialParameters] =
            await pool.query(
                specialParameterQuery,
                [surveyId]
            );


        survey.special_parameters =
            specialParameters;


        return survey;
    }


    // =====================================================
    // GET ONE ACTIVE SURVEY
    //
    // ALSO RETURNS SPECIAL PARAMETERS
    // =====================================================

    async findActiveSurvey() {

        const query = `
            SELECT *
            FROM surveys
            WHERE status = 'active'

              AND CURDATE()
                  BETWEEN start_date AND end_date

            ORDER BY survey_id DESC

            LIMIT 1
        `;

        const [rows] =
            await pool.query(query);


        if (
            rows.length === 0
        ) {

            return null;

        }


        const survey =
            rows[0];


        // =================================================
        // LOAD SPECIAL PARAMETERS
        // =================================================

        const specialQuery = `
            SELECT
                survey_parameter_id,
                survey_id,
                parameter_id,
                parameter_name,
                description,
                importance,
                display_order,
                status,
                created_at,
                updated_at

            FROM special_parameters

            WHERE survey_id = ?

            ORDER BY
                display_order ASC,
                survey_parameter_id ASC
        `;


        const [specialParameters] =
            await pool.query(
                specialQuery,
                [survey.survey_id]
            );


        survey.special_parameters =
            specialParameters;


        return survey;
    }


    // =====================================================
    // GET ALL ACTIVE SURVEYS
    // =====================================================

    async findActiveSurveys() {

        const query = `
            SELECT *
            FROM surveys
            WHERE status = 'active'

              AND CURDATE()
                  BETWEEN start_date AND end_date

            ORDER BY survey_id DESC
        `;

        const [rows] =
            await pool.query(query);


        // =================================================
        // LOAD SPECIAL PARAMETERS FOR EACH SURVEY
        // =================================================

        for (
            const survey
            of rows
        ) {

            const specialQuery = `
                SELECT
                    survey_parameter_id,
                    survey_id,
                    parameter_id,
                    parameter_name,
                    description,
                    importance,
                    display_order,
                    status,
                    created_at,
                    updated_at

                FROM special_parameters

                WHERE survey_id = ?

                ORDER BY
                    display_order ASC,
                    survey_parameter_id ASC
            `;


            const [
                specialParameters
            ] =
                await pool.query(
                    specialQuery,
                    [survey.survey_id]
                );


            survey.special_parameters =
                specialParameters;

        }


        return rows;
    }


    // =====================================================
    // OLD CREATE
    // =====================================================

    async create(
        surveyData
    ) {

        const {
            survey_name,
            survey_type,
            start_date,
            end_date,
            status,
            created_by
        } = surveyData;


        const query = `
            INSERT INTO surveys
            (
                survey_name,
                survey_type,
                start_date,
                end_date,
                status,
                created_by
            )

            VALUES (?, ?, ?, ?, ?, ?)
        `;


        const [result] =
            await pool.query(
                query,
                [
                    survey_name,
                    survey_type || "general",
                    start_date,
                    end_date,
                    status || "draft",
                    created_by || null
                ]
            );


        return result.insertId;
    }


    // =====================================================
    // CREATE SURVEY WITH DEPARTMENTS
    //
    // IMPORTANT:
    //
    // This now also creates special_parameters.
    // =====================================================

    async createSurveyWithDepartments(
        surveyData
    ) {

        const {
            survey_name,
            survey_type,
            start_date,
            end_date,
            status,
            created_by,
            target_department_id,
            evaluating_department_ids,
            special_parameters
        } = surveyData;


        const connection =
            await pool.getConnection();


        try {

            // =================================================
            // TRANSACTION START
            // =================================================

            await connection.beginTransaction();


            // =================================================
            // 1. CREATE SURVEY
            // =================================================

            const surveyQuery = `
                INSERT INTO surveys
                (
                    survey_name,
                    survey_type,
                    start_date,
                    end_date,
                    status,
                    created_by
                )

                VALUES (?, ?, ?, ?, ?, ?)
            `;


            const [surveyResult] =
                await connection.query(
                    surveyQuery,
                    [
                        survey_name,

                        survey_type ||
                            "general",

                        start_date,

                        end_date,

                        status ||
                            "draft",

                        created_by ||
                            null
                    ]
                );


            const surveyId =
                surveyResult.insertId;


            // =================================================
            // 2. SAVE TARGET DEPARTMENT
            // =================================================

            const targetQuery = `
                INSERT INTO survey_departments
                (
                    survey_id,
                    department_id
                )

                VALUES (?, ?)
            `;


            await connection.query(
                targetQuery,
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


            const evaluatorIds =
                Array.isArray(
                    evaluating_department_ids
                )
                    ? evaluating_department_ids
                    : [];


            for (
                const evaluatorId
                of evaluatorIds
            ) {

                await connection.query(
                    mappingQuery,
                    [
                        surveyId,

                        evaluatorId,

                        target_department_id,

                        "active"
                    ]
                );

            }


            // =================================================
            // 4. SAVE SPECIAL PARAMETERS
            //
            // ONLY FOR SPECIAL SURVEY
            // =================================================

            const normalizedSurveyType =
                String(
                    survey_type ||
                    "general"
                )
                    .toLowerCase()
                    .trim();


            if (
                normalizedSurveyType ===
                    "special" &&
                Array.isArray(
                    special_parameters
                )
            ) {

                const specialQuery = `
                    INSERT INTO special_parameters
                    (
                        survey_id,
                        parameter_id,
                        parameter_name,
                        description,
                        importance,
                        display_order,
                        status
                    )

                    VALUES (?, ?, ?, ?, ?, ?, ?)
                `;


                let displayOrder = 1;


                for (
                    const parameter
                    of special_parameters
                ) {

                    const name =
                        String(
                            parameter?.parameter_name ||
                            parameter?.name ||
                            ""
                        ).trim();


                    if (!name) {

                        continue;

                    }


                    const description =
                        parameter?.description
                            ? String(
                                parameter.description
                              ).trim()
                            : null;


                    const importance =
                        Number(
                            parameter?.importance ??
                            parameter?.weightage ??
                            5
                        );


                    await connection.query(
                        specialQuery,
                        [
                            surveyId,

                            null,

                            name,

                            description,

                            Number.isFinite(
                                importance
                            )
                                ? importance
                                : 5,

                            Number(
                                parameter?.display_order
                            ) > 0
                                ? Number(
                                    parameter.display_order
                                  )
                                : displayOrder,

                            String(
                                parameter?.status ||
                                "active"
                            )
                        ]
                    );


                    displayOrder++;

                }

            }


            // =================================================
            // COMMIT
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
            survey_type,
            start_date,
            end_date,
            status
        } = surveyData;


        const query = `
            UPDATE surveys

            SET
                survey_name = ?,
                survey_type = ?,
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

                    survey_type ||
                        "general",

                    start_date,

                    end_date,

                    status,

                    surveyId
                ]
            );


        return (
            result.affectedRows > 0
        );
    }


    // =====================================================
    // DELETE SURVEY
    // =====================================================

    async delete(
        surveyId
    ) {

        const connection =
            await pool.getConnection();


        try {

            await connection.beginTransaction();


            // =================================================
            // DELETE SPECIAL PARAMETERS FIRST
            // =================================================

            await connection.query(
                `
                    DELETE FROM special_parameters
                    WHERE survey_id = ?
                `,
                [surveyId]
            );


            // =================================================
            // DELETE MAPPINGS
            // =================================================

            await connection.query(
                `
                    DELETE FROM department_mappings
                    WHERE survey_id = ?
                `,
                [surveyId]
            );


            // =================================================
            // DELETE SURVEY DEPARTMENTS
            // =================================================

            await connection.query(
                `
                    DELETE FROM survey_departments
                    WHERE survey_id = ?
                `,
                [surveyId]
            );


            // =================================================
            // DELETE SURVEY
            // =================================================

            const [
                result
            ] =
                await connection.query(
                    `
                        DELETE FROM surveys
                        WHERE survey_id = ?
                    `,
                    [surveyId]
                );


            await connection.commit();


            return (
                result.affectedRows > 0
            );


        } catch (error) {

            await connection.rollback();

            throw error;

        } finally {

            connection.release();

        }

    }


    // =====================================================
    // GET MY SURVEYS
    // =====================================================
// =====================================================
// GET MY SURVEYS
//
// Current department can see surveys when:
//
// 1. Current department is EVALUATOR
//    dm.from_department_id = departmentId
//
// OR
//
// 2. Current department is TARGET department
//    dm.to_department_id = departmentId
//
// OR
//
// 3. Current user created the survey
//    s.created_by = userId
//
// IMPORTANT:
// Multiple surveys must be returned.
// Do NOT use LIMIT 1.
// =====================================================
// =====================================================
// GET MY SURVEYS
//
// A HOD can see a survey when:
//
// 1. The logged-in user CREATED the survey
//    OR
//
// 2. The logged-in HOD's department is an EVALUATOR
//    in that survey.
//
// IMPORTANT:
//
// DO NOT use:
//     dm.to_department_id = departmentId
//
// Because target/creator department should NOT
// automatically get every survey.
//
// Example:
//
// IT creates Survey A
//
// IT       -> creator
// Finance  -> evaluator
// Civil    -> evaluator
// Vehicle  -> evaluator
//
// IT      sees Survey A
// Finance sees Survey A
// Civil   sees Survey A
// Vehicle sees Survey A
//
// Account does NOT see Survey A unless Account
// is also an evaluator.
//
// =====================================================

async findMySurveys(
    departmentId,
    userId
) {

    const query = `
        SELECT DISTINCT

            s.survey_id,
            s.survey_name,
            s.survey_type,
            s.start_date,
            s.end_date,
            s.status,
            s.created_by

        FROM surveys s

        LEFT JOIN department_mappings dm
            ON dm.survey_id = s.survey_id
            AND dm.status = 'active'

        WHERE
            s.created_by = ?
            OR
            dm.from_department_id = ?

        ORDER BY
            s.survey_id DESC
    `;

    const [rows] =
        await pool.query(
            query,
            [
                userId,
                departmentId
            ]
        );

    return rows;
}
}


module.exports =
    new SurveyRepository();