const parameterRepository =
    require("../repositories/parameter.repository");

const ApiError =
    require("../utils/ApiError");


class ParameterService {


    // =====================================================
    // GET ALL PARAMETERS
    // =====================================================

    async getAllParameters() {

        return await parameterRepository
            .findAll();

    }


    // =====================================================
    // GET PARAMETER BY ID
    // =====================================================

    async getParameterById(
        parameterId
    ) {

        const param =
            await parameterRepository
                .findById(
                    parameterId
                );


        if (!param) {

            throw new ApiError(
                404,
                "Parameter not found"
            );

        }


        return param;

    }


    // =====================================================
    // CREATE PARAMETER
    //
    // Weightage is NOT used.
    //
    // Importance for USI is always 5 and is handled
    // during feedback calculation.
    // =====================================================

    async createParameter(
        paramData
    ) {

        const {
            parameter_name,
            description,
            display_order,
            status
        } = paramData;


        // =================================================
        // PARAMETER NAME
        // =================================================

        if (
            !parameter_name ||
            !String(parameter_name).trim()
        ) {

            throw new ApiError(
                400,
                "parameter_name is required"
            );

        }


        // =================================================
        // DISPLAY ORDER
        // =================================================

        const finalDisplayOrder =
            display_order !== undefined
                ? Number(display_order)
                : 0;


        if (
            Number.isNaN(
                finalDisplayOrder
            ) ||
            finalDisplayOrder < 0
        ) {

            throw new ApiError(
                400,
                "display_order must be a valid non-negative number"
            );

        }


        // =================================================
        // STATUS
        // =================================================

        const finalStatus =
            status || "active";


        if (
            ![
                "active",
                "inactive"
            ].includes(
                finalStatus
            )
        ) {

            throw new ApiError(
                400,
                "Invalid status. Must be active or inactive"
            );

        }


        // =================================================
        // CREATE
        //
        // Weightage intentionally not passed.
        // =================================================

        const newId =
            await parameterRepository
                .create({

                    parameter_name:
                        String(
                            parameter_name
                        ).trim(),

                    description:
                        description || null,

                    display_order:
                        finalDisplayOrder,

                    status:
                        finalStatus

                });


        return await parameterRepository
            .findById(
                newId
            );

    }


    // =====================================================
    // UPDATE PARAMETER
    //
    // Weightage is NOT used.
    // =====================================================

    async updateParameter(
        parameterId,
        paramData
    ) {

        const existing =
            await parameterRepository
                .findById(
                    parameterId
                );


        if (!existing) {

            throw new ApiError(
                404,
                "Parameter not found"
            );

        }


        const {
            parameter_name,
            description,
            display_order,
            status
        } = paramData;


        // =================================================
        // PARAMETER NAME
        // =================================================

        if (
            parameter_name !== undefined &&
            !String(
                parameter_name
            ).trim()
        ) {

            throw new ApiError(
                400,
                "parameter_name cannot be empty"
            );

        }


        const finalParameterName =
            parameter_name !== undefined
                ? String(
                    parameter_name
                ).trim()
                : existing.parameter_name;


        // =================================================
        // DESCRIPTION
        // =================================================

        const finalDescription =
            description !== undefined
                ? description
                : existing.description;


        // =================================================
        // DISPLAY ORDER
        // =================================================

        const finalDisplayOrder =
            display_order !== undefined
                ? Number(display_order)
                : existing.display_order;


        if (
            Number.isNaN(
                finalDisplayOrder
            ) ||
            finalDisplayOrder < 0
        ) {

            throw new ApiError(
                400,
                "display_order must be a valid non-negative number"
            );

        }


        // =================================================
        // STATUS
        // =================================================

        const finalStatus =
            status !== undefined
                ? status
                : existing.status;


        if (
            ![
                "active",
                "inactive"
            ].includes(
                finalStatus
            )
        ) {

            throw new ApiError(
                400,
                "Invalid status. Must be active or inactive"
            );

        }


        // =================================================
        // UPDATE
        // =================================================

        await parameterRepository
            .update(

                parameterId,

                {

                    parameter_name:
                        finalParameterName,

                    description:
                        finalDescription,

                    display_order:
                        finalDisplayOrder,

                    status:
                        finalStatus

                }

            );


        return await parameterRepository
            .findById(
                parameterId
            );

    }


    // =====================================================
    // DELETE PARAMETER
    // =====================================================

    async deleteParameter(
        parameterId
    ) {

        const param =
            await parameterRepository
                .findById(
                    parameterId
                );


        if (!param) {

            throw new ApiError(
                404,
                "Parameter not found"
            );

        }


        return await parameterRepository
            .delete(
                parameterId
            );

    }

}


module.exports =
    new ParameterService();