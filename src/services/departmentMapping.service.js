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
    // GET GENERAL MAPPINGS
    // =====================================================

    async getGeneralMappings() {

        return await departmentMappingRepository
            .findGeneralMappings();
    }


    // =====================================================
    // GET MAPPING BY ID
    // =====================================================

    async getMappingById(
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

        return mapping;
    }


    // =====================================================
    // CREATE SURVEY BULK MAPPINGS
    //
    // Frontend:
    //
    // Target:
    // QA
    //
    // Evaluating:
    // HR, IT, ACC
    //
    // Database:
    //
    // HR  -> QA
    // IT  -> QA
    // ACC -> QA
    //
    // Different survey same mapping = ALLOWED
    // =====================================================

    async createBulkMappings(
        mappingData
    ) {

        const {
            survey_id,
            target_department_id,
            evaluating_department_ids,
            status
        } = mappingData;


        // -------------------------------------------------
        // BASIC VALIDATION
        // -------------------------------------------------

        if (!survey_id) {

            throw new ApiError(
                400,
                "survey_id is required"
            );
        }


        if (!target_department_id) {

            throw new ApiError(
                400,
                "target_department_id is required"
            );
        }


        if (
            !Array.isArray(
                evaluating_department_ids
            ) ||
            evaluating_department_ids.length === 0
        ) {

            throw new ApiError(
                400,
                "evaluating_department_ids are required"
            );
        }


        const surveyId =
            Number(
                survey_id
            );


        const targetDepartmentId =
            Number(
                target_department_id
            );


        // -------------------------------------------------
        // CLEAN EVALUATOR IDS
        //
        // Preserve original order.
        // -------------------------------------------------

        const evaluatorIds =
            evaluating_department_ids
                .map(
                    id =>
                        Number(id)
                )
                .filter(
                    id =>
                        Number.isInteger(id) &&
                        id > 0
                );


        const uniqueEvaluatorIds =
            Array.from(
                new Set(
                    evaluatorIds
                )
            );


        // -------------------------------------------------
        // VALID ID CHECK
        // -------------------------------------------------

        if (
            !Number.isInteger(
                surveyId
            ) ||
            surveyId <= 0
        ) {

            throw new ApiError(
                400,
                "Invalid survey_id"
            );
        }


        if (
            !Number.isInteger(
                targetDepartmentId
            ) ||
            targetDepartmentId <= 0
        ) {

            throw new ApiError(
                400,
                "Invalid target_department_id"
            );
        }


        if (
            uniqueEvaluatorIds.length === 0
        ) {

            throw new ApiError(
                400,
                "Invalid evaluating department IDs"
            );
        }


        // -------------------------------------------------
        // SELF MAPPING CHECK
        // -------------------------------------------------

        if (
            uniqueEvaluatorIds.includes(
                targetDepartmentId
            )
        ) {

            throw new ApiError(
                400,
                "A department cannot evaluate itself"
            );
        }


        // -------------------------------------------------
        // VERIFY TARGET DEPARTMENT
        // -------------------------------------------------

        const targetDepartment =
            await departmentRepository
                .findById(
                    targetDepartmentId
                );


        if (!targetDepartment) {

            throw new ApiError(
                400,
                "Invalid target department"
            );
        }


        // -------------------------------------------------
        // VERIFY EVALUATING DEPARTMENTS
        // -------------------------------------------------

        for (
            const evaluatorId
            of uniqueEvaluatorIds
        ) {

            const department =
                await departmentRepository
                    .findById(
                        evaluatorId
                    );


            if (!department) {

                throw new ApiError(
                    400,
                    `Invalid evaluating department ID: ${evaluatorId}`
                );
            }
        }


        // -------------------------------------------------
        // SAME SURVEY DUPLICATE CHECK
        //
        // IMPORTANT:
        //
        // We check ONLY this survey.
        //
        // Same mapping in another survey is allowed.
        // -------------------------------------------------

        for (
            const evaluatorId
            of uniqueEvaluatorIds
        ) {

            const existingMapping =
                await departmentMappingRepository
                    .findByFromAndTo(
                        surveyId,
                        evaluatorId,
                        targetDepartmentId
                    );


            if (
                existingMapping &&
                existingMapping.status === "active"
            ) {

                throw new ApiError(
                    400,
                    `Mapping already exists for evaluating department ID: ${evaluatorId}`
                );
            }
        }


        // -------------------------------------------------
        // CREATE
        //
        // Repository createBulk inserts in the same order
        // as uniqueEvaluatorIds.
        // -------------------------------------------------

        const createdIds =
            await departmentMappingRepository
                .createBulk(
                    surveyId,
                    targetDepartmentId,
                    uniqueEvaluatorIds,
                    status || "active"
                );


        // -------------------------------------------------
        // RETURN CREATED RECORDS
        // -------------------------------------------------

        const mappings = [];


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

                mappings.push(
                    mapping
                );
            }
        }


        return mappings;
    }


    // =====================================================
    // CREATE GENERAL DEPARTMENT BULK
    // =====================================================

    async createDepartmentBulkMappings(
        mappingData
    ) {

        const {
            from_department_id,
            to_department_ids,
            status
        } = mappingData;


        if (!from_department_id) {

            throw new ApiError(
                400,
                "from_department_id is required"
            );
        }


        if (
            !Array.isArray(
                to_department_ids
            ) ||
            to_department_ids.length === 0
        ) {

            throw new ApiError(
                400,
                "to_department_ids are required"
            );
        }


        const fromDepartmentId =
            Number(
                from_department_id
            );


        const targetIds =
            to_department_ids
                .map(
                    id =>
                        Number(id)
                )
                .filter(
                    id =>
                        Number.isInteger(id) &&
                        id > 0
                );


        const uniqueTargetIds =
            Array.from(
                new Set(
                    targetIds
                )
            );


        if (
            !Number.isInteger(
                fromDepartmentId
            ) ||
            fromDepartmentId <= 0
        ) {

            throw new ApiError(
                400,
                "Invalid from_department_id"
            );
        }


        if (
            uniqueTargetIds.length === 0
        ) {

            throw new ApiError(
                400,
                "Invalid to_department_ids"
            );
        }


        // -------------------------------------------------
        // SELF MAPPING
        // -------------------------------------------------

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


        // -------------------------------------------------
        // VERIFY SOURCE DEPARTMENT
        // -------------------------------------------------

        const sourceDepartment =
            await departmentRepository
                .findById(
                    fromDepartmentId
                );


        if (!sourceDepartment) {

            throw new ApiError(
                400,
                "Invalid from_department_id"
            );
        }


        // -------------------------------------------------
        // VERIFY TARGET DEPARTMENTS
        // -------------------------------------------------

        for (
            const targetId
            of uniqueTargetIds
        ) {

            const targetDepartment =
                await departmentRepository
                    .findById(
                        targetId
                    );


            if (!targetDepartment) {

                throw new ApiError(
                    400,
                    `Invalid target department ID: ${targetId}`
                );
            }
        }


        // -------------------------------------------------
        // GENERAL DUPLICATE CHECK
        // -------------------------------------------------

        for (
            const targetId
            of uniqueTargetIds
        ) {

            const existingMapping =
                await departmentMappingRepository
                    .findGlobalByFromAndTo(
                        fromDepartmentId,
                        targetId
                    );


            if (
                existingMapping &&
                existingMapping.status === "active"
            ) {

                throw new ApiError(
                    400,
                    `Mapping already exists for target department ID: ${targetId}`
                );
            }
        }


        // -------------------------------------------------
        // CREATE GENERAL MAPPINGS
        // -------------------------------------------------

        const createdIds =
            await departmentMappingRepository
                .createDepartmentBulk(
                    fromDepartmentId,
                    uniqueTargetIds,
                    status || "active"
                );


        // -------------------------------------------------
        // RETURN CREATED RECORDS
        // -------------------------------------------------

        const mappings = [];


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

                mappings.push(
                    mapping
                );
            }
        }


        return mappings;
    }


    // =====================================================
    // GET MAPPINGS BY SURVEY
    // =====================================================

    async getMappingsBySurveyId(
        surveyId
    ) {

        const id =
            Number(
                surveyId
            );


        if (
            !Number.isInteger(id) ||
            id <= 0
        ) {

            throw new ApiError(
                400,
                "Invalid survey ID"
            );
        }


        return await departmentMappingRepository
            .findBySurveyId(
                id
            );
    }


    // =====================================================
    // UPDATE ALL SURVEY MAPPINGS
    //
    // IMPORTANT:
    //
    // NO DELETE.
    //
    // Existing mappings are updated.
    // New mappings are inserted.
    // Removed mappings become inactive.
    //
    // Existing mapping IDs are preserved wherever possible.
    //
    // UI order is preserved.
    // =====================================================

    async updateSurveyMappings(
        surveyId,
        targetDepartmentId,
        evaluatingDepartmentIds,
        status = "active"
    ) {

        const surveyIdNumber =
            Number(
                surveyId
            );


        const targetId =
            Number(
                targetDepartmentId
            );


        // -------------------------------------------------
        // VALIDATION
        // -------------------------------------------------

        if (
            !Number.isInteger(
                surveyIdNumber
            ) ||
            surveyIdNumber <= 0
        ) {

            throw new ApiError(
                400,
                "Invalid survey ID"
            );
        }


        if (
            !Number.isInteger(
                targetId
            ) ||
            targetId <= 0
        ) {

            throw new ApiError(
                400,
                "Invalid target department"
            );
        }


        if (
            !Array.isArray(
                evaluatingDepartmentIds
            )
        ) {

            throw new ApiError(
                400,
                "Evaluating departments are required"
            );
        }


        // -------------------------------------------------
        // CLEAN EVALUATORS
        //
        // Preserve frontend order.
        // -------------------------------------------------

        const evaluatorIds =
            evaluatingDepartmentIds
                .map(
                    id =>
                        Number(id)
                )
                .filter(
                    id =>
                        Number.isInteger(id) &&
                        id > 0
                );


        const uniqueEvaluatorIds =
            Array.from(
                new Set(
                    evaluatorIds
                )
            );


        // -------------------------------------------------
        // SELF MAPPING
        // -------------------------------------------------

        if (
            uniqueEvaluatorIds.includes(
                targetId
            )
        ) {

            throw new ApiError(
                400,
                "A department cannot evaluate itself"
            );
        }


        // -------------------------------------------------
        // VERIFY TARGET
        // -------------------------------------------------

        const targetDepartment =
            await departmentRepository
                .findById(
                    targetId
                );


        if (!targetDepartment) {

            throw new ApiError(
                400,
                "Invalid target department"
            );
        }


        // -------------------------------------------------
        // VERIFY EVALUATORS
        // -------------------------------------------------

        for (
            const evaluatorId
            of uniqueEvaluatorIds
        ) {

            const department =
                await departmentRepository
                    .findById(
                        evaluatorId
                    );


            if (!department) {

                throw new ApiError(
                    400,
                    `Invalid evaluating department ID: ${evaluatorId}`
                );
            }
        }


        // -------------------------------------------------
        // GET EXISTING ACTIVE MAPPINGS
        //
        // Example:
        //
        // 101 HR  -> QA
        // 102 IT  -> QA
        // 103 ACC -> QA
        // -------------------------------------------------

        const existingMappings =
            await departmentMappingRepository
                .findActiveBySurveyId(
                    surveyIdNumber
                );


        // -------------------------------------------------
        // EXISTING MAPPINGS FOR THIS TARGET
        // -------------------------------------------------

        const existingTargetMappings =
            existingMappings.filter(
                mapping =>
                    Number(
                        mapping.to_department_id
                    ) === targetId
            );


        // -------------------------------------------------
        // EXISTING MAPPING MAP
        //
        // evaluator ID -> existing row
        // -------------------------------------------------

        const existingByEvaluator =
            new Map();


        existingTargetMappings.forEach(
            mapping => {

                existingByEvaluator.set(
                    Number(
                        mapping.from_department_id
                    ),
                    mapping
                );

            }
        );


        // -------------------------------------------------
        // UPDATE / INSERT
        //
        // IMPORTANT:
        //
        // Loop follows UI order.
        // -------------------------------------------------

        const resultMappings = [];


        for (
            let index = 0;
            index < uniqueEvaluatorIds.length;
            index++
        ) {

            const evaluatorId =
                uniqueEvaluatorIds[index];


            const existingMapping =
                existingByEvaluator.get(
                    evaluatorId
                );


            // =============================================
            // EXISTING → UPDATE
            // =============================================

            if (
                existingMapping
            ) {

                await departmentMappingRepository
                    .update(
                        existingMapping.mapping_id,
                        {

                            survey_id:
                                surveyIdNumber,

                            from_department_id:
                                evaluatorId,

                            to_department_id:
                                targetId,

                            status:
                                status || "active"

                        }
                    );


                const updatedMapping =
                    await departmentMappingRepository
                        .findById(
                            existingMapping.mapping_id
                        );


                if (
                    updatedMapping
                ) {

                    resultMappings.push(
                        updatedMapping
                    );
                }


                continue;
            }


            // =============================================
            // NEW → INSERT
            // =============================================

            const newMappingId =
                await departmentMappingRepository
                    .create({

                        survey_id:
                            surveyIdNumber,

                        from_department_id:
                            evaluatorId,

                        to_department_id:
                            targetId,

                        status:
                            status || "active"

                    });


            const newMapping =
                await departmentMappingRepository
                    .findById(
                        newMappingId
                    );


            if (
                newMapping
            ) {

                resultMappings.push(
                    newMapping
                );
            }
        }


        // -------------------------------------------------
        // MARK REMOVED EVALUATORS INACTIVE
        //
        // NO DELETE.
        //
        // Only mappings for THIS target are considered.
        // -------------------------------------------------

        const newEvaluatorSet =
            new Set(
                uniqueEvaluatorIds
            );


        for (
            const existingMapping
            of existingTargetMappings
        ) {

            const oldEvaluatorId =
                Number(
                    existingMapping
                        .from_department_id
                );


            if (
                !newEvaluatorSet.has(
                    oldEvaluatorId
                )
            ) {

                await departmentMappingRepository
                    .updateStatus(
                        existingMapping.mapping_id,
                        "inactive"
                    );
            }
        }


        // -------------------------------------------------
        // RETURN CURRENT ACTIVE MAPPINGS
        //
        // mapping_id ASC preserves database order.
        // -------------------------------------------------

        return await departmentMappingRepository
            .findBySurveyId(
                surveyIdNumber
            );
    }


    // =====================================================
    // CREATE SINGLE MAPPING
    // =====================================================

    async createMapping(
        mappingData
    ) {

        const {
            survey_id,
            from_department_id,
            to_department_id,
            status
        } = mappingData;


        if (
            !from_department_id ||
            !to_department_id
        ) {

            throw new ApiError(
                400,
                "from_department_id and to_department_id are required"
            );
        }


        const fromId =
            Number(
                from_department_id
            );


        const toId =
            Number(
                to_department_id
            );


        // -------------------------------------------------
        // SELF MAPPING
        // -------------------------------------------------

        if (
            fromId === toId
        ) {

            throw new ApiError(
                400,
                "A department cannot evaluate itself"
            );
        }


        // -------------------------------------------------
        // VERIFY DEPARTMENTS
        // -------------------------------------------------

        const fromDepartment =
            await departmentRepository
                .findById(
                    fromId
                );


        const toDepartment =
            await departmentRepository
                .findById(
                    toId
                );


        if (
            !fromDepartment ||
            !toDepartment
        ) {

            throw new ApiError(
                400,
                "Invalid department ID"
            );
        }


        // -------------------------------------------------
        // DUPLICATE CHECK
        // -------------------------------------------------

        let existingMapping;


        if (
            survey_id !== null &&
            survey_id !== undefined
        ) {

            existingMapping =
                await departmentMappingRepository
                    .findByFromAndTo(
                        Number(
                            survey_id
                        ),
                        fromId,
                        toId
                    );

        } else {

            existingMapping =
                await departmentMappingRepository
                    .findGlobalByFromAndTo(
                        fromId,
                        toId
                    );
        }


        if (
            existingMapping &&
            existingMapping.status === "active"
        ) {

            throw new ApiError(
                400,
                "This department mapping already exists"
            );
        }


        // -------------------------------------------------
        // CREATE
        // -------------------------------------------------

        const mappingId =
            await departmentMappingRepository
                .create({

                    survey_id:
                        survey_id || null,

                    from_department_id:
                        fromId,

                    to_department_id:
                        toId,

                    status:
                        status || "active"

                });


        return await departmentMappingRepository
            .findById(
                mappingId
            );
    }


    // =====================================================
    // UPDATE SINGLE MAPPING
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


        const existing =
            await departmentMappingRepository
                .findById(
                    mappingId
                );


        if (!existing) {

            throw new ApiError(
                404,
                "Mapping not found"
            );
        }


        const fromId =
            Number(
                from_department_id
            );


        const toId =
            Number(
                to_department_id
            );


        if (
            !fromId ||
            !toId
        ) {

            throw new ApiError(
                400,
                "from_department_id and to_department_id are required"
            );
        }


        if (
            fromId === toId
        ) {

            throw new ApiError(
                400,
                "A department cannot evaluate itself"
            );
        }


        // -------------------------------------------------
        // DUPLICATE CHECK
        //
        // Ignore the current mapping itself.
        // -------------------------------------------------

        let duplicate;


        if (
            survey_id !== null &&
            survey_id !== undefined
        ) {

            duplicate =
                await departmentMappingRepository
                    .findByFromAndTo(
                        Number(
                            survey_id
                        ),
                        fromId,
                        toId
                    );

        } else {

            duplicate =
                await departmentMappingRepository
                    .findGlobalByFromAndTo(
                        fromId,
                        toId
                    );
        }


        if (
            duplicate &&
            Number(
                duplicate.mapping_id
            ) !== Number(
                mappingId
            ) &&
            duplicate.status === "active"
        ) {

            throw new ApiError(
                400,
                "This department mapping already exists"
            );
        }


        // -------------------------------------------------
        // UPDATE
        // -------------------------------------------------

        await departmentMappingRepository
            .update(
                mappingId,
                {

                    survey_id:
                        survey_id || null,

                    from_department_id:
                        fromId,

                    to_department_id:
                        toId,

                    status:
                        status ||
                        existing.status ||
                        "active"

                }
            );


        return await departmentMappingRepository
            .findById(
                mappingId
            );
    }


    // =====================================================
    // DELETE SINGLE MAPPING
    //
    // Existing DELETE API only.
    //
    // NOT used by survey EDIT.
    // =====================================================

    async deleteMapping(
        mappingId
    ) {

        const existing =
            await departmentMappingRepository
                .findById(
                    mappingId
                );


        if (!existing) {

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
    // HOD - MY TARGET DEPARTMENTS
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