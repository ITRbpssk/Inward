const departmentRepository = require("../repositories/department.repository");
const ApiError = require("../utils/ApiError");

class DepartmentService {
    async getAllDepartments() {
        return await departmentRepository.findAll();
    }

    async getDepartmentById(departmentId) {
        const dept = await departmentRepository.findById(departmentId);
        if (!dept) {
            throw new ApiError(404, "Department not found");
        }
        return dept;
    }

    async createDepartment(deptData) {
        const { department_code, department_name, description, status } = deptData;

        if (!department_code || !department_name) {
            throw new ApiError(400, "department_code and department_name are required");
        }

        const existingDept = await departmentRepository.findByCode(department_code);
        if (existingDept) {
            throw new ApiError(400, `Department with code '${department_code}' already exists`);
        }

        const newId = await departmentRepository.create({
            department_code,
            department_name,
            description,
            status
        });
        return await departmentRepository.findById(newId);
    }

    async updateDepartment(departmentId, deptData) {
        const { department_code, department_name, description, status } = deptData;

        if (!department_code || !department_name) {
            throw new ApiError(400, "department_code and department_name are required");
        }

        const dept = await departmentRepository.findById(departmentId);
        if (!dept) {
            throw new ApiError(404, "Department not found");
        }

        const existingDept = await departmentRepository.findByCode(department_code);
        if (existingDept && existingDept.department_id !== parseInt(departmentId)) {
            throw new ApiError(400, `Department with code '${department_code}' already exists`);
        }

        await departmentRepository.update(departmentId, {
            department_code,
            department_name,
            description,
            status: status || dept.status
        });
        return await departmentRepository.findById(departmentId);
    }

    async deleteDepartment(departmentId) {
        const dept = await departmentRepository.findById(departmentId);
        if (!dept) {
            throw new ApiError(404, "Department not found");
        }
        return await departmentRepository.delete(departmentId);
    }
}

module.exports = new DepartmentService();
