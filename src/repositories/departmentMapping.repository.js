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

            ORDER BY dm.mapping_id ASC
        `;

        const [rows] =
            await pool.query(query);

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
    // FIND SURVEY-WISE DUPLICATE
    //
    // Same mapping in different surveys = ALLOWED
    //
    // Same mapping inside same survey = NOT ALLOWED
    // =====================================================

    async findByFromAndTo(
        surveyId,
        fromDepartmentId,
        toDepartmentId
    ) {

        const query = `
            SELECT
                mapping_id,
                survey_id,
                from_department_id,
                to_department_id,
                status

            FROM department_mappings

            WHERE survey_id = ?
              AND from_department_id = ?
              AND to_department_id = ?

            LIMIT 1
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
    // FIND GENERAL DEPARTMENT MAPPING
    //
    // survey_id IS NULL
    // =====================================================

    async findGlobalByFromAndTo(
        fromDepartmentId,
        toDepartmentId
    ) {

        const query = `
            SELECT
                mapping_id,
                survey_id,
                from_department_id,
                to_department_id,
                status

            FROM department_mappings

            WHERE survey_id IS NULL
              AND from_department_id = ?
              AND to_department_id = ?

            LIMIT 1
        `;

        const [rows] =
            await pool.query(
                query,
                [
                    fromDepartmentId,
                    toDepartmentId
                ]
            );

        return rows[0] || null;
    }


    // =====================================================
    // CREATE SURVEY BULK MAPPINGS
    //
    // Example:
    //
    // Survey = 10
    // Target = QA
    // Evaluators = HR, ACC, IT
    //
    // Creates:
    //
    // HR  -> QA
    // ACC -> QA
    // IT  -> QA
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
                const evaluatorId
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
                            evaluatorId,
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
    // CREATE GENERAL DEPARTMENT BULK MAPPINGS
    //
    // survey_id = NULL
    // =====================================================

    async createDepartmentBulk(
        fromDepartmentId,
        toDepartmentIds,
        status = "active"
    ) {

        const connection =
            await pool.getConnection();

        try {

            await connection.beginTransaction();

            const createdIds = [];

            for (
                const toDepartmentId
                of toDepartmentIds
            ) {

                const query = `
                    INSERT INTO department_mappings
                    (
                        survey_id,
                        from_department_id,
                        to_department_id,
                        status
                    )
                    VALUES (NULL, ?, ?, ?)
                `;

                const [result] =
                    await connection.query(
                        query,
                        [
                            fromDepartmentId,
                            toDepartmentId,
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
                    survey_id || null,
                    from_department_id,
                    to_department_id,
                    status || "active"
                ]
            );

        return result.insertId;
    }


    // =====================================================
    // GET MAPPINGS BY SURVEY
    //
    // IMPORTANT:
    //
    // mapping_id ASC preserves original order.
    // Only ACTIVE mappings are returned.
    // =====================================================

    async findBySurveyId(
        surveyId
    ) {

        const query = `
            SELECT
                dm.mapping_id,
                dm.survey_id,

                dm.from_department_id,
                dm.to_department_id,

                dm.status,

                f.department_code
                    AS from_department_code,

                f.department_name
                    AS from_department_name,

                t.department_code
                    AS to_department_code,

                t.department_name
                    AS to_department_name

            FROM department_mappings dm

            INNER JOIN departments f
                ON dm.from_department_id =
                   f.department_id

            INNER JOIN departments t
                ON dm.to_department_id =
                   t.department_id

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
    // GET GENERAL MAPPINGS
    //
    // survey_id IS NULL
    // =====================================================

    async findGeneralMappings() {

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
                ON dm.from_department_id =
                   f.department_id

            INNER JOIN departments t
                ON dm.to_department_id =
                   t.department_id

            WHERE dm.survey_id IS NULL

            ORDER BY dm.mapping_id ASC
        `;

        const [rows] =
            await pool.query(query);

        return rows;
    }


    // =====================================================
    // GET MAPPED TARGETS FOR HOD
    // =====================================================

    async findMappedToDepartments(
        fromDeptId
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

            WHERE dm.from_department_id = ?

              AND dm.status = 'active'

              AND d.status = 'active'

            ORDER BY dm.mapping_id ASC
        `;

        const [rows] =
            await pool.query(
                query,
                [fromDeptId]
            );

        return rows;
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
                    survey_id || null,
                    from_department_id,
                    to_department_id,
                    status || "active",
                    mappingId
                ]
            );

        return result.affectedRows > 0;
    }


    // =====================================================
    // GET ACTIVE MAPPINGS BY SURVEY
    //
    // Used during EDIT.
    //
    // Existing mapping IDs are preserved.
    // =====================================================

    async findActiveBySurveyId(
        surveyId
    ) {

        const query = `
            SELECT
                mapping_id,
                survey_id,
                from_department_id,
                to_department_id,
                status

            FROM department_mappings

            WHERE survey_id = ?

              AND status = 'active'

            ORDER BY mapping_id ASC
        `;

        const [rows] =
            await pool.query(
                query,
                [surveyId]
            );

        return rows;
    }


    // =====================================================
    // UPDATE MAPPING STATUS
    //
    // Used when an evaluator is removed during EDIT.
    //
    // IMPORTANT:
    // Record is NOT deleted.
    // =====================================================

    async updateStatus(
        mappingId,
        status
    ) {

        const query = `
            UPDATE department_mappings

            SET
                status = ?

            WHERE mapping_id = ?
        `;

        const [result] =
            await pool.query(
                query,
                [
                    status,
                    mappingId
                ]
            );

        return result.affectedRows > 0;
    }


    // =====================================================
    // DELETE SINGLE MAPPING
    //
    // Existing DELETE API only.
    //
    // NOT used during survey EDIT.
    // =====================================================

    async delete(
        mappingId
    ) {

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

}


module.exports =
    new DepartmentMappingRepository();