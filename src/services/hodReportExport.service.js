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

    async generateExcel(
        report
    ) {

        if (
            !report
        ) {

            throw new ApiError(
                400,
                "Report data is required."
            );

        }


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


        const workbook =
            new ExcelJS.Workbook();


        workbook.creator =
            "User Satisfaction Index";


        workbook.created =
            new Date();


        workbook.modified =
            new Date();


        const worksheet =
            workbook.addWorksheet(
                "Evaluation Report"
            );


        const columnCount =
            prepared.headers.length;


        // =================================================
        // PAGE SETUP
        // =================================================

        worksheet.pageSetup = {

            orientation:
                columnCount > 5
                    ? "landscape"
                    : "portrait",

            paperSize:
                9,

            fitToPage:
                true,

            fitToWidth:
                1,

            fitToHeight:
                0

        };


        worksheet.pageMargins = {

            left:
                0.30,

            right:
                0.30,

            top:
                0.50,

            bottom:
                0.50,

            header:
                0.20,

            footer:
                0.20

        };


        worksheet.pageSetup.horizontalCentered =
            true;


        // =================================================
        // TITLE
        // =================================================

        worksheet.mergeCells(
            1,
            1,
            1,
            columnCount
        );


        const titleCell =
            worksheet.getCell(
                1,
                1
            );


        titleCell.value =
            prepared.title;


        titleCell.font = {

            name:
                "Arial",

            size:
                16,

            bold:
                true

        };


        titleCell.alignment = {

            horizontal:
                "center",

            vertical:
                "middle"

        };


        worksheet.getRow(1).height =
            28;


        // =================================================
        // FINANCIAL YEAR
        // =================================================

        worksheet.mergeCells(
            2,
            1,
            2,
            columnCount
        );


        const yearCell =
            worksheet.getCell(
                2,
                1
            );


        yearCell.value =
            `Financial Year: ${prepared.financialYear}`;


        yearCell.font = {

            name:
                "Arial",

            size:
                10,

            bold:
                true

        };


        yearCell.alignment = {

            horizontal:
                "left",

            vertical:
                "middle"

        };


        worksheet.getRow(2).height =
            20;


        // =================================================
        // PERIOD
        // =================================================

        worksheet.mergeCells(
            3,
            1,
            3,
            columnCount
        );


        const periodCell =
            worksheet.getCell(
                3,
                1
            );


        periodCell.value =
            `Period: ${prepared.period}`;


        periodCell.font = {

            name:
                "Arial",

            size:
                10

        };


        periodCell.alignment = {

            horizontal:
                "left",

            vertical:
                "middle"

        };


        worksheet.getRow(3).height =
            20;


        // =================================================
        // HEADER
        // =================================================

        const headerRow =
            worksheet.getRow(5);


        prepared.headers.forEach(
            (
                header,
                index
            ) => {

                const cell =
                    headerRow.getCell(
                        index + 1
                    );


                cell.value =
                    header;


                cell.font = {

                    name:
                        "Arial",

                    size:
                        10,

                    bold:
                        true

                };


                cell.alignment = {

                    horizontal:
                        index === 0
                            ? "left"
                            : "center",

                    vertical:
                        "middle"

                };


                cell.border = {

                    top: {

                        style:
                            "thin"

                    },

                    bottom: {

                        style:
                            "thin"

                    },

                    left: {

                        style:
                            "thin"

                    },

                    right: {

                        style:
                            "thin"

                    }

                };

            }
        );


        headerRow.height =
            24;


        // =================================================
        // DATA ROWS
        // =================================================

        prepared.rows.forEach(
            row => {

                const excelRow =
                    worksheet.addRow(
                        row
                    );


                excelRow.eachCell(
                    (
                        cell,
                        index
                    ) => {

                        cell.font = {

                            name:
                                "Arial",

                            size:
                                10

                        };


                        cell.alignment = {

                            horizontal:
                                index === 1
                                    ? "left"
                                    : "center",

                            vertical:
                                "middle"

                        };


                        cell.border = {

                            top: {

                                style:
                                    "thin"

                            },

                            bottom: {

                                style:
                                    "thin"

                            },

                            left: {

                                style:
                                    "thin"

                            },

                            right: {

                                style:
                                    "thin"

                            }

                        };


                        if (
                            typeof cell.value ===
                            "number"
                        ) {

                            cell.numFmt =
                                "0.00";

                        }

                    }
                );


                excelRow.height =
                    22;

            }
        );


        // =================================================
        // SEPARATOR + AVERAGE ROW
        // =================================================

        const averageRow =
            worksheet.addRow(
                prepared.averageRow
            );


        averageRow.eachCell(
            (
                cell,
                index
            ) => {

                cell.font = {

                    name:
                        "Arial",

                    size:
                        10,

                    bold:
                        true

                };


                cell.alignment = {

                    horizontal:
                        index === 1
                            ? "left"
                            : "center",

                    vertical:
                        "middle"

                };


                cell.border = {

                    top: {

                        style:
                            "medium"

                    },

                    bottom: {

                        style:
                            "medium"

                    },

                    left: {

                        style:
                            "thin"

                    },

                    right: {

                        style:
                            "thin"

                    }

                };


                if (
                    typeof cell.value ===
                    "number"
                ) {

                    cell.numFmt =
                        "0.00";

                }

            }
        );


        averageRow.height =
            24;


        // =================================================
        // COLUMN WIDTHS
        // =================================================

        if (
            prepared.headers.length === 6
        ) {

            worksheet.columns = [

                {
                    width:
                        30
                },

                {
                    width:
                        14
                },

                {
                    width:
                        14
                },

                {
                    width:
                        14
                },

                {
                    width:
                        14
                },

                {
                    width:
                        20
                }

            ];

        }

        else if (
            prepared.headers.length === 2
        ) {

            worksheet.columns = [

                {
                    width:
                        35
                },

                {
                    width:
                        20
                }

            ];

        }

        else {

            worksheet.columns =
                prepared.headers.map(
                    (
                        header,
                        index
                    ) => ({

                        width:
                            index === 0
                                ? 30
                                : 18

                    })
                );

        }


        // =================================================
        // FREEZE HEADER
        // =================================================

        worksheet.views = [

            {

                state:
                    "frozen",

                ySplit:
                    5

            }

        ];


        // =================================================
        // PRINT AREA
        // =================================================

        const lastRow =
            worksheet.lastRow?.number || 1;


        const lastColumnLetter =
            this.getExcelColumnLetter(
                columnCount
            );


        worksheet.pageSetup.printArea =
            `A1:${lastColumnLetter}${lastRow}`;


        // =================================================
        // FOOTER
        // =================================================

        worksheet.headerFooter.oddFooter =
            "User Satisfaction Index | Page &P of &N";


        // =================================================
        // RETURN BUFFER
        // =================================================

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

    async generatePdf(
        report
    ) {

        if (
            !report
        ) {

            throw new ApiError(
                400,
                "Report data is required."
            );

        }


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

                const isYearly =
                    prepared.headers.length === 6;


                const doc =
                    new PDFDocument({

                        size:
                            "A4",

                        layout:
                            isYearly
                                ? "landscape"
                                : "portrait",

                        margins: {

                            top:
                                40,

                            bottom:
                                40,

                            left:
                                36,

                            right:
                                36

                        },

                        bufferPages:
                            true

                    });


                const chunks = [];


                doc.on(
                    "data",
                    chunk =>
                        chunks.push(
                            chunk
                        )
                );


                doc.on(
                    "end",
                    () =>
                        resolve(
                            Buffer.concat(
                                chunks
                            )
                        )
                );


                doc.on(
                    "error",
                    reject
                );


                const pageWidth =
                    doc.page.width;


                const pageHeight =
                    doc.page.height;


                const left =
                    doc.page.margins.left;


                const right =
                    doc.page.margins.right;


                const usableWidth =
                    pageWidth -
                    left -
                    right;


                // =================================================
                // COLUMN WIDTHS
                // =================================================

                let columnWidths;


                if (
                    isYearly
                ) {

                    const firstWidth =
                        usableWidth * 0.30;


                    const otherWidth =
                        (
                            usableWidth -
                            firstWidth
                        ) / 5;


                    columnWidths = [

                        firstWidth,

                        otherWidth,

                        otherWidth,

                        otherWidth,

                        otherWidth,

                        otherWidth

                    ];

                }

                else {

                    columnWidths = [

                        usableWidth * 0.60,

                        usableWidth * 0.40

                    ];

                }


                const titleHeight =
                    25;


                const metaHeight =
                    18;


                const headerHeight =
                    30;


                const rowHeight =
                    27;


                let y =
                    38;


                // =================================================
                // TITLE
                // =================================================

                const drawTitle =
                    () => {

                        doc
                            .font(
                                "Helvetica-Bold"
                            )
                            .fontSize(
                                16
                            )
                            .fillColor(
                                "#172033"
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
                            titleHeight;


                        doc
                            .font(
                                "Helvetica-Bold"
                            )
                            .fontSize(
                                9.5
                            )
                            .fillColor(
                                "#3f4d63"
                            )
                            .text(

                                `Financial Year: ${prepared.financialYear}`,

                                left,

                                y,

                                {

                                    width:
                                        usableWidth,

                                    align:
                                        "left"

                                }

                            );


                        y +=
                            metaHeight;


                        doc
                            .font(
                                "Helvetica"
                            )
                            .fontSize(
                                9
                            )
                            .fillColor(
                                "#56647a"
                            )
                            .text(

                                `Period: ${prepared.period}`,

                                left,

                                y,

                                {

                                    width:
                                        usableWidth,

                                    align:
                                        "left"

                                }

                            );


                        y +=
                            22;

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
                        bold = false
                    ) => {

                        const text =
                            value === null ||
                            value === undefined ||
                            value === ""
                                ? "-"
                                : String(
                                    value
                                );


                        doc
                            .font(
                                bold
                                    ? "Helvetica-Bold"
                                    : "Helvetica"
                            )
                            .fontSize(
                                9
                            )
                            .fillColor(
                                "#18263d"
                            )
                            .text(

                                text,

                                x + 6,

                                top + 8,

                                {

                                    width:
                                        width - 12,

                                    height:
                                        height - 8,

                                    align:
                                        x === left
                                            ? "left"
                                            : "center"

                                }

                            );

                    };


                // =================================================
                // HEADER
                // =================================================

                const drawHeader =
                    () => {

                        let x =
                            left;


                        prepared.headers.forEach(
                            (
                                header,
                                index
                            ) => {

                                doc
                                    .rect(

                                        x,

                                        y,

                                        columnWidths[index],

                                        headerHeight

                                    )
                                    .fillColor(
                                        "#eef3f8"
                                    )
                                    .fill();


                                doc
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
                                        "#aeb9c7"
                                    )
                                    .stroke();


                                drawCellText(

                                    header,

                                    x,

                                    y,

                                    columnWidths[index],

                                    headerHeight,

                                    true

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
                        separator = false
                    ) => {

                        if (
                            y +
                            rowHeight >
                            pageHeight -
                            doc.page.margins.bottom
                        ) {

                            doc.addPage();


                            y =
                                38;


                            drawTitle();


                            drawHeader();

                        }


                        if (
                            separator
                        ) {

                            y +=
                                3;

                        }


                        let x =
                            left;


                        row.forEach(
                            (
                                value,
                                index
                            ) => {

                                doc
                                    .rect(

                                        x,

                                        y,

                                        columnWidths[index],

                                        rowHeight

                                    )
                                    .lineWidth(
                                        separator
                                            ? 1.2
                                            : 0.6
                                    )
                                    .strokeColor(
                                        separator
                                            ? "#9aa7b7"
                                            : "#d5dde7"
                                    )
                                    .stroke();


                                drawCellText(

                                    value,

                                    x,

                                    y,

                                    columnWidths[index],

                                    rowHeight,

                                    bold

                                );


                                x +=
                                    columnWidths[index];

                            }
                        );


                        y +=
                            rowHeight;

                    };


                // =================================================
                // DRAW
                // =================================================

                drawTitle();


                drawHeader();


                prepared.rows.forEach(
                    row =>
                        drawDataRow(
                            row
                        )
                );


                drawDataRow(

                    prepared.averageRow,

                    true,

                    true

                );


                y +=
                    12;


                doc
                    .font(
                        "Helvetica"
                    )
                    .fontSize(
                        8
                    )
                    .fillColor(
                        "#7b8798"
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


                doc.end();

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