const parameterService = require("../services/parameter.service");
const ApiResponse = require("../utils/ApiResponse");

const getAllParameters = async (req, res, next) => {
    try {
        const params = await parameterService.getAllParameters();
        res.status(200).json(new ApiResponse(200, params, "Parameters fetched successfully"));
    } catch (error) {
        next(error);
    }
};

const getParameterById = async (req, res, next) => {
    try {
        const param = await parameterService.getParameterById(req.params.id);
        res.status(200).json(new ApiResponse(200, param, "Parameter fetched successfully"));
    } catch (error) {
        next(error);
    }
};

const createParameter = async (req, res, next) => {
    try {
        const param = await parameterService.createParameter(req.body);
        res.status(201).json(new ApiResponse(201, param, "Parameter created successfully"));
    } catch (error) {
        next(error);
    }
};

const updateParameter = async (req, res, next) => {
    try {
        const param = await parameterService.updateParameter(req.params.id, req.body);
        res.status(200).json(new ApiResponse(200, param, "Parameter updated successfully"));
    } catch (error) {
        next(error);
    }
};

const deleteParameter = async (req, res, next) => {
    try {
        await parameterService.deleteParameter(req.params.id);
        res.status(200).json(new ApiResponse(200, null, "Parameter deleted successfully"));
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getAllParameters,
    getParameterById,
    createParameter,
    updateParameter,
    deleteParameter
};
