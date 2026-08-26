const reportService =
    require("../services/report.service");


// =====================================================
// QUARTERLY REPORT
//
// ADMIN:
//     All departments
//
// HOD:
//     Departments evaluated by logged-in HOD
//
// GET:
//     /reports/quarterly?year=2026
// =====================================================

const getQuarterlyReport =
    async (
        req,
        res,
        next
    ) => {

        try {

            const {
                year
            } = req.query;


            // ---------------------------------------------
            // USER DETAILS FROM AUTH MIDDLEWARE
            //
            // IMPORTANT:
            // Auth middleware stores role as role_name
            // ---------------------------------------------

            const role =
                req.user?.role_name;


            const departmentId =
                req.user?.department_id;


            console.log("");

            console.log(
                "========================================"
            );

            console.log(
                "📊 QUARTERLY REPORT CONTROLLER"
            );

            console.log(
                "YEAR:",
                year
            );

            console.log(
                "ROLE:",
                role
            );

            console.log(
                "DEPARTMENT ID:",
                departmentId
            );

            console.log(
                "USER:",
                req.user
            );

            console.log(
                "========================================"
            );


            // ---------------------------------------------
            // GET REPORT
            // ---------------------------------------------

            const report =
                await reportService
                    .getQuarterlyReport(

                        year,

                        role,

                        departmentId

                    );


            // ---------------------------------------------
            // RESPONSE
            // ---------------------------------------------

            res
                .status(200)
                .json({

                    success:
                        true,

                    statusCode:
                        200,

                    message:
                        "Quarterly report fetched successfully",

                    data:
                        report

                });

        }

        catch (
            error
        ) {

            next(
                error
            );

        }

    };


// =====================================================
// SPECIAL SURVEY REPORT
//
// ADMIN:
//     All departments
//
// HOD:
//     Departments evaluated by logged-in HOD
//
// GET:
//     /reports/special?survey_id=123
// =====================================================

const getSpecialSurveyReport =
    async (
        req,
        res,
        next
    ) => {

        try {

            const {
                survey_id
            } = req.query;


            // ---------------------------------------------
            // USER DETAILS FROM AUTH MIDDLEWARE
            // ---------------------------------------------

            const role =
                req.user?.role_name;


            const departmentId =
                req.user?.department_id;


            console.log("");

            console.log(
                "========================================"
            );

            console.log(
                "📊 SPECIAL SURVEY REPORT CONTROLLER"
            );

            console.log(
                "SURVEY ID:",
                survey_id
            );

            console.log(
                "ROLE:",
                role
            );

            console.log(
                "DEPARTMENT ID:",
                departmentId
            );

            console.log(
                "USER:",
                req.user
            );

            console.log(
                "========================================"
            );


            // ---------------------------------------------
            // GET SPECIAL REPORT
            // ---------------------------------------------

            const report =
                await reportService
                    .getSpecialSurveyReport(

                        survey_id,

                        role,

                        departmentId

                    );


            // ---------------------------------------------
            // RESPONSE
            // ---------------------------------------------

            res
                .status(200)
                .json({

                    success:
                        true,

                    statusCode:
                        200,

                    message:
                        "Special survey report fetched successfully",

                    data:
                        report

                });

        }

        catch (
            error
        ) {

            next(
                error
            );

        }

    };


// =====================================================
// EXISTING EXCEL EXPORT
//
// Kept unchanged for now.
//
// Later we can update this according to:
//
// 1. Quarterly Report
// 2. Special Survey Report
//
// =====================================================

const exportExcel =
    async (
        req,
        res,
        next
    ) => {

        try {

            const {
                survey_id
            } = req.query;


            console.log("");

            console.log(
                "========================================"
            );

            console.log(
                "📥 EXCEL REPORT"
            );

            console.log(
                "SURVEY ID:",
                survey_id
            );

            console.log(
                "========================================"
            );


            const {
                filename,
                buffer
            } =
                await reportService
                    .exportExcelReport(
                        survey_id
                    );


            res.setHeader(

                "Content-Type",

                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"

            );


            res.setHeader(

                "Content-Disposition",

                `attachment; filename="${filename}"`

            );


            res
                .status(200)
                .send(
                    buffer
                );

        }

        catch (
            error
        ) {

            next(
                error
            );

        }

    };


// =====================================================
// EXISTING PDF EXPORT
//
// Kept unchanged for now.
// =====================================================

const exportPDF =
    async (
        req,
        res,
        next
    ) => {

        try {

            const {
                survey_id,
                department_id
            } = req.query;


            console.log("");

            console.log(
                "========================================"
            );

            console.log(
                "📥 PDF REPORT"
            );

            console.log(
                "SURVEY ID:",
                survey_id
            );

            console.log(
                "DEPARTMENT ID:",
                department_id
            );

            console.log(
                "========================================"
            );


            const {
                filename,
                buffer
            } =
                await reportService
                    .exportPDFReport(

                        survey_id,

                        department_id

                    );


            res.setHeader(

                "Content-Type",

                "application/pdf"

            );


            res.setHeader(

                "Content-Disposition",

                `attachment; filename="${filename}"`

            );


            res
                .status(200)
                .send(
                    buffer
                );

        }

        catch (
            error
        ) {

            next(
                error
            );

        }

    };


// =====================================================
// EXPORT CONTROLLER
// =====================================================

module.exports = {

    getQuarterlyReport,

    getSpecialSurveyReport,

    exportExcel,

    exportPDF

};