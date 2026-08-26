const reportService =
    require("../services/report.service");

const reportExportService =
    require("../services/reportExport.service");

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


// =====================================================
// GET PERIOD
//
// GENERAL:
// Q1 / Q2 / Q3 / Q4 / YEARLY
//
// SPECIAL:
// ALL / SPECIAL 1 / SPECIAL 2...
// =====================================================

const getPeriod =
    req => {

        return String(
            req.query.period || "YEARLY"
        )
            .trim()
            .toUpperCase();

    };


// =====================================================
// GET FORMAT
//
// excel / pdf
// =====================================================

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
            !Buffer.isBuffer(buffer)
        ) {

            throw new ApiError(
                500,
                "Report export did not return a valid file."
            );

        }


        if (
            format === "excel"
        ) {

            res.setHeader(
                "Content-Type",
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            );

        }

        else if (
            format === "pdf"
        ) {

            res.setHeader(
                "Content-Type",
                "application/pdf"
            );

        }

        else {

            throw new ApiError(
                400,
                "Invalid export format."
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


        // Important for browser / Angular Blob download
        res.setHeader(
            "Cache-Control",
            "no-cache, no-store, must-revalidate"
        );


        return res.send(
            buffer
        );

    };


// =====================================================
// VALIDATE FORMAT
// =====================================================

const validateFormat =
    format => {

        if (
            ![
                "excel",
                "pdf"
            ].includes(format)
        ) {

            throw new ApiError(
                400,
                "format must be excel or pdf."
            );

        }

    };


// =====================================================
// SAFE PERIOD FOR FILE NAME
// =====================================================

const getSafePeriod =
    period => {

        return String(
            period || "YEARLY"
        )
            .trim()
            .replace(
                /\s+/g,
                "-"
            )
            .replace(
                /[^a-zA-Z0-9_-]/g,
                ""
            );

    };


// =====================================================
// GENERATE FILE
//
// Common logic for all reports.
// =====================================================

const generateFile =
    async (
        report,
        period,
        format
    ) => {

        if (
            format === "excel"
        ) {

            return await reportExportService
                .generateExcel(
                    report,
                    period
                );

        }


        return await reportExportService
            .generatePdf(
                report,
                period
            );

    };


// =====================================================
// HOD - GENERAL EXPORT
//
// GET:
//
// /reports/hod/general/export
//
// Query:
//
// financial_year=2026-27
// period=Q1
// format=excel
//
// OR:
//
// financial_year=2026-27
// period=YEARLY
// format=pdf
// =====================================================

const exportHodGeneral =
    async (
        req,
        res,
        next
    ) => {

        try {

            const financialYear =
                getFinancialYear(
                    req
                );


            const period =
                getPeriod(
                    req
                );


            const format =
                getFormat(
                    req
                );


            validateFormat(
                format
            );


            const report =
                await reportService
                    .getHodGeneral(
                        req.user,
                        financialYear
                    );


            const buffer =
                await generateFile(
                    report,
                    period,
                    format
                );


            const extension =
                format === "excel"
                    ? "xlsx"
                    : "pdf";


            const safePeriod =
                getSafePeriod(
                    period
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
// /reports/hod/special/export
//
// Example:
//
// period=ALL
// format=excel
//
// OR:
//
// period=Special 1
// format=pdf
// =====================================================

const exportHodSpecial =
    async (
        req,
        res,
        next
    ) => {

        try {

            const financialYear =
                getFinancialYear(
                    req
                );


            const period =
                getPeriod(
                    req
                );


            const format =
                getFormat(
                    req
                );


            validateFormat(
                format
            );


            const report =
                await reportService
                    .getHodSpecial(
                        req.user,
                        financialYear
                    );


            const buffer =
                await generateFile(
                    report,
                    period,
                    format
                );


            const extension =
                format === "excel"
                    ? "xlsx"
                    : "pdf";


            const safePeriod =
                getSafePeriod(
                    period
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
// ADMIN - GENERAL EXPORT
//
// GET:
//
// /reports/admin/general/export
//
// Example:
//
// period=Q1
// format=excel
//
// OR:
//
// period=YEARLY
// format=pdf
// =====================================================

const exportAdminGeneral =
    async (
        req,
        res,
        next
    ) => {

        try {

            const financialYear =
                getFinancialYear(
                    req
                );


            const period =
                getPeriod(
                    req
                );


            const format =
                getFormat(
                    req
                );


            validateFormat(
                format
            );


            const report =
                await reportService
                    .getAdminGeneral(
                        financialYear
                    );


            const buffer =
                await generateFile(
                    report,
                    period,
                    format
                );


            const extension =
                format === "excel"
                    ? "xlsx"
                    : "pdf";


            const safePeriod =
                getSafePeriod(
                    period
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
// /reports/admin/special/export
//
// Example:
//
// period=ALL
// format=excel
//
// OR:
//
// period=Special 1
// format=pdf
// =====================================================

const exportAdminSpecial =
    async (
        req,
        res,
        next
    ) => {

        try {

            const financialYear =
                getFinancialYear(
                    req
                );


            const period =
                getPeriod(
                    req
                );


            const format =
                getFormat(
                    req
                );


            validateFormat(
                format
            );


            const report =
                await reportService
                    .getAdminSpecial(
                        financialYear
                    );


            const buffer =
                await generateFile(
                    report,
                    period,
                    format
                );


            const extension =
                format === "excel"
                    ? "xlsx"
                    : "pdf";


            const safePeriod =
                getSafePeriod(
                    period
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

    exportHodGeneral,

    exportHodSpecial,

    exportAdminGeneral,

    exportAdminSpecial

};