const surveyDepartmentService =
    require("../services/surveyDepartment.service");

const ApiResponse =
    require("../utils/ApiResponse");


const getDepartmentsBySurvey = async (req, res, next) => {

    try {

        const departments =
            await surveyDepartmentService
                .getDepartmentsBySurvey(req.params.surveyId);

        res.status(200).json(
            new ApiResponse(
                200,
                departments,
                "Survey departments fetched successfully"
            )
        );

    } catch (error) {

        next(error);

    }

};


const updateSurveyDepartments = async (req, res, next) => {

    try {

        const departments =
            await surveyDepartmentService
                .updateSurveyDepartments(
                    req.params.surveyId,
                    req.body.department_ids
                );

        res.status(200).json(
            new ApiResponse(
                200,
                departments,
                "Survey departments updated successfully"
            )
        );

    } catch (error) {

        next(error);

    }

};


module.exports = {
    getDepartmentsBySurvey,
    updateSurveyDepartments
};