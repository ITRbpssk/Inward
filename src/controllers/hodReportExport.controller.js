const hodReportExportService =
    require("../services/hodReportExport.service");

const ApiError =
    require("../utils/ApiError");


// =====================================================
// HELPERS
// =====================================================

const getFinancialYear =
    req => {

        const financialYear =
            String(
                req.query.financial_year || ""
            )
                .trim();


        if (!financialYear) {

            throw new ApiError(
                400,
                "financial_year is required."
            );

        }


        return financialYear;

    };


const getPeriod =
    req => {

        return String(
            req.query.period || "YEARLY"
        )
            .trim()
            .toUpperCase();

    };


const getFormat =
    req => {

        return String(
            req.query.format || ""
        )
            .trim()
            .toLowerCase();

    };


// =====================================================
// SEND FILE
// =====================================================

const sendFile =
    (
        res,
        buffer,
        format,
        fileName
    ) => {

        if (
            format === "excel"
        ) {

            res.setHeader(
                "Content-Type",
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            );

        } else {

            res.setHeader(
                "Content-Type",
                "application/pdf"
            );

        }


        res.setHeader(
            "Content-Disposition",
            `attachment; filename="${fileName}"`
        );


        res.setHeader(
            "Content-Length",
            buffer.length
        );


        return res.send(
            buffer
        );

    };


// =====================================================
// HOD - GENERAL EXPORT
//
// GET:
//
// /hod-reports/general/export
//
// Query:
//
// financial_year=2026-27
// period=Q1
// format=excel
//
// OR
//
// period=Q2
// period=Q3
// period=Q4
// period=YEARLY
// =====================================================

const exportGeneral =
    async (
        req,
        res,
        next
    ) => {

        try {

            const financialYear =
                getFinancialYear(req);


            const period =
                getPeriod(req);


            const format =
                getFormat(req);


            if (
                ![
                    "excel",
                    "pdf"
                ].includes(
                    format
                )
            ) {

                throw new ApiError(
                    400,
                    "format must be excel or pdf."
                );

            }


            // =================================================
            // HOD REPORT DATA
            //
            // IMPORTANT:
            //
            // req.user.user_id is used.
            //
            // Therefore IT HOD gets ONLY IT HOD's
            // target departments/report data.
            // =================================================

            const report =
                await hodReportExportService
                    .getGeneralExportData(
                        req.user,
                        financialYear,
                        period
                    );


            // =================================================
            // GENERATE FILE
            //
            // These methods will be connected to the
            // HOD-specific Excel/PDF generator.
            // =================================================

            let buffer;


            if (
                format === "excel"
            ) {

                buffer =
                    await hodReportExportService
                        .generateExcel(
                            report
                        );

            } else {

                buffer =
                    await hodReportExportService
                        .generatePdf(
                            report
                        );

            }


            // =================================================
            // FILE NAME
            // =================================================

            const extension =
                format === "excel"
                    ? "xlsx"
                    : "pdf";


            const safePeriod =
                period.replace(
                    /\s+/g,
                    "-"
                );


            const fileName =
                `HOD-General-${financialYear}-${safePeriod}.${extension}`;


            return sendFile(
                res,
                buffer,
                format,
                fileName
            );

        }

        catch (error) {

            console.error(
                "❌ HOD GENERAL EXPORT ERROR:",
                error
            );


            next(error);

        }

    };


// =====================================================
// HOD - SPECIAL EXPORT
//
// GET:
//
// /hod-reports/special/export
//
// Query:
//
// financial_year=2026-27
// period=Special 1
// format=excel
//
// OR
//
// period=ALL
// =====================================================

const exportSpecial =
    async (
        req,
        res,
        next
    ) => {

        try {

            const financialYear =
                getFinancialYear(req);


            const period =
                String(
                    req.query.period || "ALL"
                )
                    .trim();


            const format =
                getFormat(req);


            if (
                ![
                    "excel",
                    "pdf"
                ].includes(
                    format
                )
            ) {

                throw new ApiError(
                    400,
                    "format must be excel or pdf."
                );

            }


            // =================================================
            // HOD SPECIAL REPORT
            // =================================================

            const report =
                await hodReportExportService
                    .getSpecialExportData(
                        req.user,
                        financialYear,
                        period
                    );


            // =================================================
            // GENERATE FILE
            // =================================================

            let buffer;


            if (
                format === "excel"
            ) {

                buffer =
                    await hodReportExportService
                        .generateExcel(
                            report
                        );

            } else {

                buffer =
                    await hodReportExportService
                        .generatePdf(
                            report
                        );

            }


            // =================================================
            // FILE NAME
            // =================================================

            const extension =
                format === "excel"
                    ? "xlsx"
                    : "pdf";


            const safePeriod =
                period
                    .replace(
                        /\s+/g,
                        "-"
                    );


            const fileName =
                `HOD-Special-${financialYear}-${safePeriod}.${extension}`;


            return sendFile(
                res,
                buffer,
                format,
                fileName
            );

        }

        catch (error) {

            console.error(
                "❌ HOD SPECIAL EXPORT ERROR:",
                error
            );


            next(error);

        }

    };


// =====================================================
// EXPORT
// =====================================================

module.exports = {

    exportGeneral,

    exportSpecial

};