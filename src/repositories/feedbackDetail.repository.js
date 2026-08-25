const { pool } = require("../config/db");


class FeedbackDetailRepository {


    // =====================================================
    // GET ALL FEEDBACK DETAILS
    //
    // GENERAL:
    //     parameter_id -> parameters
    //
    // SPECIAL:
    //     survey_parameter_id -> special_parameters
    // =====================================================

    async findByFeedbackId(feedbackId) {

        const query = `
            SELECT

                fd.feedback_detail_id,
                fd.feedback_id,

                fd.parameter_id,
                fd.survey_parameter_id,

                fd.rating,
                fd.comment,

                fd.created_at,
                fd.updated_at,

                p.parameter_name
                    AS parameter_name,

                p.display_order
                    AS parameter_display_order,

                sp.parameter_name
                    AS special_parameter_name,

                sp.description
                    AS special_parameter_description,

                sp.importance
                    AS special_parameter_importance,

                sp.display_order
                    AS special_parameter_display_order

            FROM feedback_details fd

            LEFT JOIN parameters p
                ON fd.parameter_id = p.parameter_id

            LEFT JOIN special_parameters sp
                ON fd.survey_parameter_id =
                   sp.survey_parameter_id

            WHERE fd.feedback_id = ?

            ORDER BY
                COALESCE(
                    p.display_order,
                    sp.display_order,
                    0
                ) ASC,

                fd.feedback_detail_id ASC
        `;

        const [rows] =
            await pool.query(
                query,
                [feedbackId]
            );

        return rows;
    }


    // =====================================================
    // GET SINGLE FEEDBACK DETAIL
    // =====================================================

    async findById(feedbackDetailId) {

        const query = `
            SELECT

                fd.*,

                p.parameter_name
                    AS parameter_name,

                p.display_order
                    AS parameter_display_order,

                sp.parameter_name
                    AS special_parameter_name,

                sp.description
                    AS special_parameter_description,

                sp.importance
                    AS special_parameter_importance,

                sp.display_order
                    AS special_parameter_display_order

            FROM feedback_details fd

            LEFT JOIN parameters p
                ON fd.parameter_id = p.parameter_id

            LEFT JOIN special_parameters sp
                ON fd.survey_parameter_id =
                   sp.survey_parameter_id

            WHERE fd.feedback_detail_id = ?
        `;

        const [rows] =
            await pool.query(
                query,
                [feedbackDetailId]
            );

        return rows[0] || null;
    }


    // =====================================================
    // UPSERT GENERAL PARAMETER
    //
    // feedback_id
    // parameter_id
    // survey_parameter_id = NULL
    // =====================================================

    async upsertGeneral(
        feedbackId,
        parameterId,
        rating,
        comment
    ) {

        const findQuery = `
            SELECT feedback_detail_id

            FROM feedback_details

            WHERE feedback_id = ?
              AND parameter_id = ?
              AND survey_parameter_id IS NULL

            LIMIT 1
        `;

        const [existingRows] =
            await pool.query(
                findQuery,
                [
                    feedbackId,
                    parameterId
                ]
            );


        // =================================================
        // UPDATE EXISTING
        // =================================================

        if (existingRows.length > 0) {

            const updateQuery = `
                UPDATE feedback_details

                SET
                    rating = ?,
                    comment = ?,
                    updated_at = CURRENT_TIMESTAMP

                WHERE feedback_detail_id = ?
            `;

            const [result] =
                await pool.query(
                    updateQuery,
                    [
                        rating,
                        comment || null,
                        existingRows[0]
                            .feedback_detail_id
                    ]
                );

            return result.affectedRows > 0;
        }


        // =================================================
        // INSERT NEW
        // =================================================

        const insertQuery = `
            INSERT INTO feedback_details
            (
                feedback_id,
                parameter_id,
                survey_parameter_id,
                rating,
                comment
            )

            VALUES (?, ?, NULL, ?, ?)
        `;

        const [result] =
            await pool.query(
                insertQuery,
                [
                    feedbackId,
                    parameterId,
                    rating,
                    comment || null
                ]
            );

        return result.insertId;
    }


    // =====================================================
    // UPSERT SPECIAL PARAMETER
    //
    // feedback_id
    // survey_parameter_id
    // parameter_id = NULL
    // =====================================================

    async upsertSpecial(
        feedbackId,
        surveyParameterId,
        rating,
        comment
    ) {

        const findQuery = `
            SELECT feedback_detail_id

            FROM feedback_details

            WHERE feedback_id = ?
              AND survey_parameter_id = ?
              AND parameter_id IS NULL

            LIMIT 1
        `;

        const [existingRows] =
            await pool.query(
                findQuery,
                [
                    feedbackId,
                    surveyParameterId
                ]
            );


        // =================================================
        // UPDATE EXISTING
        // =================================================

        if (existingRows.length > 0) {

            const updateQuery = `
                UPDATE feedback_details

                SET
                    rating = ?,
                    comment = ?,
                    updated_at = CURRENT_TIMESTAMP

                WHERE feedback_detail_id = ?
            `;

            const [result] =
                await pool.query(
                    updateQuery,
                    [
                        rating,
                        comment || null,
                        existingRows[0]
                            .feedback_detail_id
                    ]
                );

            return result.affectedRows > 0;
        }


        // =================================================
        // INSERT NEW
        // =================================================

        const insertQuery = `
            INSERT INTO feedback_details
            (
                feedback_id,
                parameter_id,
                survey_parameter_id,
                rating,
                comment
            )

            VALUES (?, NULL, ?, ?, ?)
        `;

        const [result] =
            await pool.query(
                insertQuery,
                [
                    feedbackId,
                    surveyParameterId,
                    rating,
                    comment || null
                ]
            );

        return result.insertId;
    }


    // =====================================================
    // DELETE ALL DETAILS OF FEEDBACK
    // =====================================================

    async deleteByFeedbackId(feedbackId) {

        const query = `
            DELETE FROM feedback_details
            WHERE feedback_id = ?
        `;

        const [result] =
            await pool.query(
                query,
                [feedbackId]
            );

        return result.affectedRows > 0;
    }


    // =====================================================
    // DELETE GENERAL PARAMETER DETAIL
    // =====================================================

    async deleteGeneral(
        feedbackId,
        parameterId
    ) {

        const query = `
            DELETE FROM feedback_details

            WHERE feedback_id = ?
              AND parameter_id = ?
              AND survey_parameter_id IS NULL
        `;

        const [result] =
            await pool.query(
                query,
                [
                    feedbackId,
                    parameterId
                ]
            );

        return result.affectedRows > 0;
    }


    // =====================================================
    // DELETE SPECIAL PARAMETER DETAIL
    // =====================================================

    async deleteSpecial(
        feedbackId,
        surveyParameterId
    ) {

        const query = `
            DELETE FROM feedback_details

            WHERE feedback_id = ?
              AND survey_parameter_id = ?
              AND parameter_id IS NULL
        `;

        const [result] =
            await pool.query(
                query,
                [
                    feedbackId,
                    surveyParameterId
                ]
            );

        return result.affectedRows > 0;
    }

}


module.exports =
    new FeedbackDetailRepository();