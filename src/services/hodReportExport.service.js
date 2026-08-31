const hodReportExportRepository =
    require("../repositories/hodReportExport.repository");

const { pool } =
    require("../config/db");

const ExcelJS =
    require("exceljs");

const PDFDocument =
    require("pdfkit");

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
    // USI is calculated by FeedbackService.
    // Therefore report uses the same score everywhere.
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
                        Number(feedbackId),
                        null,
                        "ADMIN"
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
                `❌ Unable to calculate score for feedback ${feedbackId}:`,
                error
            );


            return null;

        }

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
    // Repository returns evaluator departments.
    //
    // Example:
    //
    // Computer HOD
    //
    // General Survey:
    //
    // GENERAL   -> COMPUTER
    // PURCHASE  -> COMPUTER
    //
    // evaluator_department_id:
    //
    // GENERAL
    // PURCHASE
    //
    // These are the departments shown in HOD report.
    // =====================================================

    buildDepartmentMap(
        departments
    ) {

        const map =
            new Map();


        if (
            !Array.isArray(departments)
        ) {

            return map;

        }


        for (
            const department
            of departments
        ) {

            const departmentId =
                Number(
                    department.department_id
                );


            if (
                !Number.isInteger(
                    departmentId
                ) ||
                departmentId <= 0
            ) {

                continue;

            }


            map.set(

                departmentId,

                {

                    department_id:
                        departmentId,

                    department_code:
                        department.department_code,

                    department_name:
                        department.department_name,

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


        return map;

    }


    // =====================================================
    // BUILD QUARTER SCORES
    //
    // VERY IMPORTANT FIX
    //
    // We DO NOT use:
    //
    // row.target_department_id
    //
    // because that is the HOD's target department.
    //
    // We use:
    //
    // row.evaluator_department_id
    //
    // because that is the department evaluated BY HOD.
    //
    // Example:
    //
    // GENERAL -> COMPUTER
    //
    // from_department_id = GENERAL
    // to_department_id   = COMPUTER
    //
    // Report:
    //
    // GENERAL | score
    //
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

            // =================================================
            // IMPORTANT:
            // evaluator_department_id = department evaluated
            // by logged-in HOD
            // =================================================

            const departmentId =
                Number(
                    row.evaluator_department_id
                );


            if (
                !departmentMap.has(
                    departmentId
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
    // Only available quarters are considered.
    //
    // Example:
    //
    // Q1 = 90
    // Q2 = N/A
    // Q3 = N/A
    // Q4 = N/A
    //
    // Yearly Average = 90
    //
    // NOT:
    // 90 / 4
    // =====================================================

    calculateYearlyAverage(
        departments
    ) {

        for (
            const department
            of departments
        ) {

            department.yearly_average =
                this.calculateAverage([

                    department.Q1,
                    department.Q2,
                    department.Q3,
                    department.Q4

                ]);

        }

    }


    // =====================================================
    // GENERAL EXPORT DATA
    //
    // YEARLY:
    //
    // Department | Q1 | Q2 | Q3 | Q4 | Yearly Average
    //
    // QUARTERLY:
    //
    // Department | Q1
    //
    // Bottom:
    //
    // Average | Q1 Average
    //
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


        console.log("");
        console.log(
            "========================================"
        );
        console.log(
            "📊 HOD GENERAL EXPORT"
        );
        console.log(
            "HOD USER ID:",
            user.user_id
        );
        console.log(
            "HOD DEPARTMENT ID:",
            user.department_id
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
        // GET DEPARTMENTS EVALUATED BY THIS HOD
        // =================================================

        const targetDepartments =
            await hodReportExportRepository
                .getTargetDepartments(

                    user.user_id,

                    year,

                    "general"

                );


        console.log(
            "HOD EVALUATED DEPARTMENTS:",
            targetDepartments
        );


        // =================================================
        // QUERY PERIOD
        //
        // YEARLY -> all quarters
        // Q1    -> only Q1
        // =================================================

        const queryPeriod =
            selectedPeriod === "YEARLY"
                ? null
                : selectedPeriod;


        // =================================================
        // GET FEEDBACK SOURCE ROWS
        // =================================================

        const rows =
            await hodReportExportRepository
                .getGeneralReportSource(

                    user.user_id,

                    year,

                    queryPeriod

                );


        console.log(
            "HOD GENERAL SOURCE ROW COUNT:",
            rows.length
        );


        // =================================================
        // SCORE MAP
        // =================================================

        const scoreMap =
            await this.buildScoreMap(
                rows
            );


        console.log(
            "HOD SCORE MAP:",
            scoreMap
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
            Array.from(
                departmentMap.values()
            );


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
        // YEARLY AVERAGES
        // =================================================

        this.calculateYearlyAverage(
            departments
        );


        // =================================================
        // QUARTER AVERAGES
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
        // YEARLY AVERAGE
        // =================================================

        const yearlyAverage =
            this.calculateAverage(

                departments.map(
                    department =>
                        department.yearly_average
                )

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

        }

        else {

            columns = [

                "Department",

                selectedPeriod

            ];

        }


        // =================================================
        // FINAL REPORT
        // =================================================

        const report = {

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
                yearlyAverage,

            _user:
                user

        };


        console.log(
            "FINAL HOD GENERAL REPORT:",
            JSON.stringify(
                report,
                null,
                2
            )
        );


        return report;

    }


    // =====================================================
    // GET HOD DEPARTMENT
    // =====================================================

    async getHodDepartment(
        user
    ) {

        const departmentId =
            Number(
                user?.department_id ??
                user?.departmentId ??
                user?.department?.department_id
            );


        if (
            !Number.isInteger(
                departmentId
            ) ||
            departmentId <= 0
        ) {

            return null;

        }


        const [
            rows
        ] =
            await pool.query(
                `

                    SELECT

                        department_id,

                        department_code,

                        department_name

                    FROM departments

                    WHERE department_id = ?

                    LIMIT 1

                `,
                [
                    departmentId
                ]
            );


        return rows?.[0] || null;

    }


    // =====================================================
    // FORMAT EXPORT VALUE
    // =====================================================

    formatExportValue(
        value
    ) {

        if (
            value === null ||
            value === undefined ||
            value === ""
        ) {

            return "-";

        }


        const number =
            Number(value);


        if (
            !Number.isFinite(
                number
            )
        ) {

            return "-";

        }


        return Number(
            number.toFixed(2)
        );

    }


    // =====================================================
    // PREPARE GENERAL EXPORT
    //
    // YEARLY:
    //
    // Department | Q1 | Q2 | Q3 | Q4 | Yearly Average
    //
    // Q1:
    //
    // Department | Q1
    //
    // Bottom:
    //
    // Average | Q1 Average
    // =====================================================

    prepareGeneralExport(
        report,
        hodDepartment
    ) {

        const period =
            String(
                report?.report_period || "YEARLY"
            )
                .trim()
                .toUpperCase();


        const departments =
            Array.isArray(
                report?.departments
            )
                ? report.departments
                : [];


        const hodName =
            hodDepartment?.department_name ||
            "HOD";


        // =================================================
        // TITLE
        // =================================================

        const title =
            period === "YEARLY"

                ? `${hodName} Department – Yearly Evaluation Report`

                : `${hodName} Department – ${period} Evaluation Report`;


        let headers;

        let rows;

        let averageRow;


        // =================================================
        // YEARLY
        // =================================================

        if (
            period === "YEARLY"
        ) {

            headers = [

                "Department",

                "Q1",

                "Q2",

                "Q3",

                "Q4",

                "Yearly Average"

            ];


            rows =
                departments.map(
                    department => [

                        department.department_name ||
                        department.department_code ||
                        "—",

                        this.formatExportValue(
                            department.Q1
                        ),

                        this.formatExportValue(
                            department.Q2
                        ),

                        this.formatExportValue(
                            department.Q3
                        ),

                        this.formatExportValue(
                            department.Q4
                        ),

                        this.formatExportValue(
                            department.yearly_average
                        )

                    ]
                );


            averageRow = [

                "Average",

                this.formatExportValue(
                    report?.quarterly_average?.Q1
                ),

                this.formatExportValue(
                    report?.quarterly_average?.Q2
                ),

                this.formatExportValue(
                    report?.quarterly_average?.Q3
                ),

                this.formatExportValue(
                    report?.quarterly_average?.Q4
                ),

                this.formatExportValue(
                    report?.yearly_average
                )

            ];

        }


        // =================================================
        // QUARTERLY
        // =================================================

        else {

            const quarter =
                this.GENERAL_QUARTERS.includes(
                    period
                )
                    ? period
                    : "Q1";


            headers = [

                "Department",

                quarter

            ];


            rows =
                departments.map(
                    department => [

                        department.department_name ||
                        department.department_code ||
                        "—",

                        this.formatExportValue(
                            department?.[quarter]
                        )

                    ]
                );


            const average =
                this.formatExportValue(
                    report?.quarterly_average?.[quarter]
                );


            averageRow = [

                "Average",

                average

            ];

        }


        return {

            title,

            financialYear:
                report?.financial_year || "",

            period,

            headers,

            rows,

            averageRow,

            hodDepartmentName:
                hodName

        };

    }


    // =====================================================
    // PREPARE SPECIAL EXPORT
    // =====================================================

    prepareSpecialExport(
        report,
        hodDepartment
    ) {

        const specialSurveys =
            Array.isArray(
                report?.special_surveys
            )
                ? report.special_surveys
                : [];


        const departments =
            Array.isArray(
                report?.departments
            )
                ? report.departments
                : [];


        const headers = [

            "Department",

            ...specialSurveys.map(
                special =>
                    special.label
            ),

            "Average"

        ];


        const rows =
            departments.map(
                department => {

                    const scores =
                        specialSurveys.map(
                            special =>
                                this.formatExportValue(
                                    department?.[
                                        special.label
                                    ]
                                )
                        );


                    const valid =
                        scores

                            .map(
                                value =>
                                    value === "-"
                                        ? null
                                        : Number(value)
                            )

                            .filter(
                                value =>
                                    Number.isFinite(
                                        value
                                    )
                            );


                    const average =
                        valid.length > 0

                            ? this.formatExportValue(

                                valid.reduce(
                                    (
                                        sum,
                                        value
                                    ) =>
                                        sum + value,

                                    0
                                ) /
                                valid.length

                            )

                            : "-";


                    return [

                        department.department_name ||
                        department.department_code ||
                        "—",

                        ...scores,

                        average

                    ];

                }
            );


        const averageRow = [

            "Average",

            ...specialSurveys.map(
                special =>
                    this.formatExportValue(
                        report?.special_average?.[
                            special.label
                        ]
                    )
            ),

            "-"

        ];


        return {

            title:
                `${hodDepartment?.department_name || "HOD"} Department – Special Evaluation Report`,

            financialYear:
                report?.financial_year || "",

            period:
                report?.report_period || "ALL",

            headers,

            rows,

            averageRow,

            hodDepartmentName:
                hodDepartment?.department_name ||
                "HOD"

        };

    }


    // =====================================================
    // GENERATE EXCEL
    // =====================================================

async generateExcel(report) {

    const ExcelJS = require("exceljs");

    const workbook =
        new ExcelJS.Workbook();

    const worksheet =
        workbook.addWorksheet("Report");


    // =========================================================
    // COMMON COMPANY DETAILS
    // =========================================================

    const companyName =
        "RAJARAMBAPU PATIL SAHAKARI SAKHAR KARKHANA LTD.";

    const companyLocation =
        "RAJARAMNAGAR";

    const generatedOn =
        new Date().toLocaleDateString("en-GB");


    // =========================================================
    // HELPER : COMMON HEADER
    // =========================================================

    const addCompanyHeader = (
        title,
        totalColumns
    ) => {

        // -----------------------------------------------------
        // COMPANY NAME
        // -----------------------------------------------------

        worksheet.addRow([
            companyName
        ]);

        worksheet.mergeCells(
            1,
            1,
            1,
            totalColumns
        );

        const companyCell =
            worksheet.getCell(1, 1);

        companyCell.font = {
            bold: true,
            size: 18,
            color: {
                argb: "1F355E"
            }
        };

        companyCell.alignment = {
            horizontal: "center",
            vertical: "center"
        };

        worksheet.getRow(1).height = 30;


        // -----------------------------------------------------
        // LOCATION
        // -----------------------------------------------------

        worksheet.addRow([
            companyLocation
        ]);

        worksheet.mergeCells(
            2,
            1,
            2,
            totalColumns
        );

        const locationCell =
            worksheet.getCell(2, 1);

        locationCell.font = {
            bold: true,
            size: 11,
            color: {
                argb: "65758B"
            }
        };

        locationCell.alignment = {
            horizontal: "center",
            vertical: "center"
        };

        worksheet.getRow(2).height = 20;


        // -----------------------------------------------------
        // BLUE SEPARATOR
        // -----------------------------------------------------

        worksheet.addRow([]);

        worksheet.mergeCells(
            3,
            1,
            3,
            totalColumns
        );

        const separator =
            worksheet.getCell(3, 1);

        separator.border = {
            bottom: {
                style: "medium",
                color: {
                    argb: "246BCE"
                }
            }
        };

        worksheet.getRow(3).height = 8;


        // -----------------------------------------------------
        // REPORT TITLE
        // -----------------------------------------------------

        worksheet.addRow([
            title
        ]);

        worksheet.mergeCells(
            4,
            1,
            4,
            totalColumns
        );

        const titleCell =
            worksheet.getCell(4, 1);

        titleCell.font = {
            bold: true,
            size: 16,
            color: {
                argb: "1F355E"
            }
        };

        titleCell.alignment = {
            horizontal: "center",
            vertical: "center"
        };

        worksheet.getRow(4).height = 28;

    };


    // =========================================================
    // HELPER : COMMON TABLE HEADER STYLE
    // =========================================================

    const styleHeaderRow = (
        row
    ) => {

        row.height = 28;

        row.eachCell(cell => {

            cell.font = {
                bold: true,
                size: 11,
                color: {
                    argb: "FFFFFF"
                }
            };

            cell.fill = {
                type: "pattern",
                pattern: "solid",
                fgColor: {
                    argb: "1F355E"
                }
            };

            cell.alignment = {
                horizontal: "center",
                vertical: "center",
                wrapText: true
            };

            cell.border = {

                top: {
                    style: "thin",
                    color: {
                        argb: "AFC2DD"
                    }
                },

                bottom: {
                    style: "thin",
                    color: {
                        argb: "AFC2DD"
                    }
                },

                left: {
                    style: "thin",
                    color: {
                        argb: "AFC2DD"
                    }
                },

                right: {
                    style: "thin",
                    color: {
                        argb: "AFC2DD"
                    }
                }

            };

        });

    };


    // =========================================================
    // HELPER : DATA ROW STYLE
    // =========================================================

    const styleDataRow = (
        row
    ) => {

        row.height = 23;

        row.eachCell(
            (cell, columnNumber) => {

                cell.font = {
                    size: 10,
                    bold:
                        columnNumber === 1
                };

                cell.alignment = {

                    horizontal:
                        columnNumber === 1
                            ? "left"
                            : "center",

                    vertical: "center",

                    wrapText: true

                };

                cell.border = {

                    top: {
                        style: "thin",
                        color: {
                            argb: "C9D5E5"
                        }
                    },

                    bottom: {
                        style: "thin",
                        color: {
                            argb: "C9D5E5"
                        }
                    },

                    left: {
                        style: "thin",
                        color: {
                            argb: "C9D5E5"
                        }
                    },

                    right: {
                        style: "thin",
                        color: {
                            argb: "C9D5E5"
                        }
                    }

                };

            }
        );

    };


    // =========================================================
    // GENERAL REPORT
    // =========================================================

    if (
        report.report_type === "admin_general" ||
        report.report_type === "hod_general"
    ) {

        const period =
            report.report_period;

        let headers;


        // -----------------------------------------------------
        // HEADERS
        // -----------------------------------------------------

        if (
            period === "YEARLY"
        ) {

            headers = [

                "Department",

                "Q1",

                "Q2",

                "Q3",

                "Q4",

                "Yearly Average"

            ];

        } else {

            headers = [

                "Department",

                period

            ];

        }


        const totalColumns =
            headers.length;


        // -----------------------------------------------------
        // TITLE
        // -----------------------------------------------------

        const reportTitle =
            report.report_type === "hod_general"
                ? "HOD GENERAL REPORT"
                : "ADMIN GENERAL REPORT";


        addCompanyHeader(
            reportTitle,
            totalColumns
        );


        // -----------------------------------------------------
        // FINANCIAL YEAR + PERIOD
        // -----------------------------------------------------

        worksheet.addRow([

            `Financial Year: ${report.financial_year}`,

            ...Array(
                totalColumns - 2
            ).fill(""),

            `Period: ${period}`

        ]);


        if (
            totalColumns >= 3
        ) {

            worksheet.mergeCells(
                5,
                2,
                5,
                totalColumns - 1
            );

        }


        const financialCell =
            worksheet.getCell(5, 1);

        financialCell.font = {
            size: 10,
            color: {
                argb: "65758B"
            }
        };

        financialCell.alignment = {
            horizontal: "left",
            vertical: "center"
        };


        const periodCell =
            worksheet.getCell(
                5,
                totalColumns
            );

        periodCell.font = {
            size: 10,
            color: {
                argb: "65758B"
            }
        };

        periodCell.alignment = {
            horizontal: "right",
            vertical: "center"
        };

        worksheet.getRow(5).height = 22;


        // -----------------------------------------------------
        // GENERATED ON
        // -----------------------------------------------------

        worksheet.addRow([
            `Generated On: ${generatedOn}`
        ]);

        worksheet.mergeCells(
            6,
            1,
            6,
            totalColumns
        );

        const generatedCell =
            worksheet.getCell(6, 1);

        generatedCell.font = {
            size: 9,
            color: {
                argb: "65758B"
            }
        };

        generatedCell.alignment = {
            horizontal: "right",
            vertical: "center"
        };

        worksheet.getRow(6).height = 20;


        // -----------------------------------------------------
        // SPACE
        // -----------------------------------------------------

        worksheet.addRow([]);


        // -----------------------------------------------------
        // TABLE HEADER
        // -----------------------------------------------------

        worksheet.addRow(headers);

        const headerRow =
            worksheet.getRow(8);

        styleHeaderRow(
            headerRow
        );


        // -----------------------------------------------------
        // DATA
        // -----------------------------------------------------

// -----------------------------------------------------
// DATA
// -----------------------------------------------------

for (
    const department
    of report.departments || []
) {

    const row = [

        department.department_name ||
        department.department_code ||
        "-"

    ];


    // =====================================================
    // YEARLY
    // =====================================================

    if (
        period === "YEARLY"
    ) {

        row.push(
            department.Q1 ?? "-"
        );

        row.push(
            department.Q2 ?? "-"
        );

        row.push(
            department.Q3 ?? "-"
        );

        row.push(
            department.Q4 ?? "-"
        );

        row.push(
            department.yearly_average ?? "-"
        );

    }


    // =====================================================
    // QUARTERLY
    // =====================================================

    else {

        row.push(
            department[period] ?? "-"
        );

    }


    const excelRow =
        worksheet.addRow(
            row
        );


    styleDataRow(
        excelRow
    );


    // -----------------------------------------------------
    // NUMBER FORMAT
    // -----------------------------------------------------

    excelRow.eachCell(
        (
            cell,
            columnNumber
        ) => {

            if (
                columnNumber > 1 &&
                typeof cell.value === "number"
            ) {

                cell.numFmt =
                    "0.00";

            }

        }
    );

}


// =========================================================
// AVERAGE ROW
// =========================================================
//
// YEARLY:
//
// Average | Q1 Avg | Q2 Avg | Q3 Avg | Q4 Avg | Yearly Avg
//
// QUARTER:
//
// Average | Selected Quarter Avg
// =========================================================


// ---------------------------------------------------------
// SAFE AVERAGE HELPER
// ---------------------------------------------------------

const calculateColumnAverage =
    (
        values
    ) => {

        const validValues =
            values
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

            return "-";

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


        return Number(
            (
                total /
                validValues.length
            ).toFixed(2)
        );

    };


// ---------------------------------------------------------
// YEARLY AVERAGE
// ---------------------------------------------------------

let averageRow;


if (
    period === "YEARLY"
) {

    averageRow = [

        "Average",

        calculateColumnAverage(
            (report.departments || [])
                .map(
                    department =>
                        department.Q1
                )
        ),

        calculateColumnAverage(
            (report.departments || [])
                .map(
                    department =>
                        department.Q2
                )
        ),

        calculateColumnAverage(
            (report.departments || [])
                .map(
                    department =>
                        department.Q3
                )
        ),

        calculateColumnAverage(
            (report.departments || [])
                .map(
                    department =>
                        department.Q4
                )
        ),

        calculateColumnAverage(
            (report.departments || [])
                .map(
                    department =>
                        department.yearly_average
                )
        )

    ];

}


// ---------------------------------------------------------
// QUARTERLY AVERAGE
// ---------------------------------------------------------

else {

    averageRow = [

        "Average",

        calculateColumnAverage(

            (report.departments || [])
                .map(
                    department =>
                        department[period]
                )

        )

    ];

}


// ---------------------------------------------------------
// ADD AVERAGE ROW
// ---------------------------------------------------------

const averageExcelRow =
    worksheet.addRow(
        averageRow
    );


averageExcelRow.height =
    26;


// ---------------------------------------------------------
// AVERAGE ROW STYLE
// ---------------------------------------------------------

averageExcelRow.eachCell(
    (
        cell,
        columnNumber
    ) => {

        cell.font = {

            name: "Arial",

            size: 11,

            bold: true,

            color: {

                argb:
                    "1F355E"

            }

        };


        cell.alignment = {

            horizontal:
                columnNumber === 1
                    ? "left"
                    : "center",

            vertical:
                "center"

        };


        cell.fill = {

            type:
                "pattern",

            pattern:
                "solid",

            fgColor: {

                argb:
                    "EAF1FB"

            }

        };


        cell.border = {

            top: {

                style:
                    "medium",

                color: {

                    argb:
                        "9EB6D8"

                }

            },

            bottom: {

                style:
                    "medium",

                color: {

                    argb:
                        "9EB6D8"

                }

            },

            left: {

                style:
                    "thin",

                color: {

                    argb:
                        "C9D5E5"

                }

            },

            right: {

                style:
                    "thin",

                color: {

                    argb:
                        "C9D5E5"

                }

            }

        };


        // Number format

        if (
            columnNumber > 1 &&
            typeof cell.value === "number"
        ) {

            cell.numFmt =
                "0.00";

        }

    }
);

        // -----------------------------------------------------
        // FREEZE
        // -----------------------------------------------------

        worksheet.views = [

            {
                state: "frozen",
                ySplit: 8
            }

        ];


        // -----------------------------------------------------
        // COLUMN WIDTH
        // -----------------------------------------------------

        worksheet.getColumn(1).width =
            32;


        if (
            period === "YEARLY"
        ) {

            worksheet.getColumn(2).width =
                14;

            worksheet.getColumn(3).width =
                14;

            worksheet.getColumn(4).width =
                14;

            worksheet.getColumn(5).width =
                14;

            worksheet.getColumn(6).width =
                18;

        } else {

            worksheet.getColumn(2).width =
                18;

        }


        // -----------------------------------------------------
        // FOOTER
        // -----------------------------------------------------

        const footerRow =
            worksheet.lastRow.number + 2;

        worksheet.addRow([]);

        worksheet.mergeCells(
            footerRow,
            1,
            footerRow,
            totalColumns
        );

        const footerCell =
            worksheet.getCell(
                footerRow,
                1
            );

        footerCell.value =
            "User Satisfaction Index (USI)";

        footerCell.font = {
            italic: true,
            size: 9,
            color: {
                argb: "65758B"
            }
        };

        footerCell.alignment = {
            horizontal: "left"
        };

    }


    // =========================================================
    // SPECIAL REPORT
    // =========================================================

    else if (
        report.report_type === "admin_special" ||
        report.report_type === "hod_special"
    ) {

        const specials =
            report.special_surveys || [];


        const headers = [

            "Department",

            ...specials.map(
                special =>
                    special.label
            )

        ];


        const totalColumns =
            headers.length;


        // -----------------------------------------------------
        // TITLE
        // -----------------------------------------------------

        const reportTitle =
            report.report_type === "hod_special"
                ? "HOD SPECIAL REPORT"
                : "ADMIN SPECIAL REPORT";


        addCompanyHeader(
            reportTitle,
            totalColumns
        );


        // -----------------------------------------------------
        // FINANCIAL YEAR
        // -----------------------------------------------------

        worksheet.addRow([

            `Financial Year: ${report.financial_year}`

        ]);

        worksheet.mergeCells(
            5,
            1,
            5,
            totalColumns
        );


        const financialCell =
            worksheet.getCell(5, 1);

        financialCell.font = {
            size: 10,
            color: {
                argb: "65758B"
            }
        };

        financialCell.alignment = {
            horizontal: "left",
            vertical: "center"
        };

        worksheet.getRow(5).height = 22;


        // -----------------------------------------------------
        // GENERATED ON
        // -----------------------------------------------------

        worksheet.addRow([
            `Generated On: ${generatedOn}`
        ]);

        worksheet.mergeCells(
            6,
            1,
            6,
            totalColumns
        );

        const generatedCell =
            worksheet.getCell(6, 1);

        generatedCell.font = {
            size: 9,
            color: {
                argb: "65758B"
            }
        };

        generatedCell.alignment = {
            horizontal: "right",
            vertical: "center"
        };

        worksheet.getRow(6).height = 20;


        // -----------------------------------------------------
        // SPACE
        // -----------------------------------------------------

        worksheet.addRow([]);


        // -----------------------------------------------------
        // TABLE HEADER
        // -----------------------------------------------------

        worksheet.addRow(headers);

        const headerRow =
            worksheet.getRow(8);

        styleHeaderRow(
            headerRow
        );


        // -----------------------------------------------------
        // DATA
        // -----------------------------------------------------

        for (
            const department
            of report.departments || []
        ) {

            const row = [

                department.department_name

            ];


            for (
                const special
                of specials
            ) {

                row.push(

                    department[
                        special.label
                    ] ?? "-"

                );

            }


            const excelRow =
                worksheet.addRow(row);


            styleDataRow(
                excelRow
            );

        }


        // -----------------------------------------------------
        // COLUMN WIDTH
        // -----------------------------------------------------

        worksheet.getColumn(1).width =
            32;


        for (
            let i = 2;
            i <= totalColumns;
            i++
        ) {

            worksheet.getColumn(i).width =
                20;

        }


        // -----------------------------------------------------
        // FREEZE
        // -----------------------------------------------------

        worksheet.views = [

            {
                state: "frozen",
                ySplit: 8
            }

        ];


        // -----------------------------------------------------
        // FOOTER
        // -----------------------------------------------------

        const footerRow =
            worksheet.lastRow.number + 2;

        worksheet.addRow([]);

        worksheet.mergeCells(
            footerRow,
            1,
            footerRow,
            totalColumns
        );

        const footerCell =
            worksheet.getCell(
                footerRow,
                1
            );

        footerCell.value =
            "User Satisfaction Index (USI)";

        footerCell.font = {
            italic: true,
            size: 9,
            color: {
                argb: "65758B"
            }
        };

        footerCell.alignment = {
            horizontal: "left"
        };

    }


    // =========================================================
    // UNSUPPORTED REPORT
    // =========================================================

    else {

        throw new ApiError(
            400,
            `Unsupported report type: ${report.report_type}`
        );

    }


    // =========================================================
    // PAGE SETUP
    // =========================================================

    worksheet.pageSetup = {

        orientation: "landscape",

        fitToPage: true,

        fitToWidth: 1,

        fitToHeight: 0,

        paperSize:
            worksheet.PAPERSIZE_A4

    };


    worksheet.pageSetup.margins = {

        left: 0.3,

        right: 0.3,

        top: 0.5,

        bottom: 0.5,

        header: 0.2,

        footer: 0.2

    };


    // =========================================================
    // PRINT OPTIONS
    // =========================================================

    worksheet.pageSetup.horizontalCentered =
        true;


    worksheet.printOptions = {

        horizontalCentered: true,

        verticalCentered: false

    };


    // =========================================================
    // RETURN BUFFER
    // =========================================================

    return await workbook.xlsx.writeBuffer();

}
    // =====================================================
    // EXCEL COLUMN LETTER
    // =====================================================

    getExcelColumnLetter(
        columnNumber
    ) {

        let dividend =
            Number(
                columnNumber
            );


        let columnName =
            "";


        while (
            dividend > 0
        ) {

            const modulo =
                (
                    dividend - 1
                ) % 26;


            columnName =
                String.fromCharCode(
                    65 + modulo
                ) +
                columnName;


            dividend =
                Math.floor(
                    (
                        dividend - modulo
                    ) / 26
                );

        }


        return columnName;

    }


    // =====================================================
    // GENERATE PDF
    //
    // Same structure as Excel.
    //
    // YEARLY:
    //
    // Department | Q1 | Q2 | Q3 | Q4 | Yearly Average
    //
    // QUARTER:
    //
    // Department | Q1
    // Average    | 90.00
    // =====================================================
// =====================================================
// GENERATE PDF
//
// PROFESSIONAL HOD REPORT
//
// Structure:
// Company Header
// Location
// Report Title
// Financial Year + Period
// Report Summary
// Department-wise USI Performance
// Full Grid Table
// Average Row
// Footer
// =====================================================

async generatePdf(
    report
) {

    const hodDepartment =
        await this.getHodDepartment(
            report?._user || {}
        );


    const prepared =
        report?.report_type === "hod_special"

            ? this.prepareSpecialExport(
                report,
                hodDepartment
            )

            : this.prepareGeneralExport(
                report,
                hodDepartment
            );


    return new Promise(
        (
            resolve,
            reject
        ) => {

            // =================================================
            // PDF DOCUMENT
            // =================================================

            const document =
                new PDFDocument({

                    size:
                        "A4",

                    layout:
                        prepared.headers.length > 5
                            ? "landscape"
                            : "portrait",

                    margins: {

                        top:
                            36,

                        bottom:
                            42,

                        left:
                            36,

                        right:
                            36

                    },

                    bufferPages:
                        true

                });


            const chunks = [];


            document.on(
                "data",
                chunk =>
                    chunks.push(
                        chunk
                    )
            );


            document.on(
                "end",
                () =>
                    resolve(
                        Buffer.concat(
                            chunks
                        )
                    )
            );


            document.on(
                "error",
                reject
            );


            // =================================================
            // PAGE INFORMATION
            // =================================================

            const pageWidth =
                document.page.width;


            const pageHeight =
                document.page.height;


            const left =
                document.page.margins.left;


            const right =
                document.page.margins.right;


            const usableWidth =
                pageWidth -
                left -
                right;


            const isGeneral =
                report?.report_type !==
                "hod_special";


            const financialYear =
                prepared.financialYear ||
                "";


            const reportPeriod =
                prepared.period ||
                "YEARLY";


            const headers =
                prepared.headers || [];


            // =================================================
            // COLUMN WIDTHS
            // =================================================

            const columnCount =
                headers.length;


            let firstColumnWidth;


            if (
                columnCount === 6
            ) {

                firstColumnWidth =
                    usableWidth *
                    0.31;

            }

            else if (
                columnCount === 3
            ) {

                firstColumnWidth =
                    usableWidth *
                    0.42;

            }

            else {

                firstColumnWidth =
                    usableWidth *
                    0.36;

            }


            const remainingWidth =
                usableWidth -
                firstColumnWidth;


            const otherColumnCount =
                Math.max(
                    columnCount - 1,
                    1
                );


            const columnWidths = [

                firstColumnWidth,

                ...Array(
                    otherColumnCount
                )
                    .fill(
                        remainingWidth /
                        otherColumnCount
                    )

            ];


            // =================================================
            // COLORS
            // =================================================

            const COLORS = {

                navy:
                    "#172d52",

                blue:
                    "#1769d1",

                blueLight:
                    "#edf4ff",

                text:
                    "#202b3c",

                muted:
                    "#64748b",

                border:
                    "#cbd5e1",

                lightBorder:
                    "#dce4ee",

                grayBg:
                    "#f5f7fa",

                white:
                    "#ffffff"

            };


            // =================================================
            // DIMENSIONS
            // =================================================

            const headerHeight =
                32;


            const rowHeight =
                27;


            const summaryHeight =
                65;


            let y =
                36;


            // =================================================
            // SAFE VALUE
            // =================================================

            const safeValue =
                value => {

                    if (
                        value === null ||
                        value === undefined ||
                        value === ""
                    ) {

                        return "N/A";

                    }

                    return String(
                        value
                    );

                };


            // =================================================
            // DRAW COMPANY HEADER
            // =================================================

            const drawCompanyHeader =
                () => {

                    // -----------------------------------------
                    // COMPANY NAME
                    // -----------------------------------------

                    document
                        .font(
                            "Helvetica-Bold"
                        )
                        .fontSize(
                            16
                        )
                        .fillColor(
                            COLORS.navy
                        )
                        .text(

                            "RAJARAMBAPU PATIL SAHAKARI SAKHAR KARKHANA LTD.",

                            left,
                            y,

                            {

                                width:
                                    usableWidth,

                                align:
                                    "center"

                            }

                        );


                    y +=
                        22;


                    // -----------------------------------------
                    // LOCATION
                    // -----------------------------------------

                    document
                        .font(
                            "Helvetica-Bold"
                        )
                        .fontSize(
                            10
                        )
                        .fillColor(
                            COLORS.muted
                        )
                        .text(

                            "RAJARAMNAGAR",

                            left,
                            y,

                            {

                                width:
                                    usableWidth,

                                align:
                                    "center"

                            }

                        );


                    y +=
                        22;


                    // -----------------------------------------
                    // BLUE LINE
                    // -----------------------------------------

                    document
                        .moveTo(
                            left,
                            y
                        )
                        .lineTo(
                            left +
                            usableWidth,
                            y
                        )
                        .lineWidth(
                            1.4
                        )
                        .strokeColor(
                            COLORS.blue
                        )
                        .stroke();


                    y +=
                        14;

                };


            // =================================================
            // DRAW REPORT TITLE
            // =================================================

            const drawReportTitle =
                () => {

                    document
                        .font(
                            "Helvetica-Bold"
                        )
                        .fontSize(
                            14
                        )
                        .fillColor(
                            COLORS.navy
                        )
                        .text(

                            prepared.title,

                            left,
                            y,

                            {

                                width:
                                    usableWidth,

                                align:
                                    "center"

                            }

                        );


                    y +=
                        26;


                    // -----------------------------------------
                    // FINANCIAL YEAR
                    // -----------------------------------------

                    document
                        .font(
                            "Helvetica"
                        )
                        .fontSize(
                            9
                        )
                        .fillColor(
                            COLORS.muted
                        )
                        .text(

                            `Financial Year : ${financialYear}`,

                            left,
                            y

                        );


                    // -----------------------------------------
                    // PERIOD
                    // -----------------------------------------

                    document
                        .text(

                            `Period : ${reportPeriod}`,

                            left +
                            usableWidth -
                            100,

                            y,

                            {

                                width:
                                    100,

                                align:
                                    "right"

                            }

                        );


                    y +=
                        18;


                    // -----------------------------------------
                    // SEPARATOR
                    // -----------------------------------------

                    document
                        .moveTo(
                            left,
                            y
                        )
                        .lineTo(
                            left +
                            usableWidth,
                            y
                        )
                        .lineWidth(
                            0.8
                        )
                        .strokeColor(
                            COLORS.border
                        )
                        .stroke();


                    y +=
                        16;

                };


            // =================================================
            // REPORT SUMMARY
            // =================================================

           // =================================================
// REPORT SUMMARY
// =================================================

const drawSummary =
    () => {

        // -----------------------------------------
        // SUMMARY HEIGHT
        // -----------------------------------------

        const summaryHeight = 62;


        // -----------------------------------------
        // BACKGROUND
        // -----------------------------------------

        document
            .save()
            .roundedRect(
                left,
                y,
                usableWidth,
                summaryHeight,
                6
            )
            .fillColor(
                COLORS.grayBg
            )
            .fill()
            .lineWidth(
                0.8
            )
            .strokeColor(
                COLORS.lightBorder
            )
            .stroke()
            .restore();


        // -----------------------------------------
        // TITLE
        // -----------------------------------------

        document
            .font(
                "Helvetica-Bold"
            )
            .fontSize(
                9
            )
            .fillColor(
                COLORS.blue
            )
            .text(

                "REPORT SUMMARY",

                left + 12,
                y + 9

            );


        // -----------------------------------------
        // SUMMARY CONTENT POSITION
        // -----------------------------------------

        const summaryY =
            y + 31;


        // -----------------------------------------
        // FOUR EQUAL COLUMNS
        // -----------------------------------------

        const gap = 8;

        const summaryColumnWidth =
            (
                usableWidth -
                24 -
                gap * 3
            ) / 4;


        const col1 =
            left + 12;

        const col2 =
            col1 +
            summaryColumnWidth +
            gap;

        const col3 =
            col2 +
            summaryColumnWidth +
            gap;

        const col4 =
            col3 +
            summaryColumnWidth +
            gap;


        // -----------------------------------------
        // REPORT TYPE
        // -----------------------------------------

        document
            .font(
                "Helvetica"
            )
            .fontSize(
                8.5
            )
            .fillColor(
                COLORS.text
            )
            .text(

                `Report Type : ${
                    isGeneral
                        ? "General"
                        : "Special"
                }`,

                col1,
                summaryY,

                {
                    width:
                        summaryColumnWidth,

                    align:
                        "left",

                    lineBreak:
                        false

                }

            );


        // -----------------------------------------
        // FINANCIAL YEAR
        // -----------------------------------------

        document
            .font(
                "Helvetica"
            )
            .fontSize(
                8.5
            )
            .fillColor(
                COLORS.text
            )
            .text(

                `Financial Year : ${financialYear}`,

                col2,
                summaryY,

                {
                    width:
                        summaryColumnWidth,

                    align:
                        "left",

                    lineBreak:
                        false

                }

            );


        // -----------------------------------------
        // PERIOD
        // -----------------------------------------

        document
            .font(
                "Helvetica"
            )
            .fontSize(
                8.5
            )
            .fillColor(
                COLORS.text
            )
            .text(

                `Period : ${reportPeriod}`,

                col3,
                summaryY,

                {
                    width:
                        summaryColumnWidth,

                    align:
                        "left",

                    lineBreak:
                        false

                }

            );


        // -----------------------------------------
        // GENERATED DATE
        // -----------------------------------------

        document
            .font(
                "Helvetica"
            )
            .fontSize(
                8.5
            )
            .fillColor(
                COLORS.text
            )
            .text(

                `Generated On : ${
                    new Date()
                        .toLocaleDateString(
                            "en-GB"
                        )
                }`,

                col4,
                summaryY,

                {
                    width:
                        summaryColumnWidth,

                    align:
                        "left",

                    lineBreak:
                        false

                }

            );


        // -----------------------------------------
        // MOVE Y
        // -----------------------------------------

        y +=
            summaryHeight +
            18;

    };

            // =================================================
            // SECTION TITLE
            // =================================================

            const drawSectionTitle =
                () => {

                    document
                        .font(
                            "Helvetica-Bold"
                        )
                        .fontSize(
                            11
                        )
                        .fillColor(
                            COLORS.navy
                        )
                        .text(

                            "DEPARTMENT-WISE USI PERFORMANCE",

                            left,
                            y

                        );


                    y +=
                        16;


                    document
                        .font(
                            "Helvetica"
                        )
                        .fontSize(
                            8
                        )
                        .fillColor(
                            COLORS.muted
                        )
                        .text(

                            "User Satisfaction Index performance across departments and evaluation periods.",

                            left,
                            y

                        );


                    y +=
                        20;

                };


            // =================================================
            // CELL TEXT
            // =================================================

            const drawCellText =
                (
                    value,
                    x,
                    top,
                    width,
                    height,
                    bold = false,
                    align = "center"
                ) => {

                    document
                        .font(

                            bold
                                ? "Helvetica-Bold"
                                : "Helvetica"

                        )
                        .fontSize(
                            8.5
                        )
                        .fillColor(
                            COLORS.text
                        )
                        .text(

                            safeValue(
                                value
                            ),

                            x + 7,
                            top + 8,

                            {

                                width:
                                    width - 14,

                                height:
                                    height - 10,

                                align,

                                ellipsis:
                                    true

                            }

                        );

                };


            // =================================================
            // TABLE HEADER
            // =================================================

            const drawTableHeader =
                () => {

                    let x =
                        left;


                    headers.forEach(
                        (
                            header,
                            index
                        ) => {

                            // ---------------------------------
                            // HEADER BACKGROUND
                            // ---------------------------------

                            document
                                .rect(
                                    x,
                                    y,
                                    columnWidths[index],
                                    headerHeight
                                )
                                .fillColor(
                                    COLORS.navy
                                )
                                .fill();


                            // ---------------------------------
                            // HEADER BORDER
                            // ---------------------------------

                            document
                                .rect(
                                    x,
                                    y,
                                    columnWidths[index],
                                    headerHeight
                                )
                                .lineWidth(
                                    0.8
                                )
                                .strokeColor(
                                    COLORS.white
                                )
                                .stroke();


                            // ---------------------------------
                            // HEADER TEXT
                            // ---------------------------------

                            drawCellText(

                                header,

                                x,
                                y,

                                columnWidths[index],

                                headerHeight,

                                true,

                                index === 0
                                    ? "left"
                                    : "center"

                            );


                            x +=
                                columnWidths[index];

                        }
                    );


                    y +=
                        headerHeight;

                };


            // =================================================
            // DATA ROW
            // =================================================

            const drawDataRow =
                (
                    row,
                    bold = false,
                    average = false
                ) => {

                    // -----------------------------------------
                    // PAGE BREAK
                    // -----------------------------------------

                    if (
                        y +
                        rowHeight >
                        pageHeight -
                        document.page.margins.bottom
                    ) {

                        document.addPage();


                        y =
                            36;


                        drawCompanyHeader();

                        drawReportTitle();

                        drawTableHeader();

                    }


                    let x =
                        left;


                    row.forEach(
                        (
                            value,
                            index
                        ) => {

                            // ---------------------------------
                            // CELL BACKGROUND
                            // ---------------------------------

                            if (
                                average
                            ) {

                                document
                                    .rect(
                                        x,
                                        y,
                                        columnWidths[index],
                                        rowHeight
                                    )
                                    .fillColor(
                                        COLORS.blueLight
                                    )
                                    .fill();

                            }


                            // ---------------------------------
                            // FULL GRID BORDER
                            //
                            // Vertical + Horizontal
                            // ---------------------------------

                            document
                                .rect(
                                    x,
                                    y,
                                    columnWidths[index],
                                    rowHeight
                                )
                                .lineWidth(
                                    average
                                        ? 1.1
                                        : 0.6
                                )
                                .strokeColor(
                                    average
                                        ? "#9fb2c9"
                                        : COLORS.border
                                )
                                .stroke();


                            // ---------------------------------
                            // CELL TEXT
                            // ---------------------------------

                            drawCellText(

                                value,

                                x,
                                y,

                                columnWidths[index],

                                rowHeight,

                                bold,

                                index === 0
                                    ? "left"
                                    : "center"

                            );


                            x +=
                                columnWidths[index];

                        }
                    );


                    y +=
                        rowHeight;

                };


            // =================================================
            // FOOTER
            // =================================================

            const drawFooter =
                () => {

                    y +=
                        12;


                    document
                        .font(
                            "Helvetica"
                        )
                        .fontSize(
                            8
                        )
                        .fillColor(
                            COLORS.muted
                        )
                        .text(

                            "User Satisfaction Index (USI)",

                            left,
                            y,

                            {

                                width:
                                    usableWidth,

                                align:
                                    "left"

                            }

                        );

                };


            // =================================================
            // DRAW COMPLETE REPORT
            // =================================================

            drawCompanyHeader();


            drawReportTitle();


            drawSummary();


            drawSectionTitle();


            drawTableHeader();


            // =================================================
            // DATA
            // =================================================

            prepared.rows.forEach(
                row => {

                    drawDataRow(
                        row
                    );

                }
            );


            // =================================================
            // AVERAGE
            // =================================================

            drawDataRow(

                prepared.averageRow,

                true,

                true

            );


            // =================================================
            // FOOTER
            // =================================================

            drawFooter();


            // =================================================
            // PAGE NUMBERS
            // =================================================

            const pageRange =
                document.bufferedPageRange();


            for (
                let i = 0;
                i < pageRange.count;
                i++
            ) {

                document.switchToPage(
                    pageRange.start +
                    i
                );


                document
                    .font(
                        "Helvetica"
                    )
                    .fontSize(
                        7.5
                    )
                    .fillColor(
                        COLORS.muted
                    )
                    .text(

                        `Page ${
                            i + 1
                        } of ${
                            pageRange.count
                        }`,

                        left,
                        pageHeight -
                        28,

                        {

                            width:
                                usableWidth,

                            align:
                                "right"

                        }

                    );

            }


            document.end();

        }
    );

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
        // EVALUATED DEPARTMENTS
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
            this.buildDepartmentMap(
                targetDepartments
            );


        // =================================================
        // SPECIAL SCORES
        //
        // IMPORTANT:
        //
        // Use evaluator_department_id.
        // =================================================

        const specialScores =
            new Map();


        for (
            const row
            of rows
        ) {

            const departmentId =
                Number(
                    row.evaluator_department_id
                );


            if (
                !departmentMap.has(
                    departmentId
                )
            ) {

                continue;

            }


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


        const departments =
            Array.from(
                departmentMap.values()
            );


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

            _user:
                user,

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


// =====================================================
// EXPORT SERVICE INSTANCE
// =====================================================

module.exports =
    new HodReportExportService();