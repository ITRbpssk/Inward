const hodReportRepository =
    require("../repositories/hodReport.repository");

const feedbackService =
    require("./feedback.service");

const ApiError =
    require("../utils/ApiError");


// =====================================================
// HOD REPORT SERVICE
//
// IMPORTANT LOGIC
//
// Logged-in HOD department = EVALUATOR
//
// Example:
//
// Computer HOD
// department_id = 4
//
// Survey mappings:
//
// Computer -> General
// Computer -> Purchase
// Computer -> HR
//
// Therefore HOD report:
//
// General   | Q1 score
// Purchase  | Q1 score
// HR        | Q1 score
//
// NOT:
//
// Computer | Q1 score
//
// =====================================================

class HodReportService {


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
                        Number.isFinite(value)
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
    // IMPORTANT:
    //
    // feedbackService is the single source
    // for USI calculation.
    //
    // Do NOT calculate rating manually here.
    // =====================================================

    async getFeedbackScore(
        feedbackId
    ) {

        if (
            !feedbackId
        ) {

            return null;

        }


        try {

            const feedback =
                await feedbackService
                    .getFeedbackById(
                        Number(
                            feedbackId
                        )
                    );


            if (
                !feedback
            ) {

                return null;

            }


            const status =
                String(
                    feedback.status || ""
                )
                    .trim()
                    .toLowerCase();


            if (
                status !== "submitted"
            ) {

                return null;

            }


            return this.roundScore(
                feedback.usi_percentage
            );

        }

        catch (error) {

            console.error(
                "❌ HOD REPORT FEEDBACK SCORE ERROR:",
                feedbackId,
                error.message
            );


            return null;

        }

    }


    // =====================================================
    // BUILD SCORE MAP
    //
    // feedback_id -> USI percentage
    // =====================================================

    async buildScoreMap(
        rows
    ) {

        const scoreMap =
            new Map();


        if (
            !Array.isArray(rows) ||
            rows.length === 0
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
                        await this.getFeedbackScore(
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
    // BUILD DEPARTMENT MAP
    //
    // IMPORTANT:
    //
    // Departments here are TARGET departments.
    //
    // Only departments which THIS HOD evaluates
    // are included.
    // =====================================================

    buildDepartmentMap(
        rows,
        hodDepartmentId
    ) {

        const departmentMap =
            new Map();


        if (
            !Array.isArray(rows)
        ) {

            return departmentMap;

        }


        for (
            const row
            of rows
        ) {

            const evaluatorId =
                Number(
                    row.evaluator_department_id
                );


            const targetId =
                Number(
                    row.target_department_id
                );


            // -------------------------------------------------
            // VERY IMPORTANT
            //
            // Only logged-in HOD as evaluator.
            // -------------------------------------------------

            if (
                evaluatorId !==
                Number(
                    hodDepartmentId
                )
            ) {

                continue;

            }


            if (
                !Number.isInteger(
                    targetId
                ) ||
                targetId <= 0
            ) {

                continue;

            }


            if (
                departmentMap.has(
                    targetId
                )
            ) {

                continue;

            }


            departmentMap.set(

                targetId,

                {

                    department_id:
                        targetId,

                    department_code:
                        row.target_department_code,

                    department_name:
                        row.target_department_name,

                    Q1:
                        null,

                    Q2:
                        null,

                    Q3:
                        null,

                    Q4:
                        null,

                    yearly_average:
                        null

                }

            );

        }


        return departmentMap;

    }


    // =====================================================
    // BUILD QUARTER SCORES
    //
    // One target department may have multiple
    // survey/evaluation records.
    //
    // Those submitted USI scores are averaged.
    // =====================================================

    buildQuarterScores(
        rows,
        scoreMap,
        departmentMap,
        hodDepartmentId
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

            const evaluatorId =
                Number(
                    row.evaluator_department_id
                );


            // -------------------------------------------------
            // ONLY LOGGED-IN HOD
            // -------------------------------------------------

            if (
                evaluatorId !==
                Number(
                    hodDepartmentId
                )
            ) {

                continue;

            }


            const targetDepartmentId =
                Number(
                    row.target_department_id
                );


            if (
                !departmentMap.has(
                    targetDepartmentId
                )
            ) {

                continue;

            }


            const quarter =
                String(
                    row.quarter || ""
                )
                    .trim()
                    .toUpperCase();


            if (
                !this.GENERAL_QUARTERS.includes(
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
                score === null ||
                score === undefined
            ) {

                continue;

            }


            const key =
                `${targetDepartmentId}_${quarter}`;


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


            department[
                quarter
            ] =
                this.calculateAverage(
                    scores
                );

        }

    }


    // =====================================================
    // CALCULATE YEARLY AVERAGE
    //
    // IMPORTANT:
    //
    // Only available quarters are included.
    //
    // Example:
    //
    // Q1 = 90
    // Q2 = N/A
    // Q3 = N/A
    // Q4 = N/A
    //
    // Yearly Average = 90
    // =====================================================

    calculateDepartmentYearlyAverage(
        department
    ) {

        if (
            !department
        ) {

            return null;

        }


        department.yearly_average =
            this.calculateAverage(

                [

                    department.Q1,

                    department.Q2,

                    department.Q3,

                    department.Q4

                ]

            );


        return department.yearly_average;

    }


    // =====================================================
    // CALCULATE ALL YEARLY AVERAGES
    // =====================================================

    calculateYearlyAverages(
        departments
    ) {

        if (
            !Array.isArray(
                departments
            )
        ) {

            return;

        }


        departments.forEach(
            department => {

                this.calculateDepartmentYearlyAverage(
                    department
                );

            }
        );

    }


    // =====================================================
    // CALCULATE QUARTERLY AVERAGES
    // =====================================================

    calculateQuarterlyAverages(
        departments
    ) {

        return {

            Q1:
                this.calculateAverage(
                    departments.map(
                        department =>
                            department.Q1
                    )
                ),

            Q2:
                this.calculateAverage(
                    departments.map(
                        department =>
                            department.Q2
                    )
                ),

            Q3:
                this.calculateAverage(
                    departments.map(
                        department =>
                            department.Q3
                    )
                ),

            Q4:
                this.calculateAverage(
                    departments.map(
                        department =>
                            department.Q4
                    )
                )

        };

    }


    // =====================================================
    // CALCULATE YEARLY REPORT AVERAGE
    //
    // Average of department yearly averages.
    // =====================================================

    calculateYearlyReportAverage(
        departments
    ) {

        return this.calculateAverage(

            departments.map(
                department =>
                    department.yearly_average
            )

        );

    }


    // =====================================================
    // GET GENERAL REPORT
    //
    // HOD:
    //
    // logged-in HOD = evaluator
    //
    // target departments = departments evaluated
    //
    // Q1:
    //
    // Department | Q1 | Average
    //
    // YEARLY:
    //
    // Department | Q1 | Q2 | Q3 | Q4 | Yearly Average
    // =====================================================

    async getGeneralReport(
        user,
        financialYear,
        period = "YEARLY"
    ) {

        // =================================================
        // USER VALIDATION
        // =================================================

        if (
            !user ||
            !user.user_id
        ) {

            throw new ApiError(
                401,
                "Authenticated HOD is required."
            );

        }


        // =================================================
        // HOD DEPARTMENT
        // =================================================

        const hodDepartmentId =
            Number(
                user.department_id
            );


        if (
            !Number.isInteger(
                hodDepartmentId
            ) ||
            hodDepartmentId <= 0
        ) {

            throw new ApiError(
                400,
                "HOD department_id is missing."
            );

        }


        // =================================================
        // YEAR
        // =================================================

        const year =
            this.validateFinancialYear(
                financialYear
            );


        // =================================================
        // PERIOD
        // =================================================

        const selectedPeriod =
            this.normalizePeriod(
                period
            );


        console.log("");
        console.log(
            "========================================"
        );

        console.log(
            "📊 HOD GENERAL REPORT"
        );

        console.log(
            "HOD USER ID:",
            user.user_id
        );

        console.log(
            "HOD DEPARTMENT ID:",
            hodDepartmentId
        );

        console.log(
            "FINANCIAL YEAR:",
            year
        );

        console.log(
            "PERIOD:",
            selectedPeriod
        );

        console.log(
            "========================================"
        );


        // =================================================
        // GET SOURCE DATA
        //
        // Repository gives:
        //
        // target_department_id
        // evaluator_department_id
        // feedback_id
        // quarter
        // =================================================

        const queryPeriod =
            selectedPeriod === "YEARLY"
                ? null
                : selectedPeriod;


        const sourceRows =
            await hodReportRepository
                .getGeneralReportSource(
                    user.user_id,
                    year,
                    queryPeriod
                );


        console.log(
            "HOD REPORT SOURCE ROWS:",
            sourceRows.length
        );


        // =================================================
        // ONLY THIS HOD AS EVALUATOR
        // =================================================

        const rows =
            sourceRows.filter(
                row =>

                    Number(
                        row.evaluator_department_id
                    ) ===
                    hodDepartmentId

            );


        console.log(
            "HOD EVALUATOR ROWS:",
            rows.length
        );


        // =================================================
        // BUILD DEPARTMENTS
        // =================================================

        const departmentMap =
            this.buildDepartmentMap(
                rows,
                hodDepartmentId
            );


        // =================================================
        // BUILD SCORE MAP
        // =================================================

        const scoreMap =
            await this.buildScoreMap(
                rows
            );


        // =================================================
        // BUILD QUARTER SCORES
        // =================================================

        const quarterScores =
            this.buildQuarterScores(
                rows,
                scoreMap,
                departmentMap,
                hodDepartmentId
            );


        // =================================================
        // APPLY SCORES
        // =================================================

        this.applyQuarterScores(
            departmentMap,
            quarterScores
        );


        // =================================================
        // DEPARTMENTS
        // =================================================

        const departments =
            [
                ...departmentMap.values()
            ];


        // =================================================
        // SORT DEPARTMENTS
        // =================================================

        departments.sort(
            (
                a,
                b
            ) =>

                String(
                    a.department_name || ""
                )
                    .localeCompare(
                        String(
                            b.department_name || ""
                        )
                    )

        );


        // =================================================
        // YEARLY AVERAGE
        // =================================================

        this.calculateYearlyAverages(
            departments
        );


        // =================================================
        // QUARTER AVERAGES
        // =================================================

        const quarterlyAverage =
            this.calculateQuarterlyAverages(
                departments
            );


        // =================================================
        // YEARLY REPORT AVERAGE
        // =================================================

        const yearlyAverage =
            this.calculateYearlyReportAverage(
                departments
            );


        // =================================================
        // COLUMNS
        // =================================================

        let columns;


        if (
            selectedPeriod === "YEARLY"
        ) {

            columns = [

                "Department",

                "Q1",

                "Q2",

                "Q3",

                "Q4",

                "Yearly Average"

            ];

        } else {

            columns = [

                "Department",

                selectedPeriod,

                "Average"

            ];

        }


        // =================================================
        // RESULT
        // =================================================

        const result = {

            report_type:
                "hod_general",

            financial_year:
                year,

            report_period:
                selectedPeriod,

            columns,

            departments,

            quarterly_average:
                quarterlyAverage,

            yearly_average:
                yearlyAverage

        };


        console.log(
            "HOD REPORT DEPARTMENTS:",
            departments
        );


        console.log(
            "HOD QUARTERLY AVERAGES:",
            quarterlyAverage
        );


        console.log(
            "HOD YEARLY AVERAGE:",
            yearlyAverage
        );


        console.log(
            "========================================"
        );


        return result;

    }


    // =====================================================
    // GET SPECIAL REPORT
    //
    // Same evaluator logic as General.
    // =====================================================

    async getSpecialReport(
        user,
        financialYear,
        period = "ALL"
    ) {

        if (
            !user ||
            !user.user_id
        ) {

            throw new ApiError(
                401,
                "Authenticated HOD is required."
            );

        }


        const hodDepartmentId =
            Number(
                user.department_id
            );


        if (
            !Number.isInteger(
                hodDepartmentId
            ) ||
            hodDepartmentId <= 0
        ) {

            throw new ApiError(
                400,
                "HOD department_id is missing."
            );

        }


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
            await hodReportRepository
                .getSpecialSurveys(
                    user.user_id,
                    year
                );


        const specialSurveys =
            surveys.map(
                (
                    survey,
                    index
                ) => ({

                    survey_id:
                        Number(
                            survey.survey_id
                        ),

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
        // SELECT SURVEY
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

                        survey.label
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
                Number(
                    selected.survey_id
                );

        }


        // =================================================
        // SOURCE DATA
        // =================================================

        const rows =
            await hodReportRepository
                .getSpecialReportSource(
                    user.user_id,
                    year,
                    selectedSurveyId
                );


        // =================================================
        // ONLY LOGGED-IN HOD AS EVALUATOR
        // =================================================

        const evaluatorRows =
            rows.filter(
                row =>

                    Number(
                        row.evaluator_department_id
                    ) ===
                    hodDepartmentId

            );


        // =================================================
        // SCORE MAP
        // =================================================

        const scoreMap =
            await this.buildScoreMap(
                evaluatorRows
            );


        // =================================================
        // DEPARTMENT MAP
        // =================================================

        const departmentMap =
            new Map();


        for (
            const row
            of evaluatorRows
        ) {

            const departmentId =
                Number(
                    row.target_department_id
                );


            if (
                !Number.isInteger(
                    departmentId
                ) ||
                departmentId <= 0
            ) {

                continue;

            }


            if (
                !departmentMap.has(
                    departmentId
                )
            ) {

                departmentMap.set(

                    departmentId,

                    {

                        department_id:
                            departmentId,

                        department_code:
                            row.target_department_code,

                        department_name:
                            row.target_department_name

                    }

                );

            }

        }


        // =================================================
        // SPECIAL SCORES
        // =================================================

        const specialScores =
            new Map();


        for (
            const row
            of evaluatorRows
        ) {

            const departmentId =
                Number(
                    row.target_department_id
                );


            const surveyId =
                Number(
                    row.survey_id
                );


            const special =
                specialSurveys.find(
                    item =>

                        Number(
                            item.survey_id
                        ) ===
                        surveyId

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
        // DEPARTMENTS
        // =================================================

        const departments =
            [
                ...departmentMap.values()
            ];


        departments.sort(
            (
                a,
                b
            ) =>

                String(
                    a.department_name || ""
                )
                    .localeCompare(
                        String(
                            b.department_name || ""
                        )
                    )

        );


        // =================================================
        // SPECIAL AVERAGES
        // =================================================

        const specialAverage = {};


        const reportSpecialSurveys =
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

                );


        for (
            const special
            of reportSpecialSurveys
        ) {

            specialAverage[
                special.label
            ] =
                this.calculateAverage(

                    departments.map(
                        department =>
                            department[
                                special.label
                            ]
                    )

                );

        }


        // =================================================
        // RETURN
        // =================================================

        return {

            report_type:
                "hod_special",

            financial_year:
                year,

            report_period:
                selectedPeriod,

            special_surveys:
                reportSpecialSurveys,

            departments,

            special_average:
                specialAverage

        };

    }


    // =====================================================
    // EXPORT HELPERS
    // =====================================================

    async getGeneral(
        user,
        financialYear,
        period = "YEARLY"
    ) {

        return await this.getGeneralReport(
            user,
            financialYear,
            period
        );

    }


    async getSpecial(
        user,
        financialYear,
        period = "ALL"
    ) {

        return await this.getSpecialReport(
            user,
            financialYear,
            period
        );

    }

}


// =====================================================
// EXPORT SINGLETON
// =====================================================

module.exports =
    new HodReportService();