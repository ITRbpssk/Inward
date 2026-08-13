const roleService = require("../services/role.service");
const ApiResponse = require("../utils/ApiResponse");


const getAllRoles = async (req, res, next) => {

    try {

        const roles =
            await roleService.getAllRoles();

        res.status(200).json(
            new ApiResponse(
                200,
                roles,
                "Roles fetched successfully"
            )
        );

    } catch (error) {

        next(error);

    }

};


const getRoleById = async (req, res, next) => {

    try {

        const role =
            await roleService.getRoleById(
                req.params.id
            );

        res.status(200).json(
            new ApiResponse(
                200,
                role,
                "Role fetched successfully"
            )
        );

    } catch (error) {

        next(error);

    }

};


const getRoleByName = async (req, res, next) => {

    try {

        const role =
            await roleService.getRoleByName(
                req.params.name
            );

        res.status(200).json(
            new ApiResponse(
                200,
                role,
                "Role fetched successfully"
            )
        );

    } catch (error) {

        next(error);

    }

};


module.exports = {
    getAllRoles,
    getRoleById,
    getRoleByName
};