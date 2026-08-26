const adminReportService =
    require("../services/adminReport.service");

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


// =====================================================
// ADMIN - GENERAL REPORT
//
// GET:
//
// /admin-reports/general
//
// Query:
//
// financial_year=2026-27
// period=YEARLY
//
// OR
//
// period=Q1
// period=Q2
// period=Q3
// period=Q4
// =====================================================

const getGeneralReport =
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


            const report =
                await adminReportService
                    .getGeneralReport(
                        financialYear,
                        period
                    );


            return res.status(200).json({

                success: true,

                data:
                    report

            });

        }

        catch (error) {

            console.error(
                "❌ ADMIN GENERAL REPORT ERROR:",
                error
            );

            next(error);

        }

    };


// =====================================================
// ADMIN - SPECIAL REPORT
//
// GET:
//
// /admin-reports/special
//
// Query:
//
// financial_year=2026-27
// period=ALL
//
// OR
//
// period=Special 1
// period=Special 2
// =====================================================

const getSpecialReport =
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


            const report =
                await adminReportService
                    .getSpecialReport(
                        financialYear,
                        period
                    );


            return res.status(200).json({

                success: true,

                data:
                    report

            });

        }

        catch (error) {

            console.error(
                "❌ ADMIN SPECIAL REPORT ERROR:",
                error
            );

            next(error);

        }

    };


// =====================================================
// EXPORT
// =====================================================

module.exports = {

    getGeneralReport,

    getSpecialReport

};