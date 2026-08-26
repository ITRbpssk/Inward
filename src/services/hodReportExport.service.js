const hodReportExportRepository =
    require("../repositories/hodReportExport.repository");

const feedbackService =
    require("./feedback.service");

const ApiError =
    require("../utils/ApiError");


class HodReportExportService {


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
    // NORMALIZE GENERAL PERIOD
    // =====================================================

    normalizeGeneralPeriod(
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
    // BUILD SCORE MAP
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

                {

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

                    yearly_average:
                        null

                }

            );

        }


        return map;

    }


    // =====================================================
    // BUILD QUARTER SCORES
    //
    // Example:
    //
    // IT target
    //
    // Agriculture -> IT = 80
    // Accounts    -> IT = 90
    // HR          -> IT = 70
    // Computer    -> IT = 80
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
    // =====================================================

    calculateYearlyAverage(
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
    // GENERAL EXPORT DATA
    //
    // Q1:
    //
    // Department | Q1 | Average
    //
    // YEARLY:
    //
    // Department | Q1 | Q2 | Q3 | Q4 | Yearly Average
    //
    // Bottom average is included for HOD.
    // =====================================================

    async getGeneralExportData(
        user,
        financialYear,
        period = "YEARLY"
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


        const year =
            this.validateFinancialYear(
                financialYear
            );


        const selectedPeriod =
            this.normalizeGeneralPeriod(
                period
            );


        // =================================================
        // TARGET DEPARTMENTS
        // =================================================

        const targetDepartments =
            await hodReportExportRepository
                .getTargetDepartments(
                    user.user_id,
                    year,
                    "general"
                );


        // =================================================
        // SOURCE ROWS
        // =================================================

        const queryPeriod =
            selectedPeriod === "YEARLY"
                ? null
                : selectedPeriod;


        const rows =
            await hodReportExportRepository
                .getGeneralReportSource(
                    user.user_id,
                    year,
                    queryPeriod
                );


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
            this.buildDepartmentMap(
                targetDepartments
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


        const departments =
            [
                ...departmentMap.values()
            ];


        // =================================================
        // YEARLY AVERAGES
        // =================================================

        this.calculateYearlyAverage(
            departments
        );


        // =================================================
        // BOTTOM QUARTER AVERAGE
        // =================================================

        const quarterlyAverage = {

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


        // =================================================
        // BOTTOM YEARLY AVERAGE
        // =================================================

        const yearlyAverage =
            this.calculateAverage(

                departments.map(
                    department =>
                        department.yearly_average
                )

            );


        // =================================================
        // SELECT EXPORT COLUMNS
        // =================================================

        let columns = [];


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
        // RETURN
        // =================================================

        return {

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

    }


    // =====================================================
    // SPECIAL EXPORT DATA
    // =====================================================

    async getSpecialExportData(
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
        // SPECIAL SURVEYS
        // =================================================

        const surveys =
            await hodReportExportRepository
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
                selected.survey_id;

        }


        // =================================================
        // TARGET DEPARTMENTS
        // =================================================

        const targetDepartments =
            await hodReportExportRepository
                .getTargetDepartments(
                    user.user_id,
                    year,
                    "special"
                );


        // =================================================
        // SOURCE DATA
        // =================================================

        const rows =
            await hodReportExportRepository
                .getSpecialReportSource(
                    user.user_id,
                    year,
                    selectedSurveyId
                );


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
            of targetDepartments
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
                    ) ===
                    Number(
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
        // GROUP SCORES
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
        // APPLY SCORES
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


        const departments =
            [
                ...departmentMap.values()
            ];


        // =================================================
        // SPECIAL AVERAGES
        // =================================================

        const specialAverage = {};


        for (
            const special
            of specialSurveys
        ) {

            if (

                selectedSurveyId !== null &&

                Number(
                    special.survey_id
                ) !==
                Number(
                    selectedSurveyId
                )

            ) {

                continue;

            }


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

            departments,

            special_average:
                specialAverage

        };

    }

}


module.exports =
    new HodReportExportService();