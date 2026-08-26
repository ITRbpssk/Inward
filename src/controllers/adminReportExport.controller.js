const adminReportExportService =
    require("../services/adminReportExport.service");


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


const getSpecialPeriod =
    req => {

        return String(
            req.query.period || "ALL"
        )
            .trim();

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
// ADMIN - GENERAL EXPORT
//
// GET:
//
// /admin-reports/general/export
//
// Query:
//
// financial_year=2026-27
// period=Q1
// format=excel
//
// period:
// Q1
// Q2
// Q3
// Q4
// YEARLY
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


            const report =
                await adminReportExportService
                    .getGeneralExportData(
                        financialYear,
                        period
                    );


            let buffer;


            if (
                format === "excel"
            ) {

                buffer =
                    await adminReportExportService
                        .generateExcel(
                            report
                        );

            } else {

                buffer =
                    await adminReportExportService
                        .generatePdf(
                            report
                        );

            }


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
                `ADMIN-General-${financialYear}-${safePeriod}.${extension}`;


            return sendFile(
                res,
                buffer,
                format,
                fileName
            );

        }

        catch (error) {

            console.error(
                "❌ ADMIN GENERAL EXPORT ERROR:",
                error
            );


            next(error);

        }

    };


// =====================================================
// ADMIN - SPECIAL EXPORT
//
// GET:
//
// /admin-reports/special/export
//
// Query:
//
// financial_year=2026-27
// period=ALL
// format=excel
//
// OR:
//
// period=Special 1
// period=Special 2
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
                getSpecialPeriod(req);


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


            const report =
                await adminReportExportService
                    .getSpecialExportData(
                        financialYear,
                        period
                    );


            let buffer;


            if (
                format === "excel"
            ) {

                buffer =
                    await adminReportExportService
                        .generateExcel(
                            report
                        );

            } else {

                buffer =
                    await adminReportExportService
                        .generatePdf(
                            report
                        );

            }


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
                `ADMIN-Special-${financialYear}-${safePeriod}.${extension}`;


            return sendFile(
                res,
                buffer,
                format,
                fileName
            );

        }

        catch (error) {

            console.error(
                "❌ ADMIN SPECIAL EXPORT ERROR:",
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