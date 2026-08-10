const surveyDepartmentRepository =
    require("../repositories/surveyDepartment.repository");

const surveyRepository =
    require("../repositories/survey.repository");

const departmentRepository =
    require("../repositories/department.repository");

const ApiError =
    require("../utils/ApiError");


class SurveyDepartmentService {

    async getDepartmentsBySurvey(surveyId) {

        const survey =
            await surveyRepository.findById(surveyId);

        if (!survey) {
            throw new ApiError(404, "Survey not found");
        }

        return await surveyDepartmentRepository
            .findBySurveyId(surveyId);
    }


    async updateSurveyDepartments(surveyId, departmentIds) {

        const survey =
            await surveyRepository.findById(surveyId);

        if (!survey) {
            throw new ApiError(404, "Survey not found");
        }


        if (!Array.isArray(departmentIds)) {

            throw new ApiError(
                400,
                "department_ids must be an array"
            );

        }


        const uniqueDepartmentIds =
            [...new Set(
                departmentIds.map(id => parseInt(id))
            )];


        // Validate departments
        for (const departmentId of uniqueDepartmentIds) {

            const department =
                await departmentRepository.findById(
                    departmentId
                );

            if (!department) {

                throw new ApiError(
                    400,
                    `Invalid department_id: ${departmentId}`
                );

            }

            if (department.status !== "active") {

                throw new ApiError(
                    400,
                    `Department ${department.department_name} is inactive`
                );

            }

        }


        // Remove old mappings
        await surveyDepartmentRepository
            .deleteBySurveyId(surveyId);


        // Create new mappings
        for (const departmentId of uniqueDepartmentIds) {

            await surveyDepartmentRepository.create(
                surveyId,
                departmentId
            );

        }


        // Return updated mappings
        return await surveyDepartmentRepository
            .findBySurveyId(surveyId);
    }

}


module.exports = new SurveyDepartmentService();