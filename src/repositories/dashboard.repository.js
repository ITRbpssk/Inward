const { pool } = require("../config/db");

class DashboardRepository {
    /**
     * Get basic count stats for a survey.
     */
    async getSummaryMetrics(surveyId) {

    // =====================================================
    // TOTAL ACTIVE DEPARTMENTS
    // =====================================================

    const [deptCount] = await pool.query(`
        SELECT COUNT(*) AS count
        FROM departments
        WHERE status = 'active'
    `);


    // =====================================================
    // TOTAL ACTIVE DEPARTMENT MAPPINGS
    // =====================================================

    const [mappingCount] = await pool.query(`
        SELECT COUNT(*) AS count
        FROM department_mappings
        WHERE status = 'active'
    `);


    // =====================================================
    // FEEDBACK STATISTICS
    // =====================================================

    const feedbackStatsQuery = `
        SELECT
            COUNT(*) AS total_feedbacks,

            SUM(
                CASE
                    WHEN status = 'submitted'
                    THEN 1
                    ELSE 0
                END
            ) AS submitted_feedbacks,

            SUM(
                CASE
                    WHEN status = 'draft'
                    THEN 1
                    ELSE 0
                END
            ) AS draft_feedbacks

        FROM feedbacks

        WHERE survey_id = ?
    `;


    const [feedbackStats] =
        await pool.query(
            feedbackStatsQuery,
            [surveyId]
        );


    // =====================================================
    // OVERALL AVERAGE SCORE
    // =====================================================

    const avgScoreQuery = `
        SELECT
            AVG(fb_score.score) AS overall_avg_score

        FROM (

            SELECT
                f.feedback_id,

                SUM(
                    fd.rating * p.weightage
                )
                /
                NULLIF(
                    SUM(p.weightage),
                    0
                ) AS score

            FROM feedbacks f

            JOIN feedback_details fd
                ON f.feedback_id = fd.feedback_id

            JOIN parameters p
                ON fd.parameter_id = p.parameter_id

            WHERE
                f.survey_id = ?
                AND f.status = 'submitted'

            GROUP BY
                f.feedback_id

        ) fb_score
    `;


    const [avgScore] =
        await pool.query(
            avgScoreQuery,
            [surveyId]
        );


    // =====================================================
    // SAFE NUMBER CONVERSION
    // =====================================================

    const overallAverageScore =
        Number(
            avgScore?.[0]?.overall_avg_score ?? 0
        );


    // =====================================================
    // FINAL RESPONSE
    // =====================================================

    return {

        total_departments:
            Number(
                deptCount?.[0]?.count ?? 0
            ),

        expected_feedbacks:
            Number(
                mappingCount?.[0]?.count ?? 0
            ),

        total_feedbacks:
            Number(
                feedbackStats?.[0]?.total_feedbacks ?? 0
            ),

        submitted_feedbacks:
            Number(
                feedbackStats?.[0]?.submitted_feedbacks ?? 0
            ),

        draft_feedbacks:
            Number(
                feedbackStats?.[0]?.draft_feedbacks ?? 0
            ),

        overall_average_score:
            Number(
                overallAverageScore.toFixed(2)
            )

    };

}

    /**
     * Get average ratings received (To Dept) and given (From Dept) for all active departments.
     */
    async getDepartmentWiseScores(surveyId) {
        const query = `
            SELECT 
                d.department_id,
                d.department_code,
                d.department_name,
                COALESCE(rec.avg_received, 0) AS average_score_received,
                COALESCE(giv.avg_given, 0) AS average_score_given
            FROM departments d
            
            -- Left join for received scores
            LEFT JOIN (
                SELECT f.to_department_id, AVG(fb_score.score) AS avg_received
                FROM feedbacks f
                JOIN (
                    SELECT f.feedback_id, SUM(fd.rating * p.weightage) / SUM(p.weightage) AS score
                    FROM feedbacks f
                    JOIN feedback_details fd ON f.feedback_id = fd.feedback_id
                    JOIN parameters p ON fd.parameter_id = p.parameter_id
                    WHERE f.survey_id = ? AND f.status = 'submitted'
                    GROUP BY f.feedback_id
                ) fb_score ON f.feedback_id = fb_score.feedback_id
                GROUP BY f.to_department_id
            ) rec ON d.department_id = rec.to_department_id
            
            -- Left join for given scores
            LEFT JOIN (
                SELECT f.from_department_id, AVG(fb_score.score) AS avg_given
                FROM feedbacks f
                JOIN (
                    SELECT f.feedback_id, SUM(fd.rating * p.weightage) / SUM(p.weightage) AS score
                    FROM feedbacks f
                    JOIN feedback_details fd ON f.feedback_id = fd.feedback_id
                    JOIN parameters p ON fd.parameter_id = p.parameter_id
                    WHERE f.survey_id = ? AND f.status = 'submitted'
                    GROUP BY f.feedback_id
                ) fb_score ON f.feedback_id = fb_score.feedback_id
                GROUP BY f.from_department_id
            ) giv ON d.department_id = giv.from_department_id
            
            WHERE d.status = 'active'
            ORDER BY d.department_name ASC
        `;
        const [rows] = await pool.query(query, [surveyId, surveyId]);
        return rows.map(r => ({
            ...r,
            average_score_received: parseFloat(parseFloat(r.average_score_received).toFixed(2)),
            average_score_given: parseFloat(parseFloat(r.average_score_given).toFixed(2))
        }));
    }


    // =====================================================
// DEPARTMENT EVALUATION OVERVIEW
// Evaluator Department → Target Departments
// Includes Feedback Status + Score
// =====================================================

async getDepartmentEvaluationOverview(surveyId) {

    const query = `
        SELECT
            from_dept.department_id AS from_department_id,
            from_dept.department_name AS from_department_name,
            from_dept.department_code AS from_department_code,

            dm.mapping_id,

            to_dept.department_id AS to_department_id,
            to_dept.department_name AS to_department_name,
            to_dept.department_code AS to_department_code,

            COALESCE(f.feedback_id, NULL) AS feedback_id,

            COALESCE(
                f.status,
                'not_started'
            ) AS feedback_status,

            f.submitted_on,

            score_data.score

        FROM department_mappings dm

        JOIN departments from_dept
            ON dm.from_department_id =
               from_dept.department_id

        JOIN departments to_dept
            ON dm.to_department_id =
               to_dept.department_id

        LEFT JOIN feedbacks f
            ON f.survey_id = ?
            AND f.from_department_id =
                dm.from_department_id
            AND f.to_department_id =
                dm.to_department_id

        LEFT JOIN (

            SELECT
                f2.feedback_id,

                SUM(
                    fd.rating * p.weightage
                )
                /
                NULLIF(
                    SUM(p.weightage),
                    0
                ) AS score

            FROM feedbacks f2

            JOIN feedback_details fd
                ON f2.feedback_id =
                   fd.feedback_id

            JOIN parameters p
                ON fd.parameter_id =
                   p.parameter_id

            WHERE
                f2.survey_id = ?
                AND f2.status = 'submitted'

            GROUP BY
                f2.feedback_id

        ) score_data

            ON f.feedback_id =
               score_data.feedback_id

        WHERE
            dm.status = 'active'

            AND from_dept.status = 'active'

            AND to_dept.status = 'active'

        ORDER BY
            from_dept.department_name ASC,
            to_dept.department_name ASC
    `;


    const [rows] =
        await pool.query(
            query,
            [
                surveyId,
                surveyId
            ]
        );


    return rows.map(row => ({

        from_department_id:
            Number(row.from_department_id),

        from_department_name:
            row.from_department_name,

        from_department_code:
            row.from_department_code,

        mapping_id:
            Number(row.mapping_id),

        to_department_id:
            Number(row.to_department_id),

        to_department_name:
            row.to_department_name,

        to_department_code:
            row.to_department_code,

        feedback_id:
            row.feedback_id
                ? Number(row.feedback_id)
                : null,

        feedback_status:
            row.feedback_status,

        submitted_on:
            row.submitted_on || null,

        score:
            row.score !== null
                ? Number(
                    Number(row.score).toFixed(2)
                )
                : null

    }));

}

    /**
     * Get detailed feedback ratings received by a specific department, broken down by parameter.
     */
    async getDepartmentParameterScores(surveyId, departmentId) {

    const query = `
        SELECT
            p.parameter_id,
            p.parameter_name,
            p.description,
            p.weightage,
            AVG(fd.rating) AS average_rating

        FROM feedbacks f

        INNER JOIN feedback_details fd
            ON f.feedback_id = fd.feedback_id

        INNER JOIN parameters p
            ON fd.parameter_id = p.parameter_id

        WHERE
            f.survey_id = ?
            AND f.to_department_id = ?
            AND f.status = 'submitted'
            AND p.status = 'active'

        GROUP BY
            p.parameter_id,
            p.parameter_name,
            p.description,
            p.weightage,
            p.display_order

        ORDER BY
            p.display_order ASC
    `;


    const [rows] =
        await pool.query(
            query,
            [
                surveyId,
                departmentId
            ]
        );


    return rows.map(row => ({

        ...row,

        average_rating:
            row.average_rating !== null
                ? Number(
                    Number(
                        row.average_rating
                    ).toFixed(2)
                )
                : 0

    }));

}

    /**
     * Get a cross-tabulation mapping matrix between departments for the survey.
     * E.g., From HR to IT, Finance to IT, etc.
     */
    async getFeedbackMatrix(surveyId) {
        const query = `
            SELECT 
                f.from_department_id,
                fd_from.department_code AS from_department_code,
                f.to_department_id,
                fd_to.department_code AS to_department_code,
                SUM(fd.rating * p.weightage) / SUM(p.weightage) AS score
            FROM feedbacks f
            JOIN feedback_details fd ON f.feedback_id = fd.feedback_id
            JOIN parameters p ON fd.parameter_id = p.parameter_id
            JOIN departments fd_from ON f.from_department_id = fd_from.department_id
            JOIN departments fd_to ON f.to_department_id = fd_to.department_id
            WHERE f.survey_id = ? AND f.status = 'submitted'
            GROUP BY f.feedback_id, f.from_department_id, f.to_department_id, fd_from.department_code, fd_to.department_code
        `;
        const [rows] = await pool.query(query, [surveyId]);
        return rows.map(r => ({
            ...r,
            score: parseFloat(parseFloat(r.score).toFixed(2))
        }));
    }
}

module.exports = new DashboardRepository();
