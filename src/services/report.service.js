const reportRepository =
    require("../repositories/report.repository");


const dashboardService =
    require("./dashboard.service");


const surveyRepository =
    require("../repositories/survey.repository");


const departmentRepository =
    require("../repositories/department.repository");


const {
    generateExcelReport
} =
    require("../utils/excel");


const {
    generatePDFReport
} =
    require("../utils/pdf");


const ApiError =
    require("../utils/ApiError");


class ReportService {

    // =====================================================
    // ROLE
    // =====================================================

    normalizeRole(role) {

        return String(
            role || ""
        )
            .trim()
            .toUpperCase();

    }


    // =====================================================
    // SURVEY TYPE
    // =====================================================

    normalizeSurveyType(type) {

        return String(
            type || "general"
        )
            .trim()
            .toLowerCase() === "special"
            ? "special"
            : "general";

    }


    // =====================================================
    // FINANCIAL YEAR
    //
    // Example:
    // 2026 => 2026-27
    // 01-Apr-2026 to 31-Mar-2027
    // =====================================================

    resolveFinancialYear(year) {

        const now =
            new Date();


        let currentYear =
            now.getFullYear();


        const month =
            now.getMonth() + 1;


        if (
            month < 4
        ) {

            currentYear--;

        }


        if (
            year === undefined ||
            year === null ||
            year === ""
        ) {

            return currentYear;

        }


        const parsed =
            Number(year);


        if (
            !Number.isInteger(parsed) ||
            parsed < 2000 ||
            parsed > 2100
        ) {

            throw new ApiError(
                400,
                "Invalid financial year"
            );

        }


        return parsed;

    }


    // =====================================================
    // FINANCIAL YEAR LABEL
    // =====================================================

    getFinancialYearLabel(
        year
    ) {

        return (
            `${year}-${String(
                year + 1
            ).slice(-2)}`
        );

    }


    // =====================================================
    // GET QUARTER
    //
    // Q1 = Apr - Jun
    // Q2 = Jul - Sep
    // Q3 = Oct - Dec
    // Q4 = Jan - Mar
    // =====================================================

    getQuarter(
        dateValue,
        financialYearStart
    ) {

        if (
            !dateValue
        ) {

            return null;

        }


        const date =
            new Date(
                dateValue
            );


        if (
            Number.isNaN(
                date.getTime()
            )
        ) {

            return null;

        }


        const year =
            date.getFullYear();


        const month =
            date.getMonth() + 1;


        // -------------------------------------------------
        // Q1
        // Apr - Jun
        // -------------------------------------------------

        if (
            year === financialYearStart &&
            month >= 4 &&
            month <= 6
        ) {

            return "Q1";

        }


        // -------------------------------------------------
        // Q2
        // Jul - Sep
        // -------------------------------------------------

        if (
            year === financialYearStart &&
            month >= 7 &&
            month <= 9
        ) {

            return "Q2";

        }


        // -------------------------------------------------
        // Q3
        // Oct - Dec
        // -------------------------------------------------

        if (
            year === financialYearStart &&
            month >= 10 &&
            month <= 12
        ) {

            return "Q3";

        }


        // -------------------------------------------------
        // Q4
        // Jan - Mar
        // -------------------------------------------------

        if (
            year === financialYearStart + 1 &&
            month >= 1 &&
            month <= 3
        ) {

            return "Q4";

        }


        return null;

    }


    // =====================================================
    // ROUND
    // =====================================================

    round(value) {

        const number =
            Number(value);


        if (
            !Number.isFinite(number)
        ) {

            return null;

        }


        return Number(
            number.toFixed(2)
        );

    }


    // =====================================================
    // AVERAGE
    // =====================================================

    average(values) {

        if (
            !Array.isArray(values)
        ) {

            return null;

        }


        const valid =
            values
                .map(
                    value =>
                        Number(value)
                )
                .filter(
                    value =>
                        Number.isFinite(value)
                );


        if (
            valid.length === 0
        ) {

            return null;

        }


        const total =
            valid.reduce(

                (
                    sum,
                    value
                ) =>
                    sum + value,

                0

            );


        return this.round(
            total / valid.length
        );

    }


    // =====================================================
    // FEEDBACK USI
    //
    // General:
    //     general_weightage
    //
    // Special:
    //     special_importance
    //
    // Formula:
    //
    // USI =
    //     SUM(weight × rating)
    //     ---------------------
    //     SUM(weight × 5)
    //     × 100
    // =====================================================

    calculateFeedbackUSI(
        ratings,
        surveyType
    ) {

        if (
            !Array.isArray(ratings) ||
            ratings.length === 0
        ) {

            return null;

        }


        const type =
            this.normalizeSurveyType(
                surveyType
            );


        let total = 0;

        let maximum = 0;

        let count = 0;


        for (
            const row
            of ratings
        ) {

            const rating =
                Number(
                    row.rating
                );


            if (
                !Number.isFinite(rating) ||
                rating < 1 ||
                rating > 5
            ) {

                continue;

            }


            let importance;


            if (
                type === "special"
            ) {

                importance =
                    Number(
                        row.special_importance
                    );

            }

            else {

                importance =
                    Number(
                        row.general_weightage
                    );

            }


            if (
                !Number.isFinite(
                    importance
                ) ||
                importance <= 0
            ) {

                importance = 5;

            }


            total +=
                importance * rating;


            maximum +=
                importance * 5;


            count++;

        }


        if (
            count === 0 ||
            maximum <= 0
        ) {

            return null;

        }


        return this.round(

            (
                total /
                maximum
            ) * 100

        );

    }


    // =====================================================
    // BUILD FEEDBACK EVALUATIONS
    //
    // One feedback = one evaluation
    // =====================================================

    buildEvaluations(
        feedbackRows
    ) {

        const groups =
            new Map();


        for (
            const row
            of feedbackRows
        ) {

            const feedbackId =
                Number(
                    row.feedback_id
                );


            if (
                !Number.isFinite(
                    feedbackId
                )
            ) {

                continue;

            }


            if (
                !groups.has(
                    feedbackId
                )
            ) {

                groups.set(

                    feedbackId,

                    {

                        feedback_id:
                            feedbackId,

                        survey_id:
                            Number(
                                row.survey_id
                            ),

                        survey_type:
                            this.normalizeSurveyType(
                                row.survey_type
                            ),

                        from_department_id:
                            Number(
                                row.from_department_id
                            ),

                        to_department_id:
                            Number(
                                row.to_department_id
                            ),

                        ratings: []

                    }

                );

            }


            groups
                .get(feedbackId)
                .ratings
                .push(row);

        }


        const result = [];


        for (
            const group
            of groups.values()
        ) {

            const usi =
                this.calculateFeedbackUSI(

                    group.ratings,

                    group.survey_type

                );


            if (
                usi === null
            ) {

                continue;

            }


            result.push({

                feedback_id:
                    group.feedback_id,

                survey_id:
                    group.survey_id,

                survey_type:
                    group.survey_type,

                from_department_id:
                    group.from_department_id,

                to_department_id:
                    group.to_department_id,

                usi

            });

        }


        return result;

    }


    // =====================================================
    // GET REPORT DEPARTMENTS
    //
    // ADMIN:
    //     ALL ACTIVE DEPARTMENTS
    //
    // HOD:
    //     ONLY TARGET DEPARTMENTS
    //
    // IMPORTANT:
    //     HOD's own department is excluded.
    // =====================================================

    async getReportDepartments(
        role,
        departmentId,
        financialYear
    ) {

        // -------------------------------------------------
        // ADMIN
        // -------------------------------------------------

        if (
            role === "ADMIN"
        ) {

            return (
                await reportRepository
                    .findAllDepartments()
            );

        }


        // -------------------------------------------------
        // HOD
        // -------------------------------------------------

        if (
            role === "HOD"
        ) {

            if (
                !departmentId
            ) {

                throw new ApiError(
                    400,
                    "HOD department is required"
                );

            }


            const targetDepartments =
                await reportRepository
                    .findHODTargetDepartments(

                        departmentId,

                        financialYear

                    );


            // ---------------------------------------------
            // IMPORTANT
            //
            // Remove self department.
            //
            // Example:
            // COMPUTER (4) → COMPUTER (4)
            //
            // This is not a valid evaluation target.
            // ---------------------------------------------

            return targetDepartments
                .filter(

                    department =>

                        Number(
                            department.department_id
                        ) !==
                        Number(
                            departmentId
                        )

                );

        }


        throw new ApiError(
            403,
            "Only Admin and HOD can access reports"
        );

    }


    // =====================================================
    // HOD DEPARTMENT NAME
    // =====================================================

    async getHODDepartmentName(
        departmentId
    ) {

        if (
            !departmentId
        ) {

            return null;

        }


        const department =
            await reportRepository
                .findDepartmentById(
                    departmentId
                );


        return (
            department?.department_name ||
            null
        );

    }


    // =====================================================
    // QUARTERLY REPORT
    //
    // ADMIN:
    //
    // Department | Q1 | Q2 | Q3 | Q4 | Year Average
    //
    //
    // HOD:
    //
    // Department | Q1 | Q2 | Q3 | Q4 | Year Average
    //
    // Only departments evaluated BY logged-in HOD.
    //
    //
    // SPECIAL SURVEYS:
    // NOT INCLUDED.
    // =====================================================

    async getQuarterlyReport(
        year,
        role,
        departmentId
    ) {

        const normalizedRole =
            this.normalizeRole(
                role
            );


        // -------------------------------------------------
        // ROLE VALIDATION
        // -------------------------------------------------

        if (
            normalizedRole !== "ADMIN" &&
            normalizedRole !== "HOD"
        ) {

            throw new ApiError(
                403,
                "Only Admin and HOD can access reports"
            );

        }


        // -------------------------------------------------
        // FINANCIAL YEAR
        // -------------------------------------------------

        const financialYear =
            this.resolveFinancialYear(
                year
            );


        const yearLabel =
            this.getFinancialYearLabel(
                financialYear
            );


        console.log("");

        console.log(
            "========================================"
        );

        console.log(
            "📊 BUILDING QUARTERLY REPORT"
        );

        console.log(
            "FINANCIAL YEAR:",
            yearLabel
        );

        console.log(
            "ROLE:",
            normalizedRole
        );

        console.log(
            "HOD DEPARTMENT:",
            departmentId
        );

        console.log(
            "========================================"
        );


        // =================================================
        // 1. GET ALL SURVEYS FOR FINANCIAL YEAR
        // =================================================

        const surveys =
            await reportRepository
                .findSurveysForFinancialYear(
                    financialYear
                );


        // =================================================
        // 2. SELECT GENERAL SURVEY FOR EACH QUARTER
        //
        // Special surveys are ignored here.
        //
        // If multiple general surveys exist in the same
        // quarter, latest survey_id is selected.
        // =================================================

        const quarterlySurveys = {

            Q1: null,

            Q2: null,

            Q3: null,

            Q4: null

        };


        for (
            const survey
            of surveys
        ) {

            const surveyType =
                this.normalizeSurveyType(
                    survey.survey_type
                );


            // ---------------------------------------------
            // SPECIAL SURVEY NEVER ENTERS QUARTERLY REPORT
            // ---------------------------------------------

            if (
                surveyType !== "general"
            ) {

                continue;

            }


            const quarter =
                this.getQuarter(

                    survey.start_date,

                    financialYear

                );


            if (
                !quarter
            ) {

                continue;

            }


            if (
                !quarterlySurveys[
                    quarter
                ]

                ||

                Number(
                    survey.survey_id
                )

                >

                Number(
                    quarterlySurveys[
                        quarter
                    ].survey_id
                )
            ) {

                quarterlySurveys[
                    quarter
                ] =
                    survey;

            }

        }


        // =================================================
        // 3. SURVEY IDS
        // =================================================

        const surveyIds =
            Object.values(
                quarterlySurveys
            )
                .filter(
                    survey =>
                        survey !== null
                )
                .map(
                    survey =>
                        Number(
                            survey.survey_id
                        )
                );


        console.log(
            "QUARTERLY SURVEYS:",
            quarterlySurveys
        );

        console.log(
            "QUARTERLY SURVEY IDS:",
            surveyIds
        );


        // =================================================
        // 4. GET REPORT DEPARTMENTS
        // =================================================

        const departments =
            await this.getReportDepartments(

                normalizedRole,

                departmentId,

                financialYear

            );


        console.log(
            "REPORT DEPARTMENTS:",
            departments
        );


        // =================================================
        // 5. GET SUBMITTED FEEDBACK
        // =================================================

        let evaluations = [];


        if (
            surveyIds.length > 0
        ) {

            const feedbackRows =
                await reportRepository
                    .findSubmittedFeedbackRatings(
                        surveyIds
                    );


            evaluations =
                this.buildEvaluations(
                    feedbackRows
                );

        }


        console.log(
            "TOTAL EVALUATIONS:",
            evaluations.length
        );


        // =================================================
        // 6. BUILD ROWS
        // =================================================

        const rows =
            departments.map(

                (
                    department,
                    index
                ) => {

                    const targetDepartmentId =
                        Number(
                            department.department_id
                        );


                    // -------------------------------------
                    // SCORE FOR ONE QUARTER
                    // -------------------------------------

                    const getQuarterScore =
                        (
                            quarter
                        ) => {

                            const survey =
                                quarterlySurveys[
                                    quarter
                                ];


                            if (
                                !survey
                            ) {

                                return null;

                            }


                            // ---------------------------------
                            // ADMIN
                            //
                            // Any submitted evaluation
                            // received by this department.
                            // ---------------------------------
                            let scores;


                            if (
                                normalizedRole ===
                                "ADMIN"
                            ) {

                                scores =
                                    evaluations
                                        .filter(

                                            evaluation =>

                                                Number(
                                                    evaluation.survey_id
                                                ) ===
                                                Number(
                                                    survey.survey_id
                                                )

                                                &&

                                                Number(
                                                    evaluation.to_department_id
                                                ) ===
                                                targetDepartmentId

                                        )
                                        .map(
                                            evaluation =>
                                                evaluation.usi
                                        );

                            }


                            // ---------------------------------
                            // HOD
                            //
                            // IMPORTANT:
                            //
                            // FROM = logged-in HOD
                            // TO   = target department
                            //
                            // This prevents a received evaluation
                            // from another department being shown.
                            // ---------------------------------

                            else {

                                scores =
                                    evaluations
                                        .filter(

                                            evaluation =>

                                                Number(
                                                    evaluation.survey_id
                                                ) ===
                                                Number(
                                                    survey.survey_id
                                                )

                                                &&

                                                Number(
                                                    evaluation.from_department_id
                                                ) ===
                                                Number(
                                                    departmentId
                                                )

                                                &&

                                                Number(
                                                    evaluation.to_department_id
                                                ) ===
                                                targetDepartmentId

                                        )
                                        .map(
                                            evaluation =>
                                                evaluation.usi
                                        );

                            }


                            return this.average(
                                scores
                            );

                        };


                    const q1 =
                        getQuarterScore(
                            "Q1"
                        );


                    const q2 =
                        getQuarterScore(
                            "Q2"
                        );


                    const q3 =
                        getQuarterScore(
                            "Q3"
                        );


                    const q4 =
                        getQuarterScore(
                            "Q4"
                        );


                    // -------------------------------------
                    // YEAR AVERAGE
                    //
                    // Only available Q1-Q4 values.
                    //
                    // Special survey NEVER included.
                    // -------------------------------------

                    const yearAverage =
                        this.average([

                            q1,

                            q2,

                            q3,

                            q4

                        ]);


                    return {

                        serial_no:
                            index + 1,

                        department_id:
                            targetDepartmentId,

                        department_code:
                            department.department_code,

                        department_name:
                            department.department_name,

                        q1,

                        q2,

                        q3,

                        q4,

                        year_average:
                            yearAverage

                    };

                }

            );


        // =================================================
        // 7. BOTTOM AVERAGE
        //
        // Requirement:
        // HOD report must show AVERAGE row.
        //
        // Admin report:
        // No bottom average required.
        // =================================================

        let averages =
            null;


        if (
            normalizedRole === "HOD"
        ) {

            averages = {

                q1:
                    this.average(
                        rows.map(
                            row =>
                                row.q1
                        )
                    ),

                q2:
                    this.average(
                        rows.map(
                            row =>
                                row.q2
                        )
                    ),

                q3:
                    this.average(
                        rows.map(
                            row =>
                                row.q3
                        )
                    ),

                q4:
                    this.average(
                        rows.map(
                            row =>
                                row.q4
                        )
                    ),

                year_average:
                    this.average(
                        rows.map(
                            row =>
                                row.year_average
                        )
                    )

            };

        }


        // =================================================
        // 8. RESPONSE
        // =================================================

        return {

            report_type:
                "quarterly",

            year:
                yearLabel,

            year_start:
                financialYear,

            year_end:
                financialYear + 1,

            role:
                normalizedRole,

            // ---------------------------------------------
            // HOD INFORMATION
            // ---------------------------------------------

            department_id:
                normalizedRole === "HOD"
                    ? Number(
                        departmentId
                    )
                    : null,

            department_name:
                normalizedRole === "HOD"
                    ? await this.getHODDepartmentName(
                        departmentId
                    )
                    : null,

            // ---------------------------------------------
            // Q1-Q4 SURVEYS
            // ---------------------------------------------

            surveys:
                quarterlySurveys,

            // ---------------------------------------------
            // TABLE COLUMNS
            // ---------------------------------------------

            columns: [

                "Q1",

                "Q2",

                "Q3",

                "Q4",

                "Year Average"

            ],

            // ---------------------------------------------
            // TABLE ROWS
            // ---------------------------------------------

            rows,

            // ---------------------------------------------
            // HOD ONLY AVERAGE
            // ---------------------------------------------

            averages

        };

    }


    // =====================================================
    // SPECIAL SURVEY REPORT
    //
    // COMPLETELY SEPARATE FROM QUARTERLY REPORT.
    //
    // ADMIN:
    //     All departments
    //
    // HOD:
    //     Departments evaluated by HOD
    // =====================================================

    async getSpecialSurveyReport(
        surveyId,
        role,
        departmentId
    ) {

        const normalizedRole =
            this.normalizeRole(
                role
            );


        // -------------------------------------------------
        // ROLE
        // -------------------------------------------------

        if (
            normalizedRole !== "ADMIN" &&
            normalizedRole !== "HOD"
        ) {

            throw new ApiError(
                403,
                "Only Admin and HOD can access reports"
            );

        }


        // -------------------------------------------------
        // SURVEY ID
        // -------------------------------------------------

        const resolvedSurveyId =
            Number(
                surveyId
            );


        if (
            !Number.isInteger(
                resolvedSurveyId
            ) ||
            resolvedSurveyId <= 0
        ) {

            throw new ApiError(
                400,
                "survey_id is required"
            );

        }


        // =================================================
        // 1. GET SURVEY
        // =================================================

        const survey =
            await reportRepository
                .findSurveyById(
                    resolvedSurveyId
                );


        if (
            !survey
        ) {

            throw new ApiError(
                404,
                "Survey not found"
            );

        }


        // =================================================
        // 2. VERIFY SPECIAL SURVEY
        // =================================================

        if (
            this.normalizeSurveyType(
                survey.survey_type
            ) !== "special"
        ) {

            throw new ApiError(
                400,
                "Selected survey is not a special survey"
            );

        }


        // =================================================
        // 3. GET TARGET DEPARTMENTS
        // =================================================

        let departments;


        if (
            normalizedRole === "ADMIN"
        ) {

            departments =
                await reportRepository
                    .findAllDepartments();

        }

        else {

            departments =
                await reportRepository
                    .findHODTargetDepartmentsForSurvey(

                        departmentId,

                        resolvedSurveyId

                    );


            // ---------------------------------------------
            // Remove HOD's own department
            // ---------------------------------------------

            departments =
                departments.filter(

                    department =>

                        Number(
                            department.department_id
                        ) !==
                        Number(
                            departmentId
                        )

                );

        }


        // =================================================
        // 4. GET FEEDBACK
        // =================================================

        const feedbackRows =
            await reportRepository
                .findSubmittedFeedbackRatings([

                    resolvedSurveyId

                ]);


        const evaluations =
            this.buildEvaluations(
                feedbackRows
            );


        // =================================================
        // 5. SPECIAL PARAMETERS
        // =================================================

        const parameters =
            await reportRepository
                .findActiveSpecialParameters([

                    resolvedSurveyId

                ]);


        // =================================================
        // 6. BUILD ROWS
        // =================================================

        const rows =
            departments.map(

                (
                    department,
                    index
                ) => {

                    const targetDepartmentId =
                        Number(
                            department.department_id
                        );


                    let scores;


                    // -------------------------------------
                    // ADMIN
                    // -------------------------------------

                    if (
                        normalizedRole ===
                        "ADMIN"
                    ) {

                        scores =
                            evaluations
                                .filter(

                                    evaluation =>

                                        Number(
                                            evaluation.survey_id
                                        ) ===
                                        resolvedSurveyId

                                        &&

                                        Number(
                                            evaluation.to_department_id
                                        ) ===
                                        targetDepartmentId

                                )
                                .map(
                                    evaluation =>
                                        evaluation.usi
                                );

                    }


                    // -------------------------------------
                    // HOD
                    //
                    // FROM = HOD
                    // TO   = target
                    // -------------------------------------

                    else {

                        scores =
                            evaluations
                                .filter(

                                    evaluation =>

                                        Number(
                                            evaluation.survey_id
                                        ) ===
                                        resolvedSurveyId

                                        &&

                                        Number(
                                            evaluation.from_department_id
                                        ) ===
                                        Number(
                                            departmentId
                                        )

                                        &&

                                        Number(
                                            evaluation.to_department_id
                                        ) ===
                                        targetDepartmentId

                                )
                                .map(
                                    evaluation =>
                                        evaluation.usi
                                );

                    }


                    return {

                        serial_no:
                            index + 1,

                        department_id:
                            targetDepartmentId,

                        department_code:
                            department.department_code,

                        department_name:
                            department.department_name,

                        special_score:
                            this.average(
                                scores
                            )

                    };

                }

            );


        // =================================================
        // 7. HOD AVERAGE
        // =================================================

        const averageScore =
            this.average(

                rows.map(
                    row =>
                        row.special_score
                )

            );


        // =================================================
        // 8. RESPONSE
        // =================================================

        return {

            report_type:
                "special",

            survey: {

                survey_id:
                    Number(
                        survey.survey_id
                    ),

                survey_name:
                    survey.survey_name,

                survey_type:
                    "special",

                start_date:
                    survey.start_date,

                end_date:
                    survey.end_date

            },

            role:
                normalizedRole,

            department_id:
                normalizedRole === "HOD"
                    ? Number(
                        departmentId
                    )
                    : null,

            department_name:
                normalizedRole === "HOD"
                    ? await this.getHODDepartmentName(
                        departmentId
                    )
                    : null,

            parameters,

            columns: [

                "Special Survey Score"

            ],

            rows,

            // ---------------------------------------------
            // HOD:
            // Show average
            //
            // ADMIN:
            // Keep null
            // ---------------------------------------------

            average:
                normalizedRole === "HOD"
                    ? averageScore
                    : null

        };

    }


    // =====================================================
    // OLD EXCEL EXPORT
    //
    // Kept compatible.
    // =====================================================

    async exportExcelReport(
        surveyId
    ) {

        const resolvedId =
            await dashboardService
                .resolveSurveyId(
                    surveyId
                );


        if (
            !resolvedId
        ) {

            throw new ApiError(
                400,
                "No survey data available to export"
            );

        }


        const survey =
            await surveyRepository
                .findById(
                    resolvedId
                );


        const data =
            await dashboardService
                .getDepartmentAnalytics(
                    resolvedId
                );


        const headers = [

            "Department Code",

            "Department Name",

            "Average Score Received (Out of 5)",

            "Average Score Given (Out of 5)"

        ];


        const rows =
            data.map(
                item => [

                    item.department_code,

                    item.department_name,

                    item.average_score_received,

                    item.average_score_given

                ]
            );


        return {

            filename:
                `USI_Report_Survey_${resolvedId}.xlsx`,

            buffer:
                await generateExcelReport(

                    headers,

                    rows,

                    "USI Scores Summary"

                )

        };

    }


    // =====================================================
    // OLD PDF EXPORT
    //
    // Kept compatible.
    // =====================================================

    async exportPDFReport(
        surveyId,
        departmentId
    ) {

        const resolvedId =
            await dashboardService
                .resolveSurveyId(
                    surveyId
                );


        if (
            !resolvedId
        ) {

            throw new ApiError(
                400,
                "No survey data available to export"
            );

        }


        const survey =
            await surveyRepository
                .findById(
                    resolvedId
                );


        // =================================================
        // DEPARTMENT SPECIFIC PDF
        // =================================================

        if (
            departmentId
        ) {

            const dept =
                await departmentRepository
                    .findById(
                        departmentId
                    );


            if (
                !dept
            ) {

                throw new ApiError(
                    404,
                    "Department not found"
                );

            }


            const details =
                await dashboardService
                    .getDepartmentDetailedAnalytics(

                        resolvedId,

                        departmentId

                    );


            const headers = [

                "Parameter Name",

                "Description",

                "Weightage (%)",

                "Average Rating (Out of 5)"

            ];


            const rows =
                details.parameter_scores.map(
                    item => [

                        item.parameter_name,

                        item.description,

                        `${item.weightage}%`,

                        item.average_rating

                    ]
                );


            const buffer =
                await generatePDFReport(

                    `Survey: ${survey.survey_name}\n` +
                    `Detailed Performance Report: ` +
                    `${dept.department_name} ` +
                    `(${dept.department_code})`,

                    headers,

                    rows

                );


            return {

                filename:
                    `USI_Report_${dept.department_code}_Survey_${resolvedId}.pdf`,

                buffer

            };

        }


        // =================================================
        // GENERAL PDF
        // =================================================

        const data =
            await dashboardService
                .getDepartmentAnalytics(
                    resolvedId
                );


        const headers = [

            "Code",

            "Department Name",

            "Score Received (Out of 5)",

            "Score Given (Out of 5)"

        ];


        const rows =
            data.map(
                item => [

                    item.department_code,

                    item.department_name,

                    item.average_score_received,

                    item.average_score_given

                ]
            );


        const buffer =
            await generatePDFReport(

                `Survey: ${survey.survey_name}\n` +
                `Department Score Summary`,

                headers,

                rows

            );


        return {

            filename:
                `USI_General_Report_Survey_${resolvedId}.pdf`,

            buffer

        };

    }

}


// =====================================================
// EXPORT
// =====================================================

module.exports =
    new ReportService();