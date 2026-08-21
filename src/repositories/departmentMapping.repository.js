const { pool } = require("../config/db");

class DepartmentMappingRepository {

    // =====================================================
    // GET ALL MAPPINGS
    // =====================================================

    async findAll() {

        const query = `
            SELECT
                dm.mapping_id,
                dm.survey_id,
                dm.from_department_id,
                dm.to_department_id,
                dm.status,
                dm.created_at,
                dm.updated_at,

                f.department_name AS from_department_name,
                f.department_code AS from_department_code,

                t.department_name AS to_department_name,
                t.department_code AS to_department_code

            FROM department_mappings dm

            INNER JOIN departments f
                ON dm.from_department_id = f.department_id

            INNER JOIN departments t
                ON dm.to_department_id = t.department_id

            ORDER BY dm.mapping_id DESC
        `;

        const [rows] = await pool.query(query);

        return rows;
    }


    // =====================================================
    // GET MAPPING BY ID
    // =====================================================

    async findById(mappingId) {

        const query = `
            SELECT
                dm.mapping_id,
                dm.survey_id,
                dm.from_department_id,
                dm.to_department_id,
                dm.status,
                dm.created_at,
                dm.updated_at,

                f.department_name AS from_department_name,
                f.department_code AS from_department_code,

                t.department_name AS to_department_name,
                t.department_code AS to_department_code

            FROM department_mappings dm

            INNER JOIN departments f
                ON dm.from_department_id = f.department_id

            INNER JOIN departments t
                ON dm.to_department_id = t.department_id

            WHERE dm.mapping_id = ?
        `;

        const [rows] =
            await pool.query(
                query,
                [mappingId]
            );

        return rows[0] || null;
    }


    // =====================================================
    // GET MAPPINGS BY SURVEY
    //
    // VERY IMPORTANT:
    // mapping_id ASC preserves creation order.
    //
    // Example:
    //
    // HR
    // QA
    // ACC
    //
    // Same order will be returned on edit.
    // =====================================================

    async findBySurveyId(surveyId) {

        const query = `
            SELECT
                dm.mapping_id,
                dm.survey_id,

                dm.from_department_id,
                dm.to_department_id,

                dm.status,

                dm.created_at,
                dm.updated_at,

                f.department_code AS from_department_code,
                f.department_name AS from_department_name,

                t.department_code AS to_department_code,
                t.department_name AS to_department_name

            FROM department_mappings dm

            INNER JOIN departments f
                ON dm.from_department_id = f.department_id

            INNER JOIN departments t
                ON dm.to_department_id = t.department_id

            WHERE dm.survey_id = ?
              AND dm.status = 'active'

            ORDER BY dm.mapping_id ASC
        `;

        const [rows] =
            await pool.query(
                query,
                [surveyId]
            );

        return rows;
    }


    // =====================================================
    // FIND SINGLE SURVEY MAPPING
    // =====================================================

    async findByFromAndTo(
        surveyId,
        fromDepartmentId,
        toDepartmentId
    ) {

        const query = `
            SELECT *
            FROM department_mappings

            WHERE survey_id = ?
              AND from_department_id = ?
              AND to_department_id = ?
        `;

        const [rows] =
            await pool.query(
                query,
                [
                    surveyId,
                    fromDepartmentId,
                    toDepartmentId
                ]
            );

        return rows[0] || null;
    }


    // =====================================================
    // CREATE BULK MAPPINGS
    //
    // IMPORTANT:
    //
    // toDepartmentIds order is preserved.
    //
    // Example:
    //
    // [HR, QA, ACC]
    //
    // DB insertion:
    //
    // 1 -> HR
    // 2 -> QA
    // 3 -> ACC
    //
    // =====================================================

    async createBulk(
        surveyId,
        targetDepartmentId,
        evaluatingDepartmentIds,
        status = "active"
    ) {

        const connection =
            await pool.getConnection();

        try {

            await connection.beginTransaction();

            const createdIds = [];


            for (
                const evaluatingDepartmentId
                of evaluatingDepartmentIds
            ) {

                const query = `
                    INSERT INTO department_mappings
                    (
                        survey_id,
                        from_department_id,
                        to_department_id,
                        status
                    )

                    VALUES (?, ?, ?, ?)
                `;


                const [result] =
                    await connection.query(
                        query,
                        [
                            surveyId,
                            evaluatingDepartmentId,
                            targetDepartmentId,
                            status
                        ]
                    );


                createdIds.push(
                    result.insertId
                );
            }


            await connection.commit();

            return createdIds;

        } catch (error) {

            await connection.rollback();

            throw error;

        } finally {

            connection.release();

        }
    }


    // =====================================================
    // CREATE SINGLE MAPPING
    // =====================================================

    async create(mappingData) {

        const {
            survey_id,
            from_department_id,
            to_department_id,
            status
        } = mappingData;


        const query = `
            INSERT INTO department_mappings
            (
                survey_id,
                from_department_id,
                to_department_id,
                status
            )

            VALUES (?, ?, ?, ?)
        `;


        const [result] =
            await pool.query(
                query,
                [
                    survey_id,
                    from_department_id,
                    to_department_id,
                    status || "active"
                ]
            );


        return result.insertId;
    }


    // =====================================================
    // UPDATE SINGLE MAPPING
    // =====================================================

    async update(
        mappingId,
        mappingData
    ) {

        const {
            survey_id,
            from_department_id,
            to_department_id,
            status
        } = mappingData;


        const query = `
            UPDATE department_mappings

            SET
                survey_id = ?,
                from_department_id = ?,
                to_department_id = ?,
                status = ?

            WHERE mapping_id = ?
        `;


        const [result] =
            await pool.query(
                query,
                [
                    survey_id,
                    from_department_id,
                    to_department_id,
                    status,
                    mappingId
                ]
            );


        return result.affectedRows > 0;
    }


    // =====================================================
    // DELETE SINGLE MAPPING
    // =====================================================

    async delete(mappingId) {

        const query = `
            DELETE FROM department_mappings
            WHERE mapping_id = ?
        `;


        const [result] =
            await pool.query(
                query,
                [mappingId]
            );


        return result.affectedRows > 0;
    }


    // =====================================================
    // DELETE ALL MAPPINGS OF A SURVEY
    //
    // USED DURING EDIT
    //
    // Old:
    // HR -> IT
    // QA -> IT
    //
    // Edit:
    // HR -> IT
    // ACC -> IT
    //
    // Old mappings are removed first.
    // Then new mappings are inserted.
    // =====================================================

    async deleteBySurveyId(
        surveyId,
        connection = pool
    ) {

        const query = `
            DELETE FROM department_mappings
            WHERE survey_id = ?
        `;


        const [result] =
            await connection.query(
                query,
                [surveyId]
            );


        return result.affectedRows;
    }


    // =====================================================
    // REPLACE SURVEY MAPPINGS
    //
    // THIS IS THE MAIN EDIT FUNCTION.
    //
    // It deletes old mappings and creates new mappings
    // in exactly the same order received from frontend.
    // =====================================================

    async replaceSurveyMappings(
        surveyId,
        targetDepartmentId,
        evaluatingDepartmentIds,
        status = "active"
    ) {

        const connection =
            await pool.getConnection();

        try {

            await connection.beginTransaction();


            // -------------------------------------------------
            // DELETE OLD MAPPINGS
            // -------------------------------------------------

            await connection.query(
                `
                    DELETE FROM department_mappings
                    WHERE survey_id = ?
                `,
                [surveyId]
            );


            // -------------------------------------------------
            // INSERT NEW MAPPINGS
            //
            // IMPORTANT:
            // Array order is preserved.
            // -------------------------------------------------

            const createdIds = [];


            for (
                const evaluatingDepartmentId
                of evaluatingDepartmentIds
            ) {

                const [result] =
                    await connection.query(
                        `
                            INSERT INTO department_mappings
                            (
                                survey_id,
                                from_department_id,
                                to_department_id,
                                status
                            )

                            VALUES (?, ?, ?, ?)
                        `,
                        [
                            surveyId,
                            evaluatingDepartmentId,
                            targetDepartmentId,
                            status
                        ]
                    );


                createdIds.push(
                    result.insertId
                );
            }


            await connection.commit();

            return createdIds;

        } catch (error) {

            await connection.rollback();

            throw error;

        } finally {

            connection.release();

        }
    }


    // =====================================================
    // GET TARGET DEPARTMENTS FOR HOD
    // SURVEY-WISE
    // =====================================================

    async findMappedToDepartments(
        surveyId,
        fromDepartmentId
    ) {

        const query = `
            SELECT
                dm.mapping_id,
                dm.survey_id,

                dm.to_department_id,

                d.department_name,
                d.department_code

            FROM department_mappings dm

            INNER JOIN departments d
                ON dm.to_department_id =
                   d.department_id

            WHERE dm.survey_id = ?
              AND dm.from_department_id = ?
              AND dm.status = 'active'
              AND d.status = 'active'

            ORDER BY dm.mapping_id ASC
        `;


        const [rows] =
            await pool.query(
                query,
                [
                    surveyId,
                    fromDepartmentId
                ]
            );


        return rows;
    }

}


module.exports =
    new DepartmentMappingRepository();