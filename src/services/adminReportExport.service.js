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
            "Report",
            {
                pageSetup: {
                    orientation: "landscape",
                    fitToPage: true,
                    fitToWidth: 1,
                    fitToHeight: 0
                }
            }
        );


    // =====================================================
    // COMMON STYLES
    // =====================================================

    const borderStyle = {

        top: {
            style: "thin"
        },

        left: {
            style: "thin"
        },

        bottom: {
            style: "thin"
        },

        right: {
            style: "thin"
        }

    };


    const titleFont = {

        bold: true,
        size: 18

    };


    const subtitleFont = {

        bold: true,
        size: 13

    };


    const sectionFont = {

        bold: true,
        size: 12

    };


    const headerFont = {

        bold: true,
        size: 11

    };


    // =====================================================
    // REPORT TYPE
    // =====================================================

    const isGeneral =
        report.report_type ===
        "admin_general";


    const isSpecial =
        report.report_type ===
        "admin_special";


    if (
        !isGeneral &&
        !isSpecial
    ) {

        throw new ApiError(
            400,
            "Unsupported report type."
        );

    }


    // =====================================================
    // DETERMINE HEADERS
    // =====================================================

    let headers = [];


    if (isGeneral) {

        const period =
            String(
                report.report_period ||
                "YEARLY"
            )
                .trim()
                .toUpperCase();


        if (
            period ===
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

                period

            ];

        }

    }


    else if (isSpecial) {

        const specials =
            report.special_surveys ||
            [];


        headers = [

            "Department",

            ...specials.map(
                special =>
                    special.label
            )

        ];

    }


    // =====================================================
    // COMPANY HEADER
    // =====================================================

    const totalColumns =
        headers.length;


    worksheet.mergeCells(
        1,
        1,
        1,
        totalColumns
    );


    worksheet.getCell(
        "A1"
    ).value =
        "RAJARAMBAPU PATIL SAHAKARI";


    worksheet.getCell(
        "A1"
    ).font = {

        bold: true,
        size: 18

    };


    worksheet.getCell(
        "A1"
    ).alignment = {

        horizontal: "center",
        vertical: "middle"

    };


    worksheet.getRow(
        1
    ).height = 28;


    // =====================================================
    // COMPANY NAME - LINE 2
    // =====================================================

    worksheet.mergeCells(
        2,
        1,
        2,
        totalColumns
    );


    worksheet.getCell(
        "A2"
    ).value =
        "SAKHAR KARKHANA LTD.";


    worksheet.getCell(
        "A2"
    ).font = {

        bold: true,
        size: 16

    };


    worksheet.getCell(
        "A2"
    ).alignment = {

        horizontal: "center",
        vertical: "middle"

    };


    worksheet.getRow(
        2
    ).height = 25;


    // =====================================================
    // LOCATION
    // =====================================================

    worksheet.mergeCells(
        3,
        1,
        3,
        totalColumns
    );


    worksheet.getCell(
        "A3"
    ).value =
        "RAJARAMNAGAR";


    worksheet.getCell(
        "A3"
    ).font = {

        bold: true,
        size: 12

    };


    worksheet.getCell(
        "A3"
    ).alignment = {

        horizontal: "center",
        vertical: "middle"

    };


    worksheet.getRow(
        3
    ).height = 21;


    // =====================================================
    // REPORT TITLE
    // =====================================================

    worksheet.mergeCells(
        5,
        1,
        5,
        totalColumns
    );


    worksheet.getCell(
        "A5"
    ).value =
        isGeneral
            ? "ADMIN GENERAL REPORT"
            : "ADMIN SPECIAL REPORT";


    worksheet.getCell(
        "A5"
    ).font =
        titleFont;


    worksheet.getCell(
        "A5"
    ).alignment = {

        horizontal: "center",
        vertical: "middle"

    };


    worksheet.getRow(
        5
    ).height = 30;


    // =====================================================
    // FINANCIAL YEAR + PERIOD
    // =====================================================

    const financialYear =
        report.financial_year ||
        "-";


    const reportPeriod =
        report.report_period ||
        (isGeneral
            ? "YEARLY"
            : "ALL");


    worksheet.mergeCells(
        7,
        1,
        7,
        Math.max(
            1,
            Math.floor(
                totalColumns / 2
            )
        )
    );


    worksheet.mergeCells(
        7,
        Math.max(
            1,
            Math.floor(
                totalColumns / 2
            ) + 1
        ),
        7,
        totalColumns
    );


    const middleColumn =
        Math.max(
            1,
            Math.floor(
                totalColumns / 2
            )
        );


    worksheet.getCell(
        "A7"
    ).value =
        `Financial Year : ${financialYear}`;


    worksheet.getCell(
        `${String.fromCharCode(
            64 + middleColumn + 1
        )}7`
    ).value =
        `Period : ${reportPeriod}`;


    worksheet.getRow(
        7
    ).font = {

        bold: true,
        size: 11

    };


    worksheet.getRow(
        7
    ).alignment = {

        vertical: "middle"

    };


    // =====================================================
    // REPORT SUMMARY
    // =====================================================

    worksheet.mergeCells(
        9,
        1,
        9,
        totalColumns
    );


    worksheet.getCell(
        "A9"
    ).value =
        "REPORT SUMMARY";


    worksheet.getCell(
        "A9"
    ).font =
        sectionFont;


    worksheet.getRow(
        9
    ).height = 22;


    const summaryRows = [

        [
            "Report Type",
            isGeneral
                ? "General"
                : "Special"
        ],

        [
            "Financial Year",
            financialYear
        ],

        [
            "Period",
            reportPeriod
        ],

        [
            "Generated On",
            new Date()
                .toLocaleDateString(
                    "en-GB"
                )
        ]

    ];


    for (
        const summary
        of summaryRows
    ) {

        const row =
            worksheet.addRow(
                summary
            );


        row.getCell(
            1
        ).font = {

            bold: true

        };


        row.eachCell(
            cell => {

                cell.border =
                    borderStyle;

                cell.alignment = {

                    vertical: "middle"

                };

            }
        );

    }


    // =====================================================
    // PERFORMANCE SECTION
    // =====================================================

    const performanceTitleRow =
        worksheet.lastRow.number + 2;


    worksheet.mergeCells(
        performanceTitleRow,
        1,
        performanceTitleRow,
        totalColumns
    );


    worksheet.getCell(
        `A${performanceTitleRow}`
    ).value =
        isGeneral
            ? "DEPARTMENT-WISE USI PERFORMANCE"
            : "DEPARTMENT-WISE SPECIAL SURVEY PERFORMANCE";


    worksheet.getCell(
        `A${performanceTitleRow}`
    ).font =
        sectionFont;


    worksheet.getRow(
        performanceTitleRow
    ).height = 24;


    // =====================================================
    // TABLE HEADER
    // =====================================================

    const headerRowNumber =
        performanceTitleRow + 1;


    const headerRow =
        worksheet.getRow(
            headerRowNumber
        );


    headers.forEach(
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


            cell.font =
                headerFont;


            cell.alignment = {

                horizontal: "center",
                vertical: "middle",
                wrapText: true

            };


            cell.border =
                borderStyle;

        }
    );


    headerRow.height = 28;


    // =====================================================
    // DATA
    // =====================================================

    for (
        const department
        of report.departments || []
    ) {

        const row = [

            department.department_name

        ];


        if (isGeneral) {

            const period =
                String(
                    report.report_period ||
                    "YEARLY"
                )
                    .trim()
                    .toUpperCase();


            if (
                period ===
                "YEARLY"
            ) {

                row.push(
                    department.Q1 ??
                    "-"
                );


                row.push(
                    department.Q2 ??
                    "-"
                );


                row.push(
                    department.Q3 ??
                    "-"
                );


                row.push(
                    department.Q4 ??
                    "-"
                );


                row.push(
                    department.yearly_average ??
                    "-"
                );

            } else {

                row.push(
                    department[
                        period
                    ] ??
                    "-"
                );

            }

        }


        else if (isSpecial) {

            const specials =
                report.special_surveys ||
                [];


            for (
                const special
                of specials
            ) {

                row.push(

                    department[
                        special.label
                    ] ??
                    "-"

                );

            }

        }


        const excelRow =
            worksheet.addRow(
                row
            );


        excelRow.eachCell(
            (
                cell,
                index
            ) => {

                cell.border =
                    borderStyle;


                cell.alignment = {

                    vertical: "middle",
                    horizontal:
                        index === 1
                            ? "left"
                            : "center"

                };


                if (
                    index > 1
                ) {

                    cell.numFmt =
                        '0.00"%"';

                }

            }
        );


        excelRow.height = 22;

    }


    // =====================================================
    // YEARLY AVERAGE SECTION
    // =====================================================

    if (
        isGeneral &&
        String(
            report.report_period ||
            "YEARLY"
        )
            .toUpperCase() ===
        "YEARLY"
    ) {

        const averageTitleRow =
            worksheet.lastRow.number + 2;


        worksheet.mergeCells(
            averageTitleRow,
            1,
            averageTitleRow,
            totalColumns
        );


        worksheet.getCell(
            `A${averageTitleRow}`
        ).value =
            "YEARLY AVERAGE";


        worksheet.getCell(
            `A${averageTitleRow}`
        ).font =
            sectionFont;


        const averageHeaderRow =
            worksheet.getRow(
                averageTitleRow + 1
            );


        averageHeaderRow.values = [

            "Department",

            "Yearly Average"

        ];


        averageHeaderRow.eachCell(
            cell => {

                cell.font =
                    headerFont;


                cell.border =
                    borderStyle;


                cell.alignment = {

                    horizontal: "center",
                    vertical: "middle"

                };

            }
        );


        for (
            const department
            of report.departments || []
        ) {

            if (
                department.yearly_average !==
                null &&
                department.yearly_average !==
                undefined
            ) {

                const averageRow =
                    worksheet.addRow([

                        department.department_name,

                        department.yearly_average

                    ]);


                averageRow.eachCell(
                    (
                        cell,
                        index
                    ) => {

                        cell.border =
                            borderStyle;


                        cell.alignment = {

                            horizontal:
                                index === 1
                                    ? "left"
                                    : "center",

                            vertical:
                                "middle"

                        };


                        if (
                            index === 2
                        ) {

                            cell.numFmt =
                                '0.00"%"';

                        }

                    }
                );

            }

        }

    }


    // =====================================================
    // FOOTER
    // =====================================================

    const footerRow =
        worksheet.lastRow.number + 3;


    worksheet.mergeCells(
        footerRow,
        1,
        footerRow,
        totalColumns
    );


    worksheet.getCell(
        `A${footerRow}`
    ).value =
        "Report generated by User Satisfaction Index System";


    worksheet.getCell(
        `A${footerRow}`
    ).font = {

        italic: true,
        size: 10

    };


    worksheet.getCell(
        `A${footerRow}`
    ).alignment = {

        horizontal: "center",
        vertical: "middle"

    };


    // =====================================================
    // COLUMN WIDTH
    // =====================================================

    worksheet.columns.forEach(
        (
            column,
            index
        ) => {

            let maxLength =
                index === 1
                    ? 22
                    : 12;


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
                            value.length + 3
                        );

                }
            );


            column.width =
                Math.min(
                    maxLength,
                    index === 1
                        ? 35
                        : 20
                );

        }
    );


    // =====================================================
    // FREEZE HEADER
    // =====================================================

    worksheet.views = [

        {

            state: "frozen",

            ySplit:
                headerRowNumber

        }

    ];


    // =====================================================
    // PRINT SETTINGS
    // =====================================================

    worksheet.pageSetup = {

        orientation:
            "landscape",

        paperSize:
            worksheet.PAPER_A4,

        fitToPage:
            true,

        fitToWidth:
            1,

        fitToHeight:
            0

    };


    worksheet.pageSetup.horizontalCentered =
        true;


    worksheet.pageMargins = {

        left: 0.3,

        right: 0.3,

        top: 0.5,

        bottom: 0.5,

        header: 0.2,

        footer: 0.2

    };


    // =====================================================
    // RETURN BUFFER
    // =====================================================

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

   // =====================================================
// PDF GENERATOR
//
// Professional Admin PDF Report
//
// Existing report data / functionality is NOT changed.
// Only PDF presentation is improved.
// =====================================================

async generatePdf(
    report
) {

    const PDFDocument =
        require("pdfkit");

    const fs =
        require("fs");

    const path =
        require("path");


    return new Promise(
        (
            resolve,
            reject
        ) => {

            // =================================================
            // REPORT TYPE
            // =================================================

            const isGeneral =
                report?.report_type ===
                "admin_general";


            const isSpecial =
                report?.report_type ===
                "admin_special";


            if (
                !isGeneral &&
                !isSpecial
            ) {

                return reject(
                    new ApiError(
                        400,
                        "Unsupported report type."
                    )
                );

            }


            // =================================================
            // YEAR / PERIOD
            // =================================================

            const financialYear =
                report?.financial_year ||
                "N/A";


            const reportPeriod =
                String(
                    report?.report_period ||
                    "YEARLY"
                )
                    .trim()
                    .toUpperCase();


            // =================================================
            // DOCUMENT
            //
            // Yearly General / Special reports are landscape
            // because they contain multiple columns.
            // =================================================

            const document =
                new PDFDocument({

                    size: "A4",

                    layout: "landscape",

                    margins: {

                        top: 36,
                        bottom: 42,
                        left: 38,
                        right: 38

                    },

                    bufferPages: true

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
            // PAGE CONSTANTS
            // =================================================

            const pageWidth =
                document.page.width;


            const pageHeight =
                document.page.height;


            const left =
                document.page.margins.left;


            const right =
                document.page.margins.right;


            const top =
                document.page.margins.top;


            const bottom =
                document.page.margins.bottom;


            const usableWidth =
                pageWidth -
                left -
                right;


            const usableHeight =
                pageHeight -
                top -
                bottom;


            // =================================================
            // COMPANY INFORMATION
            // =================================================

            const companyName =
                "RAJARAMBAPU PATIL SAHAKARI SAKHAR KARKHANA LTD.";


            const companyLocation =
                "RAJARAMNAGAR";


            const reportTitle =
                isGeneral

                    ? "ADMIN GENERAL REPORT"

                    : "ADMIN SPECIAL REPORT";


            // =================================================
            // LOGO
            //
            // Put your logo here:
            //
            // backend/
            //   assets/
            //      rajarambapu-logo.png
            //
            // If logo is not found, PDF will continue normally.
            // =================================================

            const logoCandidates = [

                path.join(
                    process.cwd(),
                    "assets",
                    "rajarambapu-logo.png"
                ),

                path.join(
                    process.cwd(),
                    "src",
                    "assets",
                    "rajarambapu-logo.png"
                ),

                path.join(
                    __dirname,
                    "../assets/rajarambapu-logo.png"
                ),

                path.join(
                    __dirname,
                    "../public/assets/rajarambapu-logo.png"
                )

            ];


            let logoPath =
                null;


            for (
                const candidate
                of logoCandidates
            ) {

                if (
                    fs.existsSync(
                        candidate
                    )
                ) {

                    logoPath =
                        candidate;

                    break;

                }

            }


            // =================================================
            // COLORS
            // =================================================

            const COLORS = {

                navy:
                    "#172B4D",

                blue:
                    "#1769D1",

                lightBlue:
                    "#EEF5FF",

                border:
                    "#C9D5E5",

                softBorder:
                    "#E2E8F0",

                text:
                    "#1F2937",

                muted:
                    "#64748B",

                white:
                    "#FFFFFF",

                green:
                    "#138A5B",

                greenBg:
                    "#EAF8F1",

                grayBg:
                    "#F7F9FC"

            };


            // =================================================
            // HELPERS
            // =================================================

            const drawHorizontalLine =
                (
                    y,
                    color =
                        COLORS.border,
                    width = 0.8
                ) => {

                    document
                        .save()
                        .lineWidth(
                            width
                        )
                        .strokeColor(
                            color
                        )
                        .moveTo(
                            left,
                            y
                        )
                        .lineTo(
                            pageWidth - right,
                            y
                        )
                        .stroke()
                        .restore();

                };


            const safeValue =
                value => {

                    if (
                        value === null ||
                        value === undefined ||
                        value === ""
                    ) {

                        return "—";

                    }

                    return String(
                        value
                    );

                };


            const formatScore =
                value => {

                    if (
                        value === null ||
                        value === undefined ||
                        value === ""
                    ) {

                        return "—";

                    }

                    const number =
                        Number(value);


                    if (
                        !Number.isFinite(
                            number
                        )
                    ) {

                        return "—";

                    }


                    return `${number.toFixed(2)}%`;

                };


            // =================================================
            // TABLE HEADER DATA
            // =================================================

            let headers;


            if (
                isGeneral
            ) {

                if (
                    reportPeriod ===
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
                        reportPeriod

                    ];

                }

            } else {

                headers = [

                    "Department",

                    ...(
                        report?.special_surveys ||
                        []
                    )
                        .map(
                            special =>
                                special.label
                        )

                ];

            }


            // =================================================
            // COLUMN WIDTHS
            // =================================================

            const columnCount =
                headers.length;


            let columnWidths;


            if (
                columnCount === 6
            ) {

                // Department + Q1 + Q2 + Q3 + Q4 + Average

                columnWidths = [

                    usableWidth * 0.30,

                    usableWidth * 0.14,

                    usableWidth * 0.14,

                    usableWidth * 0.14,

                    usableWidth * 0.14,

                    usableWidth * 0.14

                ];

            } else {

                const firstWidth =
                    usableWidth *
                    0.34;


                const remainingWidth =
                    usableWidth -
                    firstWidth;


                const otherCount =
                    columnCount -
                    1;


                columnWidths = [

                    firstWidth,

                    ...Array(
                        otherCount
                    )
                        .fill(
                            remainingWidth /
                            Math.max(
                                otherCount,
                                1
                            )
                        )

                ];

            }


            // =================================================
            // REPORT ROWS
            // =================================================

            const departments =
                Array.isArray(
                    report?.departments
                )

                    ? report.departments

                    : [];


            const rows =
                departments.map(
                    department => {

                        const departmentName =
                            department?.department_name ||
                            department?.department_code ||
                            "—";


                        if (
                            isGeneral &&
                            reportPeriod ===
                            "YEARLY"
                        ) {

                            return [

                                departmentName,

                                formatScore(
                                    department?.Q1
                                ),

                                formatScore(
                                    department?.Q2
                                ),

                                formatScore(
                                    department?.Q3
                                ),

                                formatScore(
                                    department?.Q4
                                ),

                                formatScore(
                                    department?.yearly_average
                                )

                            ];

                        }


                        if (
                            isGeneral
                        ) {

                            return [

                                departmentName,

                                formatScore(
                                    department?.[
                                        reportPeriod
                                    ]
                                )

                            ];

                        }


                        // SPECIAL

                        return [

                            departmentName,

                            ...(
                                report?.special_surveys ||
                                []
                            )
                                .map(
                                    special =>
                                        formatScore(
                                            department?.[
                                                special.label
                                            ]
                                        )
                                )

                        ];

                    }
                );


            // =================================================
            // DRAW COMPANY HEADER
            // =================================================

            const drawCompanyHeader =
                () => {

                    let y =
                        top;


                    // -----------------------------------------
                    // Logo
                    // -----------------------------------------

                    if (
                        logoPath
                    ) {

                        try {

                            document.image(
                                logoPath,
                                left,
                                y,
                                {
                                    fit: [
                                        62,
                                        62
                                    ],
                                    align:
                                        "center",
                                    valign:
                                        "center"
                                }
                            );

                        } catch (
                            error
                        ) {

                            // Do not fail report if logo
                            // cannot be rendered.

                        }

                    }


                    // -----------------------------------------
                    // Company Name
                    // -----------------------------------------

                    const companyStartX =
                        logoPath
                            ? left + 78
                            : left;


                    document
                        .font(
                            "Helvetica-Bold"
                        )
                        .fontSize(
                            17
                        )
                        .fillColor(
                            COLORS.navy
                        )
                        .text(
                            companyName,
                            companyStartX,
                            y + 4,
                            {
                                width:
                                    usableWidth -
                                    78,
                                align:
                                    "center"
                            }
                        );


                    document
                        .font(
                            "Helvetica-Bold"
                        )
                        .fontSize(
                            12
                        )
                        .fillColor(
                            COLORS.muted
                        )
                        .text(
                            companyLocation,
                            companyStartX,
                            y + 27,
                            {
                                width:
                                    usableWidth -
                                    78,
                                align:
                                    "center"
                            }
                        );


                    // -----------------------------------------
                    // Blue Accent
                    // -----------------------------------------

                    document
                        .save()
                        .lineWidth(
                            2.2
                        )
                        .strokeColor(
                            COLORS.blue
                        )
                        .moveTo(
                            left,
                            y + 68
                        )
                        .lineTo(
                            pageWidth - right,
                            y + 68
                        )
                        .stroke()
                        .restore();


                    return y + 84;

                };


            // =================================================
            // DRAW REPORT TITLE
            // =================================================

            const drawReportHeading =
                () => {

                    let y =
                        drawCompanyHeader();


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
                            reportTitle,
                            left,
                            y,
                            {
                                width:
                                    usableWidth,
                                align:
                                    "center"
                            }
                        );


                    y += 27;


                    document
                        .font(
                            "Helvetica"
                        )
                        .fontSize(
                            9.5
                        )
                        .fillColor(
                            COLORS.muted
                        )
                        .text(
                            `Financial Year : ${financialYear}`,
                            left,
                            y,
                            {
                                width:
                                    usableWidth *
                                    0.50
                            }
                        );


                    document
                        .font(
                            "Helvetica"
                        )
                        .fontSize(
                            9.5
                        )
                        .fillColor(
                            COLORS.muted
                        )
                        .text(
                            `Period : ${reportPeriod}`,
                            left +
                            usableWidth *
                            0.50,
                            y,
                            {
                                width:
                                    usableWidth *
                                    0.50,
                                align:
                                    "right"
                            }
                        );


                    y += 24;


                    drawHorizontalLine(
                        y,
                        COLORS.border,
                        1
                    );


                    return y + 16;

                };


            // =================================================
            // REPORT SUMMARY
            // =================================================

            const drawSummary =
                y => {

                    const summaryHeight =
                        65;


                    // Outer box

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
                            COLORS.border
                        )
                        .stroke()
                        .restore();


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


                    const summaryY =
                        y + 29;


                    // Report Type

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
                            left + 12,
                            summaryY
                        );


                    // Financial Year

                    document
                        .text(
                            `Financial Year : ${financialYear}`,
                            left + 190,
                            summaryY
                        );


                    // Period

                    document
                        .text(
                            `Period : ${reportPeriod}`,
                            left + 390,
                            summaryY
                        );


                    // Generated On

                    document
                        .text(
                            `Generated On : ${
                                new Date()
                                    .toLocaleDateString(
                                        "en-GB"
                                    )
                            }`,
                            left + 540,
                            summaryY
                        );


                    return y +
                        summaryHeight +
                        18;

                };


            // =================================================
            // DRAW SECTION TITLE
            // =================================================

            const drawSectionTitle =
                y => {

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
                            y + 16
                        );


                    return y + 35;

                };


            // =================================================
            // TABLE
            // =================================================

            const headerHeight =
                32;


            const rowHeight =
                27;


            const drawTableHeader =
                y => {

                    let x =
                        left;


                    // -----------------------------------------
                    // Header background
                    // -----------------------------------------

                    document
                        .save()
                        .rect(
                            left,
                            y,
                            usableWidth,
                            headerHeight
                        )
                        .fillColor(
                            COLORS.navy
                        )
                        .fill()
                        .restore();


                    headers.forEach(
                        (
                            header,
                            index
                        ) => {

                            document
                                .font(
                                    "Helvetica-Bold"
                                )
                                .fontSize(
                                    8.5
                                )
                                .fillColor(
                                    COLORS.white
                                )
                                .text(
                                    safeValue(
                                        header
                                    ),
                                    x + 7,
                                    y + 10,
                                    {
                                        width:
                                            columnWidths[
                                                index
                                            ] - 14,
                                        align:
                                            index === 0
                                                ? "left"
                                                : "center"
                                    }
                                );


                            // Vertical separator
                            // between ALL columns.

                            if (
                                index >
                                0
                            ) {

                                document
                                    .save()
                                    .lineWidth(
                                        0.7
                                    )
                                    .strokeColor(
                                        "#6D7D95"
                                    )
                                    .moveTo(
                                        x,
                                        y
                                    )
                                    .lineTo(
                                        x,
                                        y +
                                        headerHeight
                                    )
                                    .stroke()
                                    .restore();

                            }


                            x +=
                                columnWidths[
                                    index
                                ];

                        });


                    // Outer header border

                    document
                        .save()
                        .lineWidth(
                            0.8
                        )
                        .strokeColor(
                            COLORS.navy
                        )
                        .rect(
                            left,
                            y,
                            usableWidth,
                            headerHeight
                        )
                        .stroke()
                        .restore();


                    return y +
                        headerHeight;

                };


            const drawTableRow =
                (
                    row,
                    y,
                    rowIndex
                ) => {

                    let x =
                        left;


                    // Alternating background

                    if (
                        rowIndex % 2 === 0
                    ) {

                        document
                            .save()
                            .rect(
                                left,
                                y,
                                usableWidth,
                                rowHeight
                            )
                            .fillColor(
                                "#F8FAFD"
                            )
                            .fill()
                            .restore();

                    }


                    row.forEach(
                        (
                            value,
                            index
                        ) => {

                            // ---------------------------------
                            // CELL
                            // ---------------------------------

                            document
                                .save()
                                .lineWidth(
                                    0.65
                                )
                                .strokeColor(
                                    COLORS.border
                                )
                                .rect(
                                    x,
                                    y,
                                    columnWidths[
                                        index
                                    ],
                                    rowHeight
                                )
                                .stroke()
                                .restore();


                            // ---------------------------------
                            // VALUE
                            // ---------------------------------

                            const isDepartment =
                                index === 0;


                            const isAverage =
                                index ===
                                row.length - 1 &&
                                (
                                    reportPeriod ===
                                    "YEARLY"
                                );


                            document
                                .font(
                                    isDepartment ||
                                    isAverage
                                        ? "Helvetica-Bold"
                                        : "Helvetica"
                                )
                                .fontSize(
                                    8.5
                                )
                                .fillColor(
                                    isDepartment
                                        ? COLORS.text
                                        : COLORS.navy
                                )
                                .text(
                                    safeValue(
                                        value
                                    ),
                                    x + 7,
                                    y + 8,
                                    {
                                        width:
                                            columnWidths[
                                                index
                                            ] - 14,
                                        align:
                                            index === 0
                                                ? "left"
                                                : "center"
                                    }
                                );


                            x +=
                                columnWidths[
                                    index
                                ];

                        });


                    return y +
                        rowHeight;

                };


            // =================================================
            // DRAW AVERAGE ROW
            // =================================================

            const drawAverageRow =
                (
                    row,
                    y
                ) => {

                    let x =
                        left;


                    document
                        .save()
                        .rect(
                            left,
                            y,
                            usableWidth,
                            rowHeight
                        )
                        .fillColor(
                            COLORS.lightBlue
                        )
                        .fill()
                        .restore();


                    row.forEach(
                        (
                            value,
                            index
                        ) => {

                            document
                                .save()
                                .lineWidth(
                                    1
                                )
                                .strokeColor(
                                    COLORS.blue
                                )
                                .rect(
                                    x,
                                    y,
                                    columnWidths[
                                        index
                                    ],
                                    rowHeight
                                )
                                .stroke()
                                .restore();


                            document
                                .font(
                                    "Helvetica-Bold"
                                )
                                .fontSize(
                                    8.5
                                )
                                .fillColor(
                                    COLORS.navy
                                )
                                .text(
                                    safeValue(
                                        value
                                    ),
                                    x + 7,
                                    y + 8,
                                    {
                                        width:
                                            columnWidths[
                                                index
                                            ] - 14,
                                        align:
                                            index === 0
                                                ? "left"
                                                : "center"
                                    }
                                );


                            x +=
                                columnWidths[
                                    index
                                ];

                        });


                    return y +
                        rowHeight;

                };


            // =================================================
            // DRAW TABLE
            // =================================================

            const drawTable =
                y => {

                    let currentY =
                        drawTableHeader(
                            y
                        );


                    rows.forEach(
                        (
                            row,
                            index
                        ) => {

                            // Page break

                            if (
                                currentY +
                                rowHeight +
                                bottom >
                                pageHeight
                            ) {

                                document.addPage();

                                currentY =
                                    drawCompanyHeader();

                                currentY =
                                    drawTableHeader(
                                        currentY
                                    );

                            }


                            currentY =
                                drawTableRow(
                                    row,
                                    currentY,
                                    index
                                );

                        }
                    );


                    // =================================================
                    // AVERAGE ROW
                    //
                    // Admin general report intentionally does not
                    // depend on an average row because existing
                    // functionality does not return one.
                    // Therefore this is only added if data exists.
                    // =================================================

                    if (
                        isGeneral &&
                        reportPeriod === "YEARLY" &&
                        report?.quarterly_average
                    ) {

                        const averageRow = [

                            "Average",

                            formatScore(
                                report
                                    ?.quarterly_average
                                    ?.Q1
                            ),

                            formatScore(
                                report
                                    ?.quarterly_average
                                    ?.Q2
                            ),

                            formatScore(
                                report
                                    ?.quarterly_average
                                    ?.Q3
                            ),

                            formatScore(
                                report
                                    ?.quarterly_average
                                    ?.Q4
                            ),

                            formatScore(
                                report
                                    ?.yearly_average
                            )

                        ];


                        if (
                            currentY +
                            rowHeight +
                            bottom >
                            pageHeight
                        ) {

                            document.addPage();

                            currentY =
                                drawCompanyHeader();

                            currentY =
                                drawTableHeader(
                                    currentY
                                );

                        }


                        currentY =
                            drawAverageRow(
                                averageRow,
                                currentY
                            );

                    }


                    return currentY;

                };


            // =================================================
            // START FIRST PAGE
            // =================================================

            let currentY =
                drawReportHeading();


            // =================================================
            // SUMMARY
            // =================================================

            currentY =
                drawSummary(
                    currentY
                );


            // =================================================
            // SECTION
            // =================================================

            currentY =
                drawSectionTitle(
                    currentY
                );


            // =================================================
            // TABLE
            // =================================================

            currentY =
                drawTable(
                    currentY
                );


            // =================================================
            // FOOTER ON ALL PAGES
            // =================================================

            const range =
                document.bufferedPageRange();


            for (
                let pageIndex =
                    range.start;

                pageIndex <
                    range.start +
                    range.count;

                pageIndex++
            ) {

                document.switchToPage(
                    pageIndex
                );


                const footerY =
                    pageHeight -
                    bottom +
                    12;


                document
                    .save()
                    .lineWidth(
                        0.7
                    )
                    .strokeColor(
                        COLORS.softBorder
                    )
                    .moveTo(
                        left,
                        footerY - 8
                    )
                    .lineTo(
                        pageWidth - right,
                        footerY - 8
                    )
                    .stroke()
                    .restore();


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
                        "User Satisfaction Index System",
                        left,
                        footerY,
                        {
                            width:
                                usableWidth *
                                0.50,
                            align:
                                "left"
                        }
                    );


                document
                    .text(
                        `Page ${
                            pageIndex -
                            range.start +
                            1
                        } of ${range.count}`,
                        left +
                        usableWidth *
                        0.50,
                        footerY,
                        {
                            width:
                                usableWidth *
                                0.50,
                            align:
                                "right"
                        }
                    );

            }


            // =================================================
            // FINISH
            // =================================================

            document.end();

        }
    );

}
}


module.exports =
    new AdminReportExportService();