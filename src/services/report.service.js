const reportRepository =
    require("../repositories/report.repository");

const feedbackService =
    require("./feedback.service");

const ApiError =
    require("../utils/ApiError");


class ReportService {


    // =====================================================
    // CONSTANTS
    // =====================================================

    GENERAL_QUARTERS = [
        "Q1",
        "Q2",
        "Q3",
        "Q4"
    ];


    SPECIAL_PREFIX = "Special";


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
    // ROUND SCORE
    // =====================================================

    roundScore(
        value
    ) {

        if (
            value === null ||
            value === undefined ||
            Number.isNaN(
                Number(value)
            )
        ) {

            return null;

        }


        return Number(
            Number(value).toFixed(2)
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
                        Number.isFinite(
                            Number(value)
                        )
                )
                .map(
                    value =>
                        Number(value)
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
    // CACHE FEEDBACK SCORES
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


        const feedbackIds =
            [
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
    // CREATE EMPTY GENERAL QUARTER OBJECT
    // =====================================================

    createGeneralQuarterObject() {

        return {

            Q1: null,

            Q2: null,

            Q3: null,

            Q4: null

        };

    }


    // =====================================================
    // HOD - GENERAL REPORT
    //
    // IMPORTANT:
    //
    // HOD created survey for TARGET department.
    //
    // Example:
    //
    // IT HOD
    // Target = IT
    //
    // Evaluators:
    //
    // Agri     -> IT
    // Accounts -> IT
    // QA       -> IT
    // HR       -> IT
    //
    // HOD report must show:
    //
    // Evaluator Department | Q1 | Q2 | Q3 | Q4 | Yearly Average
    //
    // NOT:
    //
    // IT | Q1 | Q2 ...
    //
    // Each evaluator department gets its own row.
    //
    // Multiple submitted feedbacks for the same
    // evaluator + quarter are averaged.
    //
    // Yearly average is calculated from available
    // Q1-Q4 scores for that evaluator department.
    // =====================================================

    async getHodGeneralReport(
        userId,
        financialYear
    ) {

        const year =
            this.validateFinancialYear(
                financialYear
            );


        const rows =
            await reportRepository
                .getHodGeneralReportSource(
                    Number(userId),
                    year
                );


        const scoreMap =
            await this.buildScoreMap(
                rows
            );


        // =================================================
        // EVALUATOR DEPARTMENT MAP
        //
        // IMPORTANT:
        //
        // We use evaluator_department_id
        // instead of target_department_id.
        //
        // This makes the report show:
        //
        // Agri
        // Accounts
        // QA
        // HR
        //
        // which are evaluating the HOD's department.
        // =================================================

        const departmentMap =
            new Map();


        for (
            const row
            of rows
        ) {

            const evaluatorId =
                Number(
                    row.evaluator_department_id
                );


            if (
                !evaluatorId
            ) {

                continue;

            }


            if (
                departmentMap.has(
                    evaluatorId
                )
            ) {

                continue;

            }


            departmentMap.set(

                evaluatorId,

                {

                    department_id:
                        evaluatorId,

                    department_code:
                        row.evaluator_department_code,

                    department_name:
                        row.evaluator_department_name,

                    Q1: null,

                    Q2: null,

                    Q3: null,

                    Q4: null,

                    yearly_average:
                        null

                }

            );

        }


        // =================================================
        // GROUP SCORES
        //
        // Evaluator Department + Quarter
        //
        // Example:
        //
        // Agri + Q1
        // Accounts + Q1
        // QA + Q1
        //
        // Only submitted feedback is counted.
        // =================================================

        const quarterScores =
            new Map();


        for (
            const row
            of rows
        ) {

            const evaluatorId =
                Number(
                    row.evaluator_department_id
                );


            const quarter =
                String(
                    row.quarter || ""
                )
                    .trim()
                    .toUpperCase();


            if (
                !departmentMap.has(
                    evaluatorId
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
                `${evaluatorId}_${quarter}`;


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


        // =================================================
        // APPLY QUARTERLY SCORES
        // =================================================

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


        // =================================================
        // YEARLY AVERAGE PER EVALUATOR
        //
        // Example:
        //
        // Agri:
        //
        // Q1 = 4.20
        // Q2 = 4.00
        // Q3 = null
        // Q4 = null
        //
        // Yearly = 4.10
        // =================================================

        for (
            const department
            of departmentMap.values()
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


        const departments =
            [
                ...departmentMap.values()
            ]
                .sort(
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
        // QUARTERLY AVERAGE
        //
        // Bottom AVERAGE row.
        //
        // Average of evaluator departments.
        // Non-evaluated departments excluded.
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
        // HOD YEARLY AVERAGE
        //
        // Average of evaluator department yearly averages.
        // =================================================

        const yearlyAverage =
            this.calculateAverage(

                departments.map(
                    department =>
                        department.yearly_average
                )

            );


        // =================================================
        // REPORT
        // =================================================

        return {

            report_type:
                "hod_general",

            financial_year:
                year,

            columns: [

                "Department",

                "Q1",

                "Q2",

                "Q3",

                "Q4",

                "Yearly Average"

            ],

            departments,

            quarterly_average:
                quarterlyAverage,

            yearly_average:
                yearlyAverage

        };

    }


    // =====================================================
    // HOD - SPECIAL REPORT
    //
    // IMPORTANT:
    //
    // Same evaluator-wise concept as General report.
    //
    // The rows represent departments which evaluate
    // the HOD's target department.
    // =====================================================

    async getHodSpecialReport(
        userId,
        financialYear
    ) {

        const year =
            this.validateFinancialYear(
                financialYear
            );


        const rows =
            await reportRepository
                .getHodSpecialReportSource(
                    Number(userId),
                    year
                );


        const surveys =
            await reportRepository
                .getHodSurveys(
                    Number(userId),
                    year,
                    "special"
                );


        const scoreMap =
            await this.buildScoreMap(
                rows
            );


        // =================================================
        // SPECIAL SURVEY NUMBERING
        // =================================================

        const specialSurveyMap =
            new Map();


        surveys.forEach(
            (
                survey,
                index
            ) => {

                specialSurveyMap.set(

                    Number(
                        survey.survey_id
                    ),

                    {

                        survey_id:
                            survey.survey_id,

                        survey_name:
                            survey.survey_name,

                        label:
                            `${this.SPECIAL_PREFIX} ${index + 1}`

                    }

                );

            }
        );


        // =================================================
        // EVALUATOR DEPARTMENT MAP
        // =================================================

        const departmentMap =
            new Map();


        for (
            const row
            of rows
        ) {

            const evaluatorId =
                Number(
                    row.evaluator_department_id
                );


            if (
                !evaluatorId
            ) {

                continue;

            }


            if (
                departmentMap.has(
                    evaluatorId
                )
            ) {

                continue;

            }


            const result = {

                department_id:
                    evaluatorId,

                department_code:
                    row.evaluator_department_code,

                department_name:
                    row.evaluator_department_name

            };


            for (
                const special
                of specialSurveyMap.values()
            ) {

                result[
                    special.label
                ] = null;

            }


            departmentMap.set(
                evaluatorId,
                result
            );

        }


        // =================================================
        // RAW SPECIAL SCORES
        //
        // Evaluator Department + Survey
        // =================================================

        const specialScores =
            new Map();


        for (
            const row
            of rows
        ) {

            const evaluatorId =
                Number(
                    row.evaluator_department_id
                );


            const surveyId =
                Number(
                    row.survey_id
                );


            if (
                !departmentMap.has(
                    evaluatorId
                )
            ) {

                continue;

            }


            const special =
                specialSurveyMap.get(
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
                `${evaluatorId}_${surveyId}`;


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
                specialSurveyMap.get(
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
            ]
                .sort(
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


        for (
            const special
            of specialSurveyMap.values()
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
        // REPORT
        // =================================================

        return {

            report_type:
                "hod_special",

            financial_year:
                year,

            columns: [

                "Department",

                ...[
                    ...specialSurveyMap.values()
                ]
                    .map(
                        special =>
                            special.label
                    )

            ],

            special_surveys:
                [
                    ...specialSurveyMap.values()
                ],

            departments,

            special_average:
                specialAverage

        };

    }


    // =====================================================
    // ADMIN - GENERAL REPORT
    //
    // ADMIN LOGIC REMAINS UNCHANGED.
    //
    // Department | Q1 | Q2 | Q3 | Q4 | Yearly Average
    // =====================================================

    async getAdminGeneralReport(
        financialYear
    ) {

        const year =
            this.validateFinancialYear(
                financialYear
            );


        const rows =
            await reportRepository
                .getAdminGeneralReportSource(
                    year
                );


        const departments =
            await reportRepository
                .getActiveDepartments();


        const scoreMap =
            await this.buildScoreMap(
                rows
            );


        const departmentMap =
            new Map();


        for (
            const department
            of departments
        ) {

            departmentMap.set(

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


        for (
            const department
            of departmentMap.values()
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


        const resultDepartments =
            [
                ...departmentMap.values()
            ];


        const quarterlyAverage = {

            Q1:
                this.calculateAverage(
                    resultDepartments.map(
                        department =>
                            department.Q1
                    )
                ),

            Q2:
                this.calculateAverage(
                    resultDepartments.map(
                        department =>
                            department.Q2
                    )
                ),

            Q3:
                this.calculateAverage(
                    resultDepartments.map(
                        department =>
                            department.Q3
                    )
                ),

            Q4:
                this.calculateAverage(
                    resultDepartments.map(
                        department =>
                            department.Q4
                    )
                )

        };


        const yearlyAverage =
            this.calculateAverage(

                resultDepartments.map(
                    department =>
                        department.yearly_average
                )

            );


        return {

            report_type:
                "admin_general",

            financial_year:
                year,

            columns: [

                "Department",

                "Q1",

                "Q2",

                "Q3",

                "Q4",

                "Yearly Average"

            ],

            departments:
                resultDepartments,

            quarterly_average:
                quarterlyAverage,

            yearly_average:
                yearlyAverage

        };

    }


    // =====================================================
    // ADMIN - SPECIAL REPORT
    // =====================================================

    async getAdminSpecialReport(
        financialYear
    ) {

        const year =
            this.validateFinancialYear(
                financialYear
            );


        const rows =
            await reportRepository
                .getAdminSpecialReportSource(
                    year
                );


        const departments =
            await reportRepository
                .getActiveDepartments();


        const surveys =
            await this.getAllSpecialSurveysFromRows(
                rows
            );


        const scoreMap =
            await this.buildScoreMap(
                rows
            );


        const specialSurveyMap =
            new Map();


        surveys.forEach(
            (
                survey,
                index
            ) => {

                specialSurveyMap.set(

                    Number(
                        survey.survey_id
                    ),

                    {

                        survey_id:
                            survey.survey_id,

                        survey_name:
                            survey.survey_name,

                        label:
                            `${this.SPECIAL_PREFIX} ${index + 1}`

                    }

                );

            }
        );


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
                of specialSurveyMap.values()
            ) {

                result[
                    special.label
                ] = null;

            }


            departmentMap.set(

                Number(
                    department.department_id
                ),

                result

            );

        }


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
                specialSurveyMap.get(
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
                specialSurveyMap.get(
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


        const resultDepartments =
            [
                ...departmentMap.values()
            ];


        const specialAverage = {};


        for (
            const special
            of specialSurveyMap.values()
        ) {

            specialAverage[
                special.label
            ] =
                this.calculateAverage(

                    resultDepartments.map(
                        department =>
                            department[
                                special.label
                            ]
                    )

                );

        }


        return {

            report_type:
                "admin_special",

            financial_year:
                year,

            columns: [

                "Department",

                ...[
                    ...specialSurveyMap.values()
                ]
                    .map(
                        special =>
                            special.label
                    )

            ],

            special_surveys:
                [
                    ...specialSurveyMap.values()
                ],

            departments:
                resultDepartments,

            special_average:
                specialAverage

        };

    }


    // =====================================================
    // GET ALL SPECIAL SURVEYS FROM SOURCE ROWS
    // =====================================================

    async getAllSpecialSurveysFromRows(
        rows
    ) {

        const surveyMap =
            new Map();


        for (
            const row
            of rows
        ) {

            const surveyId =
                Number(
                    row.survey_id
                );


            if (
                !surveyId
            ) {

                continue;

            }


            if (
                !surveyMap.has(
                    surveyId
                )
            ) {

                surveyMap.set(

                    surveyId,

                    {

                        survey_id:
                            row.survey_id,

                        survey_name:
                            row.survey_name,

                        survey_type:
                            row.survey_type,

                        financial_year:
                            row.financial_year

                    }

                );

            }

        }


        return [
            ...surveyMap.values()
        ]
            .sort(
                (
                    a,
                    b
                ) =>
                    Number(
                        a.survey_id
                    ) -
                    Number(
                        b.survey_id
                    )
            );

    }


    // =====================================================
    // GET HOD GENERAL
    // =====================================================

    async getHodGeneral(
        user,
        financialYear
    ) {

        if (
            !user ||
            !user.user_id
        ) {

            throw new ApiError(
                401,
                "Authenticated user is required."
            );

        }


        return await this
            .getHodGeneralReport(
                user.user_id,
                financialYear
            );

    }


    // =====================================================
    // GET HOD SPECIAL
    // =====================================================

    async getHodSpecial(
        user,
        financialYear
    ) {

        if (
            !user ||
            !user.user_id
        ) {

            throw new ApiError(
                401,
                "Authenticated user is required."
            );

        }


        return await this
            .getHodSpecialReport(
                user.user_id,
                financialYear
            );

    }


    // =====================================================
    // GET ADMIN GENERAL
    // =====================================================

    async getAdminGeneral(
        financialYear
    ) {

        return await this
            .getAdminGeneralReport(
                financialYear
            );

    }


    // =====================================================
    // GET ADMIN SPECIAL
    // =====================================================

    async getAdminSpecial(
        financialYear
    ) {

        return await this
            .getAdminSpecialReport(
                financialYear
            );

    }

}


module.exports =
    new ReportService();