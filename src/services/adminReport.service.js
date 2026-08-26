const adminReportRepository =
    require("../repositories/adminReport.repository");

const feedbackService =
    require("./feedback.service");

const ApiError =
    require("../utils/ApiError");


class AdminReportService {


    // =====================================================
    // CONSTANTS
    // =====================================================

    GENERAL_QUARTERS = [
        "Q1",
        "Q2",
        "Q3",
        "Q4"
    ];


    // =====================================================
    // VALIDATE FINANCIAL YEAR
    // =====================================================

    validateFinancialYear(
        financialYear
    ) {

        const value =
            String(
                financialYear || ""
            )
                .trim();


        if (!value) {

            throw new ApiError(
                400,
                "financial_year is required."
            );

        }


        return value;

    }


    // =====================================================
    // NORMALIZE PERIOD
    // =====================================================

    normalizePeriod(
        period
    ) {

        const value =
            String(
                period || "YEARLY"
            )
                .trim()
                .toUpperCase();


        const allowed = [

            "Q1",
            "Q2",
            "Q3",
            "Q4",
            "YEARLY"

        ];


        if (
            !allowed.includes(
                value
            )
        ) {

            throw new ApiError(
                400,
                "Invalid period. Use Q1, Q2, Q3, Q4 or YEARLY."
            );

        }


        return value;

    }


    // =====================================================
    // ROUND SCORE
    // =====================================================

    roundScore(
        value
    ) {

        if (
            value === null ||
            value === undefined ||
            value === ""
        ) {

            return null;

        }


        const number =
            Number(value);


        if (
            !Number.isFinite(
                number
            )
        ) {

            return null;

        }


        return Number(
            number.toFixed(2)
        );

    }


    // =====================================================
    // CALCULATE AVERAGE
    //
    // IMPORTANT:
    //
    // null / undefined scores are ignored.
    //
    // Example:
    //
    // 80
    // 90
    // null
    //
    // Average = 85
    //
    // NOT 56.67
    // =====================================================

    calculateAverage(
        values
    ) {

        if (
            !Array.isArray(values)
        ) {

            return null;

        }


        const validValues =
            values

                .filter(
                    value =>
                        value !== null &&
                        value !== undefined &&
                        value !== ""
                )

                .map(
                    value =>
                        Number(value)
                )

                .filter(
                    value =>
                        Number.isFinite(
                            value
                        )
                );


        if (
            validValues.length === 0
        ) {

            return null;

        }


        const total =
            validValues.reduce(
                (
                    sum,
                    value
                ) =>
                    sum + value,

                0
            );


        return this.roundScore(
            total /
            validValues.length
        );

    }


    // =====================================================
    // GET FEEDBACK SCORE
    //
    // FeedbackService remains the single source for
    // calculating the final USI percentage.
    //
    // Therefore:
    //
    // Feedback screen score
    //        =
    // Admin report score
    // =====================================================

    async getFeedbackScore(
        feedbackId
    ) {

        if (
            !feedbackId
        ) {

            return null;

        }


        const feedback =
            await feedbackService
                .getFeedbackById(
                    Number(feedbackId),
                    null,
                    "ADMIN"
                );


        if (
            !feedback
        ) {

            return null;

        }


        if (
            String(
                feedback.status || ""
            )
                .trim()
                .toLowerCase() !==
            "submitted"
        ) {

            return null;

        }


        return this.roundScore(
            feedback.usi_percentage
        );

    }


    // =====================================================
    // BUILD FEEDBACK SCORE MAP
    //
    // Prevents repeated feedback calculation.
    // =====================================================

    async buildScoreMap(
        rows
    ) {

        const scoreMap =
            new Map();


        if (
            !Array.isArray(rows)
        ) {

            return scoreMap;

        }


        const feedbackIds = [

            ...new Set(

                rows

                    .map(
                        row =>
                            Number(
                                row.feedback_id
                            )
                    )

                    .filter(
                        id =>
                            Number.isInteger(id) &&
                            id > 0
                    )

            )

        ];


        await Promise.all(

            feedbackIds.map(
                async feedbackId => {

                    const score =
                        await this
                            .getFeedbackScore(
                                feedbackId
                            );


                    scoreMap.set(
                        feedbackId,
                        score
                    );

                }
            )

        );


        return scoreMap;

    }


    // =====================================================
    // CREATE EMPTY DEPARTMENT
    // =====================================================

    createDepartment(
        department
    ) {

        return {

            department_id:
                department.department_id,

            department_code:
                department.department_code,

            department_name:
                department.department_name,

            Q1: null,

            Q2: null,

            Q3: null,

            Q4: null,

            yearly_average: null

        };

    }


    // =====================================================
    // BUILD DEPARTMENT MAP
    // =====================================================

    buildDepartmentMap(
        departments
    ) {

        const map =
            new Map();


        for (
            const department
            of departments
        ) {

            map.set(

                Number(
                    department.department_id
                ),

                this.createDepartment(
                    department
                )

            );

        }


        return map;

    }


    // =====================================================
    // BUILD QUARTER SCORES
    //
    // KEY:
    //
    // target_department_id + quarter
    //
    // Example:
    //
    // IT + Q1
    //
    // Scores:
    //
    // Agriculture -> IT = 80
    // Accounts    -> IT = 90
    // Computer    -> IT = 70
    // HR          -> IT = 80
    //
    // IT Q1 = 80
    // =====================================================

    buildQuarterScores(
        rows,
        scoreMap,
        departmentMap
    ) {

        const quarterScores =
            new Map();


        if (
            !Array.isArray(rows)
        ) {

            return quarterScores;

        }


        for (
            const row
            of rows
        ) {

            const departmentId =
                Number(
                    row.target_department_id
                );


            const quarter =
                String(
                    row.quarter || ""
                )
                    .trim()
                    .toUpperCase();


            if (
                !departmentMap.has(
                    departmentId
                )
            ) {

                continue;

            }


            if (
                !this.GENERAL_QUARTERS
                    .includes(
                        quarter
                    )
            ) {

                continue;

            }


            const feedbackId =
                Number(
                    row.feedback_id
                );


            if (
                !feedbackId
            ) {

                continue;

            }


            if (
                !scoreMap.has(
                    feedbackId
                )
            ) {

                continue;

            }


            const score =
                scoreMap.get(
                    feedbackId
                );


            if (
                score === null
            ) {

                continue;

            }


            const key =
                `${departmentId}_${quarter}`;


            if (
                !quarterScores.has(
                    key
                )
            ) {

                quarterScores.set(
                    key,
                    []
                );

            }


            quarterScores
                .get(key)
                .push(
                    score
                );

        }


        return quarterScores;

    }


    // =====================================================
    // APPLY QUARTER SCORES
    // =====================================================

    applyQuarterScores(
        departmentMap,
        quarterScores
    ) {

        for (
            const [
                key,
                scores
            ]
            of quarterScores
        ) {

            const [
                departmentId,
                quarter
            ] =
                key.split("_");


            const department =
                departmentMap.get(
                    Number(
                        departmentId
                    )
                );


            if (
                !department
            ) {

                continue;

            }


            department[quarter] =
                this.calculateAverage(
                    scores
                );

        }

    }


    // =====================================================
    // CALCULATE YEARLY AVERAGE
    //
    // Each department's yearly average is calculated
    // from its available quarters.
    //
    // Missing quarters are NOT counted as zero.
    // =====================================================

    calculateDepartmentYearlyAverages(
        departments
    ) {

        for (
            const department
            of departments
        ) {

            department.yearly_average =
                this.calculateAverage(
                    [

                        department.Q1,

                        department.Q2,

                        department.Q3,

                        department.Q4

                    ]
                );

        }

    }


    // =====================================================
    // ADMIN - GENERAL REPORT
    //
    // Full yearly report.
    //
    // Structure:
    //
    // Department | Q1 | Q2 | Q3 | Q4 | Yearly Average
    //
    // IMPORTANT:
    //
    // There is NO bottom AVERAGE row for Admin.
    // =====================================================

    async getGeneralReport(
        financialYear,
        period = "YEARLY"
    ) {

        const year =
            this.validateFinancialYear(
                financialYear
            );


        const selectedPeriod =
            this.normalizePeriod(
                period
            );


        // =================================================
        // GET DEPARTMENTS
        // =================================================

        const departments =
            await adminReportRepository
                .getActiveDepartments();


        // =================================================
        // GET SOURCE DATA
        //
        // For Q1/Q2/Q3/Q4 only selected quarter is loaded.
        //
        // For YEARLY all quarters are loaded.
        // =================================================

        const queryPeriod =
            selectedPeriod === "YEARLY"
                ? null
                : selectedPeriod;


        const rows =
            await adminReportRepository
                .getGeneralReportSource(
                    year,
                    queryPeriod
                );


        // =================================================
        // FEEDBACK SCORE MAP
        // =================================================

        const scoreMap =
            await this.buildScoreMap(
                rows
            );


        // =================================================
        // DEPARTMENT MAP
        // =================================================

        const departmentMap =
            this.buildDepartmentMap(
                departments
            );


        // =================================================
        // QUARTER SCORES
        // =================================================

        const quarterScores =
            this.buildQuarterScores(
                rows,
                scoreMap,
                departmentMap
            );


        this.applyQuarterScores(
            departmentMap,
            quarterScores
        );


        // =================================================
        // RESULT
        // =================================================

        const resultDepartments =
            [
                ...departmentMap.values()
            ];


        // =================================================
        // YEARLY AVERAGES
        //
        // Even when selectedPeriod = Q1, we keep the
        // complete department object structure.
        //
        // For a Q1-only export the export service can
        // select only Q1.
        // =================================================

        if (
            selectedPeriod === "YEARLY"
        ) {

            this.calculateDepartmentYearlyAverages(
                resultDepartments
            );

        }


        // =================================================
        // RETURN
        // =================================================

        return {

            report_type:
                "admin_general",

            financial_year:
                year,

            report_period:
                selectedPeriod,

            columns: [

                "Department",

                "Q1",

                "Q2",

                "Q3",

                "Q4",

                "Yearly Average"

            ],

            departments:
                resultDepartments

        };

    }


    // =====================================================
    // ADMIN - SPECIAL REPORT
    //
    // period:
    //
    // ALL
    // Special 1
    // Special 2
    // ...
    // =====================================================

    async getSpecialReport(
        financialYear,
        period = "ALL"
    ) {

        const year =
            this.validateFinancialYear(
                financialYear
            );


        const selectedPeriod =
            String(
                period || "ALL"
            )
                .trim();


        // =================================================
        // GET SPECIAL SURVEYS
        // =================================================

        const surveys =
            await adminReportRepository
                .getSpecialSurveys(
                    year
                );


        // =================================================
        // ASSIGN SPECIAL LABELS
        // =================================================

        const specialSurveys =
            surveys.map(
                (
                    survey,
                    index
                ) => ({

                    survey_id:
                        survey.survey_id,

                    survey_name:
                        survey.survey_name,

                    survey_type:
                        survey.survey_type,

                    financial_year:
                        survey.financial_year,

                    label:
                        `Special ${index + 1}`

                })
            );


        // =================================================
        // FIND SELECTED SPECIAL SURVEY
        // =================================================

        let selectedSurveyId =
            null;


        if (
            selectedPeriod
                .toUpperCase() !==
            "ALL"
        ) {

            const selected =
                specialSurveys.find(
                    survey =>
                        String(
                            survey.label
                        )
                            .toUpperCase() ===
                        selectedPeriod
                            .toUpperCase()
                );


            if (
                !selected
            ) {

                throw new ApiError(
                    400,
                    `Invalid special report period: ${period}`
                );

            }


            selectedSurveyId =
                selected.survey_id;

        }


        // =================================================
        // GET SOURCE DATA
        // =================================================

        const rows =
            await adminReportRepository
                .getSpecialReportSource(
                    year,
                    selectedSurveyId
                );


        // =================================================
        // GET ACTIVE DEPARTMENTS
        // =================================================

        const departments =
            await adminReportRepository
                .getActiveDepartments();


        // =================================================
        // SCORE MAP
        // =================================================

        const scoreMap =
            await this.buildScoreMap(
                rows
            );


        // =================================================
        // DEPARTMENT MAP
        // =================================================

        const departmentMap =
            new Map();


        for (
            const department
            of departments
        ) {

            const result = {

                department_id:
                    department.department_id,

                department_code:
                    department.department_code,

                department_name:
                    department.department_name

            };


            for (
                const special
                of specialSurveys
            ) {

                if (
                    selectedSurveyId === null ||
                    Number(
                        special.survey_id
                    ) === Number(
                        selectedSurveyId
                    )
                ) {

                    result[
                        special.label
                    ] = null;

                }

            }


            departmentMap.set(

                Number(
                    department.department_id
                ),

                result

            );

        }


        // =================================================
        // SPECIAL SCORE GROUPING
        //
        // Target Department + Survey
        // =================================================

        const specialScores =
            new Map();


        for (
            const row
            of rows
        ) {

            const departmentId =
                Number(
                    row.target_department_id
                );


            const surveyId =
                Number(
                    row.survey_id
                );


            if (
                !departmentMap.has(
                    departmentId
                )
            ) {

                continue;

            }


            const special =
                specialSurveys.find(
                    item =>
                        Number(
                            item.survey_id
                        ) === surveyId
                );


            if (
                !special
            ) {

                continue;

            }


            const feedbackId =
                Number(
                    row.feedback_id
                );


            if (
                !feedbackId ||
                !scoreMap.has(
                    feedbackId
                )
            ) {

                continue;

            }


            const score =
                scoreMap.get(
                    feedbackId
                );


            if (
                score === null
            ) {

                continue;

            }


            const key =
                `${departmentId}_${surveyId}`;


            if (
                !specialScores.has(
                    key
                )
            ) {

                specialScores.set(
                    key,
                    []
                );

            }


            specialScores
                .get(key)
                .push(
                    score
                );

        }


        // =================================================
        // APPLY SPECIAL SCORES
        // =================================================

        for (
            const [
                key,
                scores
            ]
            of specialScores
        ) {

            const [
                departmentId,
                surveyId
            ] =
                key.split("_");


            const department =
                departmentMap.get(
                    Number(
                        departmentId
                    )
                );


            const special =
                specialSurveys.find(
                    item =>
                        Number(
                            item.survey_id
                        ) ===
                        Number(
                            surveyId
                        )
                );


            if (
                !department ||
                !special
            ) {

                continue;

            }


            department[
                special.label
            ] =
                this.calculateAverage(
                    scores
                );

        }


        // =================================================
        // RESULT
        // =================================================

        const resultDepartments =
            [
                ...departmentMap.values()
            ];


        // =================================================
        // RETURN
        // =================================================

        return {

            report_type:
                "admin_special",

            financial_year:
                year,

            report_period:
                selectedPeriod,

            special_surveys:
                selectedSurveyId === null

                    ? specialSurveys

                    : specialSurveys.filter(
                        special =>
                            Number(
                                special.survey_id
                            ) ===
                            Number(
                                selectedSurveyId
                            )
                    ),

            departments:
                resultDepartments

        };

    }


    // =====================================================
    // ADMIN - GET GENERAL FOR EXPORT
    // =====================================================

    async getGeneral(
        financialYear,
        period = "YEARLY"
    ) {

        return await this
            .getGeneralReport(
                financialYear,
                period
            );

    }


    // =====================================================
    // ADMIN - GET SPECIAL FOR EXPORT
    // =====================================================

    async getSpecial(
        financialYear,
        period = "ALL"
    ) {

        return await this
            .getSpecialReport(
                financialYear,
                period
            );

    }

}


module.exports =
    new AdminReportService();