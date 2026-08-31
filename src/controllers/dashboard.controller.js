const dashboardService =
    require("../services/dashboard.service");


class DashboardController {

    // =====================================================
    // GET TARGET DEPARTMENTS
    // =====================================================

    async getTargetDepartments(
        req,
        res,
        next
    ) {

        try {

            const data =
                await dashboardService
                    .getTargetDepartments();


            return res.status(200).json({

                success: true,

                data

            });

        } catch (error) {

            next(error);

        }

    }


    // =====================================================
    // GENERAL EVALUATION OVERVIEW
    //
    // Query:
    //
    // targetDepartmentId
    // quarter
    // =====================================================

    async getEvaluationOverview(
        req,
        res,
        next
    ) {

        try {

            const {
                targetDepartmentId,
                quarter
            } = req.query;


            const data =
                await dashboardService
                    .getEvaluationOverview(

                        targetDepartmentId,

                        quarter

                    );


            return res.status(200).json({

                success: true,

                data

            });

        } catch (error) {

            next(error);

        }

    }


    // =====================================================
    // SPECIAL EVALUATION OVERVIEW
    //
    // Query:
    //
    // targetDepartmentId
    //
    // IMPORTANT:
    // No quarter required.
    // =====================================================

    async getSpecialEvaluationOverview(
        req,
        res,
        next
    ) {

        try {

            const {
                targetDepartmentId
            } = req.query;


            const data =
                await dashboardService
                    .getSpecialEvaluationOverview(

                        targetDepartmentId

                    );


            return res.status(200).json({

                success: true,

                data

            });

        } catch (error) {

            next(error);

        }

    }


    // =====================================================
    // VIEW RATING
    // =====================================================

    async getRatingDetails(
        req,
        res,
        next
    ) {

        try {

            const {
                feedbackId
            } = req.params;


            const data =
                await dashboardService
                    .getRatingDetails(
                        feedbackId
                    );


            return res.status(200).json({

                success: true,

                data

            });

        } catch (error) {

            next(error);

        }

    }

}


module.exports =
    new DashboardController();