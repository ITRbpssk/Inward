const adminReportExportRepository =
    require("../repositories/adminReportExport.repository");


const feedbackService =
    require("./feedback.service");


const ApiError =
    require("../utils/ApiError");


class AdminReportExportService {


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
    // NORMALIZE SPECIAL PERIOD
    // =====================================================

    normalizeSpecialPeriod(
        period
    ) {

        const value =
            String(
                period || "ALL"
            )
                .trim();


        if (
            value.toUpperCase() ===
            "ALL"
        ) {

            return "ALL";

        }


        if (
            !/^SPECIAL\s+\d+$/i
                .test(value)
        ) {

            throw new ApiError(
                400,
                "Invalid special period. Use ALL or Special 1, Special 2, etc."
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
    // null values are ignored.
    //
    // Example:
    //
    // 80, 90, null
    //
    // = 85
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
    // CREATE GENERAL DEPARTMENT
    // =====================================================

    createGeneralDepartment(
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
    // GET GENERAL EXPORT DATA
    // =====================================================

    async getGeneralExportData(
        financialYear,
        period = "YEARLY"
    ) {

        const year =
            this.validateFinancialYear(
                financialYear
            );


        const selectedPeriod =
            this.normalizeGeneralPeriod(
                period
            );


        const departments =
            await adminReportExportRepository
                .getActiveDepartments();


        const rows =
            await adminReportExportRepository
                .getGeneralExportSource(
                    year,
                    selectedPeriod
                );


        const scoreMap =
            await this.buildScoreMap(
                rows
            );


        const departmentMap =
            new Map();


        // =================================================
        // CREATE ALL DEPARTMENTS
        // =================================================

        for (
            const department
            of departments
        ) {

            departmentMap.set(

                Number(
                    department.department_id
                ),

                this.createGeneralDepartment(
                    department
                )

            );

        }


        // =================================================
        // GROUP:
        //
        // TARGET DEPARTMENT + QUARTER
        // =================================================

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


        // =================================================
        // APPLY QUARTER SCORES
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


        const resultDepartments =
            [
                ...departmentMap.values()
            ];


        // =================================================
        // YEARLY AVERAGE
        //
        // Only for YEARLY export.
        // =================================================

        if (
            selectedPeriod ===
            "YEARLY"
        ) {

            for (
                const department
                of resultDepartments
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


        return {

            report_type:
                "admin_general",

            financial_year:
                year,

            report_period:
                selectedPeriod,

            departments:
                resultDepartments

        };

    }


    // =====================================================
    // GET SPECIAL EXPORT DATA
    // =====================================================

    async getSpecialExportData(
        financialYear,
        period = "ALL"
    ) {

        const year =
            this.validateFinancialYear(
                financialYear
            );


        const selectedPeriod =
            this.normalizeSpecialPeriod(
                period
            );


        const surveys =
            await adminReportExportRepository
                .getSpecialSurveys(
                    year
                );


        // =================================================
        // SPECIAL LABELS
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
        // SELECT SPECIAL SURVEY
        // =================================================

        let selectedSurveyId =
            null;


        if (
            selectedPeriod !==
            "ALL"
        ) {

            const selectedSurvey =
                specialSurveys.find(
                    survey =>
                        survey.label
                            .toUpperCase() ===
                        selectedPeriod
                            .toUpperCase()
                );


            if (
                !selectedSurvey
            ) {

                throw new ApiError(
                    400,
                    `Invalid special report period: ${period}`
                );

            }


            selectedSurveyId =
                selectedSurvey.survey_id;

        }


        const rows =
            await adminReportExportRepository
                .getSpecialExportSource(
                    year,
                    selectedSurveyId
                );


        const departments =
            await adminReportExportRepository
                .getActiveDepartments();


        const scoreMap =
            await this.buildScoreMap(
                rows
            );


        const selectedSurveys =
            selectedSurveyId === null

                ? specialSurveys

                : specialSurveys.filter(
                    survey =>
                        Number(
                            survey.survey_id
                        ) ===
                        Number(
                            selectedSurveyId
                        )
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
                of selectedSurveys
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


        // =================================================
        // GROUP:
        //
        // TARGET DEPARTMENT + SPECIAL SURVEY
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
                selectedSurveys.find(
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
                selectedSurveys.find(
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


        return {

            report_type:
                "admin_special",

            financial_year:
                year,

            report_period:
                selectedPeriod,

            special_surveys:
                selectedSurveys,

            departments:
                [
                    ...departmentMap.values()
                ]

        };

    }


    // =====================================================
    // EXCEL GENERATOR
    //
    // Requires:
    //
    // npm install exceljs
    // =====================================================

    async generateExcel(
        report
    ) {

        const ExcelJS =
            require("exceljs");


        const workbook =
            new ExcelJS.Workbook();


        const worksheet =
            workbook.addWorksheet(
                "Report"
            );


        // =================================================
        // GENERAL
        // =================================================

        if (
            report.report_type ===
            "admin_general"
        ) {

            const period =
                report.report_period;


            let headers;


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


            worksheet.addRow(
                [
                    `ADMIN GENERAL REPORT - ${report.financial_year}`
                ]
            );


            worksheet.mergeCells(
                1,
                1,
                1,
                headers.length
            );


            worksheet.getRow(
                1
            ).font = {

                bold: true,
                size: 16

            };


            worksheet.addRow(
                headers
            );


            worksheet.getRow(
                2
            ).font = {

                bold: true

            };


            for (
                const department
                of report.departments
            ) {

                const row = [

                    department.department_name

                ];


                if (
                    period ===
                    "YEARLY"
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
                        department.yearly_average ??
                        "-"
                    );

                } else {

                    row.push(
                        department[period] ??
                        "-"
                    );

                }


                worksheet.addRow(
                    row
                );

            }

        }


        // =================================================
        // SPECIAL
        // =================================================

        else if (
            report.report_type ===
            "admin_special"
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


            worksheet.addRow(
                [
                    `ADMIN SPECIAL REPORT - ${report.financial_year}`
                ]
            );


            worksheet.mergeCells(
                1,
                1,
                1,
                headers.length
            );


            worksheet.getRow(
                1
            ).font = {

                bold: true,
                size: 16

            };


            worksheet.addRow(
                headers
            );


            worksheet.getRow(
                2
            ).font = {

                bold: true

            };


            for (
                const department
                of report.departments
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


                worksheet.addRow(
                    row
                );

            }

        }


        else {

            throw new ApiError(
                400,
                "Unsupported report type."
            );

        }


        // =================================================
        // COLUMN WIDTH
        // =================================================

        worksheet.columns.forEach(
            column => {

                let maxLength =
                    12;


                column.eachCell(
                    cell => {

                        const value =
                            String(
                                cell.value ??
                                ""
                            );


                        maxLength =
                            Math.max(
                                maxLength,
                                value.length + 2
                            );

                    }
                );


                column.width =
                    Math.min(
                        maxLength,
                        30
                    );

            }
        );


        // =================================================
        // RETURN BUFFER
        // =================================================

        return await workbook.xlsx
            .writeBuffer();

    }


    // =====================================================
    // PDF GENERATOR
    //
    // Requires:
    //
    // npm install pdfkit
    // =====================================================

    async generatePdf(
        report
    ) {

        const PDFDocument =
            require("pdfkit");


        return new Promise(
            (
                resolve,
                reject
            ) => {

                const document =
                    new PDFDocument({

                        size: "A4",
                        layout: "landscape",
                        margin: 30

                    });


                const chunks = [];


                document.on(
                    "data",
                    chunk => {

                        chunks.push(
                            chunk
                        );

                    }
                );


                document.on(
                    "end",
                    () => {

                        resolve(
                            Buffer.concat(
                                chunks
                            )
                        );

                    }
                );


                document.on(
                    "error",
                    reject
                );


                // =================================================
                // TITLE
                // =================================================

                const title =
                    report.report_type ===
                    "admin_general"

                        ? "ADMIN GENERAL REPORT"

                        : "ADMIN SPECIAL REPORT";


                document
                    .fontSize(16)
                    .font("Helvetica-Bold")
                    .text(
                        title,
                        {
                            align: "center"
                        }
                    );


                document
                    .moveDown(0.5);


                document
                    .fontSize(10)
                    .font("Helvetica")
                    .text(
                        `Financial Year: ${report.financial_year}`
                    );


                document
                    .text(
                        `Period: ${report.report_period}`
                    );


                document
                    .moveDown(1);


                // =================================================
                // PREPARE HEADERS
                // =================================================

                let headers;


                if (
                    report.report_type ===
                    "admin_general"
                ) {

                    if (
                        report.report_period ===
                        "YEARLY"
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
                            report.report_period

                        ];

                    }

                } else {

                    headers = [

                        "Department",

                        ...(report.special_surveys || [])
                            .map(
                                special =>
                                    special.label
                            )

                    ];

                }


                // =================================================
                // COLUMN WIDTHS
                // =================================================

                const pageWidth =
                    document.page.width -
                    document.page.margins.left -
                    document.page.margins.right;


                const columnWidth =
                    pageWidth /
                    headers.length;


                const startX =
                    document.page.margins.left;


                let currentY =
                    document.y;


                // =================================================
                // DRAW HEADER
                // =================================================

                document
                    .font(
                        "Helvetica-Bold"
                    )
                    .fontSize(9);


                headers.forEach(
                    (
                        header,
                        index
                    ) => {

                        document.text(

                            header,

                            startX +
                            (
                                index *
                                columnWidth
                            ),

                            currentY,

                            {

                                width:
                                    columnWidth,

                                align:
                                    index === 0
                                        ? "left"
                                        : "center"

                            }

                        );

                    }
                );


                currentY += 22;


                // =================================================
                // DRAW ROWS
                // =================================================

                document
                    .font(
                        "Helvetica"
                    )
                    .fontSize(8);


                for (
                    const department
                    of report.departments
                ) {

                    let values;


                    if (
                        report.report_type ===
                        "admin_general"
                    ) {

                        if (
                            report.report_period ===
                            "YEARLY"
                        ) {

                            values = [

                                department.department_name,

                                department.Q1 ??
                                    "-",

                                department.Q2 ??
                                    "-",

                                department.Q3 ??
                                    "-",

                                department.Q4 ??
                                    "-",

                                department.yearly_average ??
                                    "-"

                            ];

                        } else {

                            values = [

                                department.department_name,

                                department[
                                    report.report_period
                                ] ??
                                    "-"

                            ];

                        }

                    } else {

                        values = [

                            department.department_name,

                            ...(report.special_surveys || [])
                                .map(
                                    special =>
                                        department[
                                            special.label
                                        ] ??
                                        "-"
                                )

                        ];

                    }


                    values.forEach(
                        (
                            value,
                            index
                        ) => {

                            document.text(

                                String(
                                    value
                                ),

                                startX +
                                (
                                    index *
                                    columnWidth
                                ),

                                currentY,

                                {

                                    width:
                                        columnWidth,

                                    align:
                                        index === 0
                                            ? "left"
                                            : "center"

                                }

                            );

                        }
                    );


                    currentY += 20;


                    // =================================================
                    // NEW PAGE
                    // =================================================

                    if (
                        currentY >
                        document.page.height - 40
                    ) {

                        document.addPage();


                        currentY =
                            document.page.margins.top;

                    }

                }


                document.end();

            }
        );

    }

}


module.exports =
    new AdminReportExportService();