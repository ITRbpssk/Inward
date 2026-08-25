const { pool } =
    require("../config/db");


class SpecialParameterRepository {


    // =====================================================
    // GET ALL PARAMETERS FOR SURVEY
    // =====================================================

    async findBySurveyId(
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

                status,

                created_at,

                updated_at

            FROM special_parameters

            WHERE survey_id = ?

            ORDER BY
                display_order ASC,
                survey_parameter_id ASC
        `;


        const [rows] =
            await pool.query(
                query,
                [surveyId]
            );


        return rows;

    }


    // =====================================================
    // GET BY ID
    // =====================================================

    async findById(
        surveyParameterId
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

                status,

                created_at,

                updated_at

            FROM special_parameters

            WHERE survey_parameter_id = ?
        `;


        const [rows] =
            await pool.query(
                query,
                [surveyParameterId]
            );


        return rows[0] || null;

    }


    // =====================================================
    // CREATE
    // =====================================================

    async create(
        parameterData
    ) {

        const {

            survey_id,

            parameter_id,

            parameter_name,

            description,

            importance,

            display_order,

            status

        } = parameterData;


        const query = `
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


        const [result] =
            await pool.query(
                query,
                [

                    survey_id,

                    parameter_id ||
                        null,

                    parameter_name,

                    description ||
                        null,

                    importance ??
                        5,

                    display_order ??
                        0,

                    status ||
                        "active"

                ]
            );


        return result.insertId;

    }


    // =====================================================
    // UPDATE
    // =====================================================

    async update(
        surveyParameterId,
        parameterData
    ) {

        const {

            parameter_name,

            description,

            importance,

            display_order,

            status

        } = parameterData;


        const query = `
            UPDATE special_parameters

            SET

                parameter_name = ?,

                description = ?,

                importance = ?,

                display_order = ?,

                status = ?

            WHERE survey_parameter_id = ?
        `;


        const [result] =
            await pool.query(
                query,
                [

                    parameter_name,

                    description ||
                        null,

                    importance ??
                        5,

                    display_order ??
                        0,

                    status ||
                        "active",

                    surveyParameterId

                ]
            );


        return (
            result.affectedRows > 0
        );

    }


    // =====================================================
    // DELETE
    // =====================================================

    async delete(
        surveyParameterId
    ) {

        const query = `
            DELETE FROM special_parameters

            WHERE survey_parameter_id = ?
        `;


        const [result] =
            await pool.query(
                query,
                [surveyParameterId]
            );


        return (
            result.affectedRows > 0
        );

    }


    // =====================================================
    // DELETE BY SURVEY
    // =====================================================

    async deleteBySurveyId(
        surveyId
    ) {

        const query = `
            DELETE FROM special_parameters

            WHERE survey_id = ?
        `;


        const [result] =
            await pool.query(
                query,
                [surveyId]
            );


        return result.affectedRows;

    }

}


module.exports =
    new SpecialParameterRepository();