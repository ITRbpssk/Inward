const departmentMappingRepository = require("../repositories/departmentMapping.repository");
const departmentRepository = require("../repositories/department.repository");
const ApiError = require("../utils/ApiError");

class DepartmentMappingService {
    async getAllMappings() {
        return await departmentMappingRepository.findAll();
    }

    async getMappingById(mappingId) {
        const mapping = await departmentMappingRepository.findById(mappingId);
        if (!mapping) {
            throw new ApiError(404, "Mapping not found");
        }
        return mapping;
    }

    async createMapping(mappingData) {
        const { from_department_id, to_department_id, status } = mappingData;

        if (!from_department_id || !to_department_id) {
            throw new ApiError(400, "from_department_id and to_department_id are required");
        }

        if (parseInt(from_department_id) === parseInt(to_department_id)) {
            throw new ApiError(400, "A department cannot evaluate itself");
        }

        // Verify departments exist
        const fromDept = await departmentRepository.findById(from_department_id);
        const toDept = await departmentRepository.findById(to_department_id);
        if (!fromDept || !toDept) {
            throw new ApiError(400, "Invalid from_department_id or to_department_id");
        }

        // Check duplicate mapping
        const existingMapping = await departmentMappingRepository.findByFromAndTo(from_department_id, to_department_id);
        if (existingMapping) {
            throw new ApiError(400, "This department mapping already exists");
        }

        const newId = await departmentMappingRepository.create({
            from_department_id,
            to_department_id,
            status
        });
        return await departmentMappingRepository.findById(newId);
    }

    async updateMapping(mappingId, mappingData) {
        const { from_department_id, to_department_id, status } = mappingData;

        if (!from_department_id || !to_department_id) {
            throw new ApiError(400, "from_department_id and to_department_id are required");
        }

        if (parseInt(from_department_id) === parseInt(to_department_id)) {
            throw new ApiError(400, "A department cannot evaluate itself");
        }

        const mapping = await departmentMappingRepository.findById(mappingId);
        if (!mapping) {
            throw new ApiError(404, "Mapping not found");
        }

        // Verify departments exist
        const fromDept = await departmentRepository.findById(from_department_id);
        const toDept = await departmentRepository.findById(to_department_id);
        if (!fromDept || !toDept) {
            throw new ApiError(400, "Invalid from_department_id or to_department_id");
        }

        // Check duplicate mapping for other records
        const existingMapping = await departmentMappingRepository.findByFromAndTo(from_department_id, to_department_id);
        if (existingMapping && existingMapping.mapping_id !== parseInt(mappingId)) {
            throw new ApiError(400, "This department mapping already exists for another record");
        }

        await departmentMappingRepository.update(mappingId, {
            from_department_id,
            to_department_id,
            status: status || mapping.status
        });
        return await departmentMappingRepository.findById(mappingId);
    }

    async deleteMapping(mappingId) {
        const mapping = await departmentMappingRepository.findById(mappingId);
        if (!mapping) {
            throw new ApiError(404, "Mapping not found");
        }
        return await departmentMappingRepository.delete(mappingId);
    }

    async getMappedToDepartments(fromDeptId) {
        return await departmentMappingRepository.findMappedToDepartments(fromDeptId);
    }
}

module.exports = new DepartmentMappingService();
