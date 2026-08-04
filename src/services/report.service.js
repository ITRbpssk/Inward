const dashboardRepository = require("../repositories/dashboard.repository");
const departmentRepository = require("../repositories/department.repository");
const surveyRepository = require("../repositories/survey.repository");
const dashboardService = require("./dashboard.service");
const { generateExcelReport } = require("../utils/excel");
const { generatePDFReport } = require("../utils/pdf");
const ApiError = require("../utils/ApiError");

class ReportService {
    async exportExcelReport(surveyId) {
        const resolvedId = await dashboardService.resolveSurveyId(surveyId);
        if (!resolvedId) {
            throw new ApiError(400, "No survey data available to export");
        }

        const survey = await surveyRepository.findById(resolvedId);
        const data = await dashboardRepository.getDepartmentWiseScores(resolvedId);

        const headers = ["Department Code", "Department Name", "Average Score Received (Out of 5)", "Average Score Given (Out of 5)"];
        const rows = data.map(item => [
            item.department_code,
            item.department_name,
            item.average_score_received,
            item.average_score_given
        ]);

        const title = `USI Report - ${survey.survey_name}`;
        return {
            filename: `USI_Report_Survey_${resolvedId}.xlsx`,
            buffer: await generateExcelReport(headers, rows, "USI Scores Summary")
        };
    }

    async exportPDFReport(surveyId, departmentId) {
        const resolvedId = await dashboardService.resolveSurveyId(surveyId);
        if (!resolvedId) {
            throw new ApiError(400, "No survey data available to export");
        }

        const survey = await surveyRepository.findById(resolvedId);

        if (departmentId) {
            // Department-specific detailed parameter scores PDF
            const dept = await departmentRepository.findById(departmentId);
            if (!dept) {
                throw new ApiError(404, "Department not found");
            }

            const parameterScores = await dashboardRepository.getDepartmentParameterScores(resolvedId, departmentId);

            const title = `Detailed Performance Report: ${dept.department_name} (${dept.department_code})`;
            const headers = ["Parameter Name", "Description", "Weightage (%)", "Average Rating (Out of 5)"];
            const rows = parameterScores.map(p => [
                p.parameter_name,
                p.description,
                `${p.weightage}%`,
                p.average_rating
            ]);

            const pdfBuffer = await generatePDFReport(
                `Survey: ${survey.survey_name}\n${title}`,
                headers,
                rows
            );

            return {
                filename: `USI_Report_${dept.department_code}_Survey_${resolvedId}.pdf`,
                buffer: pdfBuffer
            };
        } else {
            // General scores summary PDF for all departments
            const data = await dashboardRepository.getDepartmentWiseScores(resolvedId);

            const title = "Department Score Summary";
            const headers = ["Code", "Department Name", "Score Received (Out of 5)", "Score Given (Out of 5)"];
            const rows = data.map(item => [
                item.department_code,
                item.department_name,
                item.average_score_received,
                item.average_score_given
            ]);

            const pdfBuffer = await generatePDFReport(
                `Survey: ${survey.survey_name}\n${title}`,
                headers,
                rows
            );

            return {
                filename: `USI_General_Report_Survey_${resolvedId}.pdf`,
                buffer: pdfBuffer
            };
        }
    }
}

module.exports = new ReportService();
