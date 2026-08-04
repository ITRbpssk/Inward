const reportService = require("../services/report.service");

const exportExcel = async (req, res, next) => {
    try {
        const { survey_id } = req.query;
        const { filename, buffer } = await reportService.exportExcelReport(survey_id);

        res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
        res.status(200).send(buffer);
    } catch (error) {
        next(error);
    }
};

const exportPDF = async (req, res, next) => {
    try {
        const { survey_id, department_id } = req.query;
        const { filename, buffer } = await reportService.exportPDFReport(survey_id, department_id);

        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
        res.status(200).send(buffer);
    } catch (error) {
        next(error);
    }
};

module.exports = {
    exportExcel,
    exportPDF
};
