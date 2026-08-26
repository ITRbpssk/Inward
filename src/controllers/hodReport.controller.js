const hodReportService =
    require("../services/hodReport.service");


// =====================================================
// GET FINANCIAL YEAR
// =====================================================

const getFinancialYear =
    req => {

        const financialYear =
            String(
                req.query.financial_year || ""
            )
                .trim();


        if (!financialYear) {

            const error =
                new Error(
                    "financial_year is required."
                );

            error.statusCode = 400;

            throw error;

        }


        return financialYear;

    };


// =====================================================
// GET PERIOD
//
// Q1
// Q2
// Q3
// Q4
// YEARLY
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
// HOD - GENERAL REPORT
//
// GET:
//
// /reports/hod/general
//
// Query:
//
// financial_year=2026-27
// period=Q1
//
// OR
//
// period=YEARLY
// =====================================================

const getGeneralReport =
    async (
        req,
        res,
        next
    ) => {

        try {

            // =================================================
            // AUTHENTICATED HOD
            //
            // authMiddleware already sets req.user
            // =================================================

            if (
                !req.user ||
                !req.user.user_id
            ) {

                return res.status(401).json({

                    success: false,

                    message:
                        "Authenticated HOD is required."

                });

            }


            // =================================================
            // FINANCIAL YEAR
            // =================================================

            const financialYear =
                getFinancialYear(req);


            // =================================================
            // PERIOD
            // =================================================

            const period =
                getPeriod(req);


            // =================================================
            // GET REPORT
            //
            // IMPORTANT:
            //
            // user is passed to service.
            //
            // Service uses user.user_id.
            //
            // Therefore IT HOD gets only IT HOD's
            // report.
            // =================================================

            const report =
                await hodReportService
                    .getGeneralReport(

                        req.user,

                        financialYear,

                        period

                    );


            // =================================================
            // RESPONSE
            // =================================================

            return res.status(200).json({

                success: true,

                data:
                    report

            });

        }

        catch (error) {

            console.error(
                "❌ HOD GENERAL REPORT ERROR:",
                error
            );


            next(error);

        }

    };


// =====================================================
// HOD - SPECIAL REPORT
//
// GET:
//
// /reports/hod/special
//
// Query:
//
// financial_year=2026-27
// period=ALL
//
// OR
//
// period=Special 1
// =====================================================

const getSpecialReport =
    async (
        req,
        res,
        next
    ) => {

        try {

            // =================================================
            // AUTHENTICATED HOD
            // =================================================

            if (
                !req.user ||
                !req.user.user_id
            ) {

                return res.status(401).json({

                    success: false,

                    message:
                        "Authenticated HOD is required."

                });

            }


            // =================================================
            // FINANCIAL YEAR
            // =================================================

            const financialYear =
                getFinancialYear(req);


            // =================================================
            // PERIOD
            // =================================================

            const period =
                String(
                    req.query.period || "ALL"
                )
                    .trim();


            // =================================================
            // GET REPORT
            // =================================================

            const report =
                await hodReportService
                    .getSpecialReport(

                        req.user,

                        financialYear,

                        period

                    );


            // =================================================
            // RESPONSE
            // =================================================

            return res.status(200).json({

                success: true,

                data:
                    report

            });

        }

        catch (error) {

            console.error(
                "❌ HOD SPECIAL REPORT ERROR:",
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