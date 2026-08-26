const reportService =
    require("../services/report.service");

const ApiResponse =
    require("../utils/ApiResponse");

const ApiError =
    require("../utils/ApiError");


// =====================================================
// HELPER
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
// HOD - GENERAL REPORT
//
// GET:
//
// /reports/hod/general
//
// Query:
//
// financial_year=2026-27
// =====================================================

const getHodGeneralReport =
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


            const result =
                await reportService
                    .getHodGeneral(
                        req.user,
                        financialYear
                    );


            return res
                .status(200)
                .json(

                    new ApiResponse(

                        200,

                        result,

                        "HOD general report fetched successfully"

                    )

                );

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
// =====================================================

const getHodSpecialReport =
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


            const result =
                await reportService
                    .getHodSpecial(
                        req.user,
                        financialYear
                    );


            return res
                .status(200)
                .json(

                    new ApiResponse(

                        200,

                        result,

                        "HOD special report fetched successfully"

                    )

                );

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
// ADMIN - GENERAL REPORT
//
// GET:
//
// /reports/admin/general
//
// Query:
//
// financial_year=2026-27
// =====================================================

const getAdminGeneralReport =
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


            const result =
                await reportService
                    .getAdminGeneral(
                        financialYear
                    );


            return res
                .status(200)
                .json(

                    new ApiResponse(

                        200,

                        result,

                        "Admin general report fetched successfully"

                    )

                );

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
// /reports/admin/special
//
// Query:
//
// financial_year=2026-27
// =====================================================

const getAdminSpecialReport =
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


            const result =
                await reportService
                    .getAdminSpecial(
                        financialYear
                    );


            return res
                .status(200)
                .json(

                    new ApiResponse(

                        200,

                        result,

                        "Admin special report fetched successfully"

                    )

                );

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

    getHodGeneralReport,

    getHodSpecialReport,

    getAdminGeneralReport,

    getAdminSpecialReport

};