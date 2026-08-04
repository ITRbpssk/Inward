const departmentService = require("../services/department.service");
const ApiResponse = require("../utils/ApiResponse");

const getAllDepartments = async (req, res, next) => {
    try {
        const depts = await departmentService.getAllDepartments();
        res.status(200).json(new ApiResponse(200, depts, "Departments fetched successfully"));
    } catch (error) {
        next(error);
    }
};

const getDepartmentById = async (req, res, next) => {
    try {
        const dept = await departmentService.getDepartmentById(req.params.id);
        res.status(200).json(new ApiResponse(200, dept, "Department fetched successfully"));
    } catch (error) {
        next(error);
    }
};

const createDepartment = async (req, res, next) => {
    try {
        const dept = await departmentService.createDepartment(req.body);
        res.status(201).json(new ApiResponse(201, dept, "Department created successfully"));
    } catch (error) {
        next(error);
    }
};

const updateDepartment = async (req, res, next) => {
    try {
        const dept = await departmentService.updateDepartment(req.params.id, req.body);
        res.status(200).json(new ApiResponse(200, dept, "Department updated successfully"));
    } catch (error) {
        next(error);
    }
};

const deleteDepartment = async (req, res, next) => {
    try {
        await departmentService.deleteDepartment(req.params.id);
        res.status(200).json(new ApiResponse(200, null, "Department deleted successfully"));
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getAllDepartments,
    getDepartmentById,
    createDepartment,
    updateDepartment,
    deleteDepartment
};
