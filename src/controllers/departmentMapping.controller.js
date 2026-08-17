const departmentMappingService = require("../services/departmentMapping.service");
const ApiResponse = require("../utils/ApiResponse");

const getAllMappings = async (req, res, next) => {
    try {
        const mappings = await departmentMappingService.getAllMappings();
        res.status(200).json(new ApiResponse(200, mappings, "Department mappings fetched successfully"));
    } catch (error) {
        next(error);
    }
};

const getMappingById = async (req, res, next) => {
    try {
        const mapping = await departmentMappingService.getMappingById(req.params.id);
        res.status(200).json(new ApiResponse(200, mapping, "Department mapping fetched successfully"));
    } catch (error) {
        next(error);
    }
};

const createMapping = async (req, res, next) => {
    try {
        const mapping = await departmentMappingService.createMapping(req.body);
        res.status(201).json(new ApiResponse(201, mapping, "Department mapping created successfully"));
    } catch (error) {
        next(error);
    }
};


const createBulkMappings = async (req, res, next) => {

    try {

        const mappings =
            await departmentMappingService
                .createBulkMappings(req.body);


        res.status(201).json(
            new ApiResponse(
                201,
                mappings,
                "Department mappings created successfully"
            )
        );

    } catch (error) {

        next(error);

    }

};

const updateMapping = async (req, res, next) => {
    try {
        const mapping = await departmentMappingService.updateMapping(req.params.id, req.body);
        res.status(200).json(new ApiResponse(200, mapping, "Department mapping updated successfully"));
    } catch (error) {
        next(error);
    }
};

const deleteMapping = async (req, res, next) => {
    try {
        await departmentMappingService.deleteMapping(req.params.id);
        res.status(200).json(new ApiResponse(200, null, "Department mapping deleted successfully"));
    } catch (error) {
        next(error);
    }
};

const getMyEvaluationTargets = async (req, res, next) => {
    try {
        const fromDeptId = req.user.department_id;
        const targets = await departmentMappingService.getMappedToDepartments(fromDeptId);
        res.status(200).json(new ApiResponse(200, targets, "Evaluation target departments fetched successfully"));
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getAllMappings,
    getMappingById,
    createMapping,
    createBulkMappings,
    updateMapping,
    deleteMapping,
    getMyEvaluationTargets
};
