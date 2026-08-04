const { pool } = require("../config/db");

class FeedbackDetailRepository {
    async findByFeedbackId(feedbackId) {
        const query = `
            SELECT fd.*, p.parameter_name, p.weightage, p.display_order
            FROM feedback_details fd
            JOIN parameters p ON fd.parameter_id = p.parameter_id
            WHERE fd.feedback_id = ?
            ORDER BY p.display_order ASC
        `;
        const [rows] = await pool.query(query, [feedbackId]);
        return rows;
    }

    async upsert(feedbackId, parameterId, rating, comment) {
        const query = `
            INSERT INTO feedback_details (feedback_id, parameter_id, rating, comment)
            VALUES (?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE 
                rating = VALUES(rating), 
                comment = VALUES(comment),
                updated_at = CURRENT_TIMESTAMP
        `;
        const [result] = await pool.query(query, [feedbackId, parameterId, rating, comment]);
        return result.affectedRows > 0;
    }

    async deleteByFeedbackId(feedbackId) {
        const query = "DELETE FROM feedback_details WHERE feedback_id = ?";
        const [result] = await pool.query(query, [feedbackId]);
        return result.affectedRows > 0;
    }
}

module.exports = new FeedbackDetailRepository();
