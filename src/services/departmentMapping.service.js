const departmentMappingRepository =
    require("../repositories/departmentMapping.repository");

const departmentRepository =
    require("../repositories/department.repository");

const ApiError =
    require("../utils/ApiError");


class DepartmentMappingService {


    // =====================================================
    // GET ALL MAPPINGS
    // =====================================================

    async getAllMappings() {

        return await departmentMappingRepository
            .findAll();

    }


    // =====================================================
    // GET MAPPING BY ID
    // =====================================================

    async getMappingById(mappingId) {

        const mapping =
            await departmentMappingRepository
                .findById(mappingId);

        if (!mapping) {

            throw new ApiError(
                404,
                "Mapping not found"
            );

        }

        return mapping;

    }


    // =====================================================
    // CREATE BULK MAPPINGS
    // SURVEY-WISE
    //
    // One survey can have:
    //
    // QA -> HR
    // QA -> IT
    //
    // Another survey can also have:
    //
    // QA -> HR
    //
    // This is allowed because mapping belongs to survey.
    // =====================================================

    async createBulkMappings(mappingData) {

        const {
            survey_id,
            from_department_id,
            to_department_ids,
            status
        } = mappingData;


        // =================================================
        // REQUIRED FIELD VALIDATION
        // =================================================

        if (!survey_id) {

            throw new ApiError(
                400,
                "survey_id is required"
            );

        }


        if (!from_department_id) {

            throw new ApiError(
                400,
                "from_department_id is required"
            );

        }


        if (
            !Array.isArray(to_department_ids) ||
            to_department_ids.length === 0
        ) {

            throw new ApiError(
                400,
                "to_department_ids are required"
            );

        }


        const surveyId =
            parseInt(survey_id);


        const fromDepartmentId =
            parseInt(from_department_id);


        const targetDepartmentIds =
            to_department_ids
                .map(id => parseInt(id))
                .filter(id => !isNaN(id));


        // =================================================
        // REMOVE DUPLICATES FROM REQUEST
        // =================================================

        const uniqueTargetIds =
            [...new Set(targetDepartmentIds)];


        if (
            uniqueTargetIds.length === 0
        ) {

            throw new ApiError(
                400,
                "At least one evaluating department is required"
            );

        }


        // =================================================
        // SELF MAPPING CHECK
        // =================================================

        if (
            uniqueTargetIds.includes(
                fromDepartmentId
            )
        ) {

            throw new ApiError(
                400,
                "A department cannot evaluate itself"
            );

        }


        // =================================================
        // VERIFY TARGET DEPARTMENT
        // =================================================

        const fromDepartment =
            await departmentRepository
                .findById(
                    fromDepartmentId
                );


        if (!fromDepartment) {

            throw new ApiError(
                400,
                "Invalid target department"
            );

        }


        // =================================================
        // VERIFY EVALUATING DEPARTMENTS
        // =================================================

        for (
            const targetId
            of uniqueTargetIds
        ) {

            const department =
                await departmentRepository
                    .findById(
                        targetId
                    );


            if (!department) {

                throw new ApiError(
                    400,
                    `Invalid evaluating department ID: ${targetId}`
                );

            }

        }


        // =================================================
        // IMPORTANT
        //
        // DUPLICATE CHECK IS SURVEY-WISE
        //
        // Same department mapping in another survey
        // is completely allowed.
        // =================================================

        const existingMappings = [];


        for (
            const targetId
            of uniqueTargetIds
        ) {

            const existing =
                await departmentMappingRepository
                    .findByFromAndTo(
                        surveyId,
                        fromDepartmentId,
                        targetId
                    );


            if (existing) {

                existingMappings.push(
                    targetId
                );

            }

        }


        // =================================================
        // DUPLICATE FOUND
        // =================================================

        if (
            existingMappings.length > 0
        ) {

            throw new ApiError(
                400,
                `Mapping already exists for department ID(s): ${existingMappings.join(", ")} in this survey`
            );

        }


        // =================================================
        // CREATE MAPPINGS
        // =================================================

        const createdIds =
            await departmentMappingRepository
                .createBulk(
                    surveyId,
                    fromDepartmentId,
                    uniqueTargetIds,
                    status || "active"
                );


        // =================================================
        // FETCH CREATED MAPPINGS
        // =================================================

        const createdMappings = [];


        for (
            const mappingId
            of createdIds
        ) {

            const mapping =
                await departmentMappingRepository
                    .findById(
                        mappingId
                    );


            if (mapping) {

                createdMappings.push(
                    mapping
                );

            }

        }


        return createdMappings;

    }


    // =====================================================
    // CREATE SINGLE MAPPING
    // =====================================================

    async createMapping(mappingData) {

        const {
            survey_id,
            from_department_id,
            to_department_id,
            status
        } = mappingData;


        if (!survey_id) {

            throw new ApiError(
                400,
                "survey_id is required"
            );

        }


        if (
            !from_department_id ||
            !to_department_id
        ) {

            throw new ApiError(
                400,
                "from_department_id and to_department_id are required"
            );

        }


        // =================================================
        // SELF MAPPING
        // =================================================

        if (
            parseInt(from_department_id) ===
            parseInt(to_department_id)
        ) {

            throw new ApiError(
                400,
                "A department cannot evaluate itself"
            );

        }


        // =================================================
        // VERIFY DEPARTMENTS
        // =================================================

        const fromDept =
            await departmentRepository
                .findById(
                    from_department_id
                );


        const toDept =
            await departmentRepository
                .findById(
                    to_department_id
                );


        if (
            !fromDept ||
            !toDept
        ) {

            throw new ApiError(
                400,
                "Invalid department ID"
            );

        }


        // =================================================
        // SURVEY-WISE DUPLICATE CHECK
        // =================================================

        const existingMapping =
            await departmentMappingRepository
                .findByFromAndTo(
                    parseInt(survey_id),
                    parseInt(from_department_id),
                    parseInt(to_department_id)
                );


        if (existingMapping) {

            throw new ApiError(
                400,
                "This mapping already exists in this survey"
            );

        }


        // =================================================
        // CREATE
        // =================================================

        const newId =
            await departmentMappingRepository
                .create({

                    survey_id,

                    from_department_id,

                    to_department_id,

                    status

                });


        return await departmentMappingRepository
            .findById(
                newId
            );

    }


    // =====================================================
    // UPDATE MAPPING
    // =====================================================

    async updateMapping(
        mappingId,
        mappingData
    ) {

        const {
            survey_id,
            from_department_id,
            to_department_id,
            status
        } = mappingData;


        if (!survey_id) {

            throw new ApiError(
                400,
                "survey_id is required"
            );

        }


        if (
            !from_department_id ||
            !to_department_id
        ) {

            throw new ApiError(
                400,
                "from_department_id and to_department_id are required"
            );

        }


        // =================================================
        // SELF MAPPING
        // =================================================

        if (
            parseInt(from_department_id) ===
            parseInt(to_department_id)
        ) {

            throw new ApiError(
                400,
                "A department cannot evaluate itself"
            );

        }


        // =================================================
        // FIND EXISTING MAPPING
        // =================================================

        const mapping =
            await departmentMappingRepository
                .findById(
                    mappingId
                );


        if (!mapping) {

            throw new ApiError(
                404,
                "Mapping not found"
            );

        }


        // =================================================
        // VERIFY DEPARTMENTS
        // =================================================

        const fromDept =
            await departmentRepository
                .findById(
                    from_department_id
                );


        const toDept =
            await departmentRepository
                .findById(
                    to_department_id
                );


        if (
            !fromDept ||
            !toDept
        ) {

            throw new ApiError(
                400,
                "Invalid department ID"
            );

        }


        // =================================================
        // SURVEY-WISE DUPLICATE CHECK
        // =================================================

        const existingMapping =
            await departmentMappingRepository
                .findByFromAndTo(
                    parseInt(survey_id),
                    parseInt(from_department_id),
                    parseInt(to_department_id)
                );


        // Do not treat the same record as duplicate

        if (
            existingMapping &&
            existingMapping.mapping_id !==
                parseInt(mappingId)
        ) {

            throw new ApiError(
                400,
                "This mapping already exists in this survey"
            );

        }


        // =================================================
        // UPDATE
        // =================================================

        await departmentMappingRepository
            .update(
                mappingId,
                {

                    survey_id,

                    from_department_id,

                    to_department_id,

                    status:
                        status ||
                        mapping.status

                }
            );


        return await departmentMappingRepository
            .findById(
                mappingId
            );

    }


    // =====================================================
    // DELETE MAPPING
    // =====================================================

    async deleteMapping(
        mappingId
    ) {

        const mapping =
            await departmentMappingRepository
                .findById(
                    mappingId
                );


        if (!mapping) {

            throw new ApiError(
                404,
                "Mapping not found"
            );

        }


        return await departmentMappingRepository
            .delete(
                mappingId
            );

    }


    // =====================================================
    // GET MAPPINGS BY SURVEY
    // =====================================================

    async getMappingsBySurveyId(
        surveyId
    ) {

        if (!surveyId) {

            throw new ApiError(
                400,
                "Survey ID is required"
            );

        }


        return await departmentMappingRepository
            .findBySurveyId(
                surveyId
            );

    }


    // =====================================================
    // COMPATIBILITY METHOD
    // =====================================================

    async getMappingsBySurvey(
        surveyId
    ) {

        return await this.getMappingsBySurveyId(
            surveyId
        );

    }


    // =====================================================
    // GET MY EVALUATION TARGETS
    // =====================================================

    async getMappedToDepartments(
        fromDeptId
    ) {

        return await departmentMappingRepository
            .findMappedToDepartments(
                fromDeptId
            );

    }

}


module.exports =
    new DepartmentMappingService();