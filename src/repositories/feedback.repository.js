const { pool } = require("../config/db");

class FeedbackRepository {
    async findById(feedbackId) {
        const query = `
            SELECT f.*,
                   fd_from.department_name AS from_department_name, fd_from.department_code AS from_department_code,
                   fd_to.department_name AS to_department_name, fd_to.department_code AS to_department_code,
                   u.full_name AS submitted_by_name
            FROM feedbacks f
            JOIN departments fd_from ON f.from_department_id = fd_from.department_id
            JOIN departments fd_to ON f.to_department_id = fd_to.department_id
            JOIN users u ON f.submitted_by = u.user_id
            WHERE f.feedback_id = ?
        `;
        const [rows] = await pool.query(query, [feedbackId]);
        return rows[0] || null;
    }

    async findBySurveyAndDepts(surveyId, fromDeptId, toDeptId) {
        const query = `
            SELECT * FROM feedbacks 
            WHERE survey_id = ? AND from_department_id = ? AND to_department_id = ?
        `;
        const [rows] = await pool.query(query, [surveyId, fromDeptId, toDeptId]);
        return rows[0] || null;
    }

    async findFeedbacksBySurvey(surveyId) {
        const query = `
            SELECT f.*,
                   fd_from.department_name AS from_department_name, fd_from.department_code AS from_department_code,
                   fd_to.department_name AS to_department_name, fd_to.department_code AS to_department_code,
                   u.full_name AS submitted_by_name
            FROM feedbacks f
            JOIN departments fd_from ON f.from_department_id = fd_from.department_id
            JOIN departments fd_to ON f.to_department_id = fd_to.department_id
            JOIN users u ON f.submitted_by = u.user_id
            WHERE f.survey_id = ?
            ORDER BY f.feedback_id DESC
        `;
        const [rows] = await pool.query(query, [surveyId]);
        return rows;
    }

    /**
     * Get review status for all target departments mapped from a specific department for a survey.
     * Tells whether feedback is submitted, in draft, or not started.
     */
    // =====================================================
// GET FEEDBACK SUBMISSION STATUS
// SURVEY + EVALUATING DEPARTMENT WISE
// =====================================================

async getFeedbackSubmissionStatus(
    surveyId,
    fromDeptId
) {

    const query = `
        SELECT
            dm.mapping_id,
            dm.to_department_id,

            d.department_name AS to_department_name,
            d.department_code AS to_department_code,

            f.feedback_id,
            f.status AS feedback_status,
            f.submitted_on,
            f.overall_comment

        FROM department_mappings dm

        JOIN departments d
            ON dm.to_department_id =
               d.department_id

        LEFT JOIN feedbacks f
            ON f.survey_id = ?
           AND f.from_department_id =
               dm.from_department_id
           AND f.to_department_id =
               dm.to_department_id

        WHERE dm.survey_id = ?
          AND dm.from_department_id = ?
          AND dm.status = 'active'

        ORDER BY
            d.department_name ASC
    `;


    const [rows] =
        await pool.query(
            query,
            [
                surveyId,
                surveyId,
                fromDeptId
            ]
        );


    return rows;
}

    async create(feedbackData) {
        const { survey_id, from_department_id, to_department_id, submitted_by, overall_comment, status } = feedbackData;
        const query = `
            INSERT INTO feedbacks (survey_id, from_department_id, to_department_id, submitted_by, submitted_on, overall_comment, status)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `;
        // If status is 'submitted', we set submitted_on to current time, otherwise NULL
        const submittedOn = status === "submitted" ? new Date() : null;

        const [result] = await pool.query(query, [
            survey_id,
            from_department_id,
            to_department_id,
            submitted_by,
            submittedOn,
            overall_comment,
            status || "draft"
        ]);
        return result.insertId;
    }

    async update(feedbackId, feedbackData) {
        const { overall_comment, status } = feedbackData;
        
        let query;
        let params;
        
        if (status === "submitted") {
            query = `
                UPDATE feedbacks 
                SET overall_comment = ?, status = ?, submitted_on = NOW()
                WHERE feedback_id = ?
            `;
            params = [overall_comment, status, feedbackId];
        } else {
            query = `
                UPDATE feedbacks 
                SET overall_comment = ?, status = ?
                WHERE feedback_id = ?
            `;
            params = [overall_comment, status, feedbackId];
        }

        const [result] = await pool.query(query, params);
        return result.affectedRows > 0;
    }

    async delete(feedbackId) {
        const query = "DELETE FROM feedbacks WHERE feedback_id = ?";
        const [result] = await pool.query(query, [feedbackId]);
        return result.affectedRows > 0;
    }








    // =====================================================
// HOD - FEEDBACK STATUS FOR OWN CREATED SURVEY
//
// Creator = IT
// Evaluator = HR
//
// HR -> IT feedback
// IT HOD should see HR feedback status
// =====================================================

async getFeedbackSubmissionStatusForCreator(
    surveyId,
    targetDepartmentId
) {

    const query = `
        SELECT
            dm.mapping_id,

            dm.from_department_id
                AS evaluator_department_id,

            dm.to_department_id
                AS target_department_id,

            evaluator.department_name
                AS evaluator_department_name,

            evaluator.department_code
                AS evaluator_department_code,

            target.department_name
                AS target_department_name,

            target.department_code
                AS target_department_code,

            f.feedback_id,
            f.status AS feedback_status,
            f.submitted_on,
            f.overall_comment

        FROM department_mappings dm

        JOIN departments evaluator
            ON dm.from_department_id =
               evaluator.department_id

        JOIN departments target
            ON dm.to_department_id =
               target.department_id

        LEFT JOIN feedbacks f
            ON f.survey_id = dm.survey_id
           AND f.from_department_id =
               dm.from_department_id
           AND f.to_department_id =
               dm.to_department_id

        WHERE dm.survey_id = ?
          AND dm.to_department_id = ?
          AND dm.status = 'active'

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

module.exports = new FeedbackRepository();
