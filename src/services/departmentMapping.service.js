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


    async createBulkMappings(mappingData) {

    const {
        from_department_id,
        to_department_ids,
        status
    } = mappingData;


    // =====================================================
    // VALIDATION
    // =====================================================

    if (
        !from_department_id ||
        !Array.isArray(to_department_ids) ||
        to_department_ids.length === 0
    ) {

        throw new ApiError(
            400,
            "from_department_id and to_department_ids are required"
        );

    }


    const fromDepartmentId =
        parseInt(from_department_id);


    const targetDepartmentIds =
        to_department_ids.map(id => parseInt(id));


    // =====================================================
    // REMOVE DUPLICATES
    // =====================================================

    const uniqueTargetIds =
        [...new Set(targetDepartmentIds)];


    // =====================================================
    // SELF MAPPING CHECK
    // =====================================================

    if (
        uniqueTargetIds.includes(fromDepartmentId)
    ) {

        throw new ApiError(
            400,
            "A department cannot evaluate itself"
        );

    }


    // =====================================================
    // VERIFY FROM DEPARTMENT
    // =====================================================

    const fromDept =
        await departmentRepository.findById(
            fromDepartmentId
        );


    if (!fromDept) {

        throw new ApiError(
            400,
            "Invalid from_department_id"
        );

    }


    // =====================================================
    // VERIFY TARGET DEPARTMENTS
    // =====================================================

    for (const targetId of uniqueTargetIds) {

        const targetDept =
            await departmentRepository.findById(
                targetId
            );


        if (!targetDept) {

            throw new ApiError(
                400,
                `Invalid target department ID: ${targetId}`
            );

        }

    }


    // =====================================================
    // CHECK DUPLICATE MAPPINGS
    // =====================================================

    const existingMappings = [];

    for (const targetId of uniqueTargetIds) {

        const existing =
            await departmentMappingRepository
                .findByFromAndTo(
                    fromDepartmentId,
                    targetId
                );


        if (existing) {

            existingMappings.push(targetId);

        }

    }


    if (existingMappings.length > 0) {

        throw new ApiError(
            400,
            `Mapping already exists for department ID(s): ${existingMappings.join(", ")}`
        );

    }


    // =====================================================
    // CREATE BULK MAPPINGS
    // =====================================================

    const createdIds =
        await departmentMappingRepository.createBulk(
            fromDepartmentId,
            uniqueTargetIds,
            status || "active"
        );


    // =====================================================
    // FETCH CREATED RECORDS
    // =====================================================

    const createdMappings = [];

    for (const mappingId of createdIds) {

        const mapping =
            await departmentMappingRepository
                .findById(mappingId);

        if (mapping) {

            createdMappings.push(mapping);

        }

    }


    return createdMappings;
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
