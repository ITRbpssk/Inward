const ExcelJS = require("exceljs");
const PDFDocument = require("pdfkit");


class ReportExportService {

    // =====================================================
    // FORMAT SCORE
    // =====================================================

    formatScore(value) {

        if (
            value === null ||
            value === undefined ||
            value === ""
        ) {
            return "N/A";
        }

        const number = Number(value);

        if (!Number.isFinite(number)) {
            return "N/A";
        }

        return number.toFixed(2);
    }


    // =====================================================
    // REPORT TITLE
    // =====================================================

    getReportTitle(report) {

        switch (report?.report_type) {

            case "hod_general":
                return "HOD - General Survey Report";

            case "hod_special":
                return "HOD - Special Survey Report";

            case "admin_general":
                return "ADMIN - General Survey Report";

            case "admin_special":
                return "ADMIN - Special Survey Report";

            default:
                return "Survey Report";
        }
    }


    // =====================================================
    // PERIOD TITLE
    // =====================================================

    getPeriodTitle(period) {

        const value =
            String(period || "YEARLY")
                .trim()
                .toUpperCase();

        switch (value) {

            case "Q1":
                return "Quarter 1";

            case "Q2":
                return "Quarter 2";

            case "Q3":
                return "Quarter 3";

            case "Q4":
                return "Quarter 4";

            case "YEARLY":
                return "Yearly";

            case "ALL":
                return "All";

            default:
                return value;

        }
    }


    // =====================================================
    // VALIDATE PERIOD
    // =====================================================

    validatePeriod(
        report,
        period
    ) {

        const value =
            String(period || "")
                .trim()
                .toUpperCase();


        // -----------------------------------------------
        // GENERAL
        // -----------------------------------------------

        if (
            report.report_type === "hod_general" ||
            report.report_type === "admin_general"
        ) {

            const allowed = [
                "Q1",
                "Q2",
                "Q3",
                "Q4",
                "YEARLY"
            ];

            if (!allowed.includes(value)) {

                throw new Error(
                    "Invalid general report period. Use Q1, Q2, Q3, Q4 or YEARLY."
                );

            }

            return value;
        }


        // -----------------------------------------------
        // SPECIAL
        // -----------------------------------------------

        if (
            report.report_type === "hod_special" ||
            report.report_type === "admin_special"
        ) {

            if (
                !value
            ) {

                return "ALL";

            }

            return value;

        }


        return value || "YEARLY";

    }


    // =====================================================
    // BUILD EXPORT REPORT
    //
    // Does NOT change original report.
    //
    // Creates a smaller report for selected period.
    // =====================================================

    buildExportReport(
        report,
        period = "YEARLY"
    ) {

        if (!report) {

            throw new Error(
                "Report data is required."
            );

        }


        const selectedPeriod =
            this.validatePeriod(
                report,
                period
            );


        // =================================================
        // GENERAL REPORT
        // =================================================

        if (
            report.report_type === "hod_general" ||
            report.report_type === "admin_general"
        ) {

            const departments =
                Array.isArray(
                    report.departments
                )
                    ? report.departments
                    : [];


            // ---------------------------------------------
            // YEARLY
            // ---------------------------------------------

            if (
                selectedPeriod === "YEARLY"
            ) {

                return {

                    ...report,

                    export_period:
                        "YEARLY",

                    export_period_label:
                        "Yearly",

                    columns: [

                        "Department",
                        "Q1",
                        "Q2",
                        "Q3",
                        "Q4",
                        "Yearly Average"

                    ],

                    departments:
                        departments.map(
                            department => ({

                                department_id:
                                    department.department_id,

                                department_code:
                                    department.department_code,

                                department_name:
                                    department.department_name,

                                Q1:
                                    department.Q1,

                                Q2:
                                    department.Q2,

                                Q3:
                                    department.Q3,

                                Q4:
                                    department.Q4,

                                yearly_average:
                                    department.yearly_average

                            })
                        )

                };

            }


            // ---------------------------------------------
            // QUARTERLY
            // ---------------------------------------------

            return {

                ...report,

                export_period:
                    selectedPeriod,

                export_period_label:
                    this.getPeriodTitle(
                        selectedPeriod
                    ),

                columns: [

                    "Department",

                    selectedPeriod,

                    "Average"

                ],

                departments:
                    departments.map(
                        department => ({

                            department_id:
                                department.department_id,

                            department_code:
                                department.department_code,

                            department_name:
                                department.department_name,

                            score:
                                department[
                                    selectedPeriod
                                ]

                        })
                    ),

                quarterly_average: {

                    [selectedPeriod]:
                        report
                            ?.quarterly_average
                            ?.[
                                selectedPeriod
                            ]

                },

                yearly_average:
                    null

            };

        }


        // =================================================
        // SPECIAL REPORT
        // =================================================

        if (
            report.report_type === "hod_special" ||
            report.report_type === "admin_special"
        ) {

            const departments =
                Array.isArray(
                    report.departments
                )
                    ? report.departments
                    : [];


            const specialSurveys =
                Array.isArray(
                    report.special_surveys
                )
                    ? report.special_surveys
                    : [];


            // ---------------------------------------------
            // ALL SPECIAL REPORT
            // ---------------------------------------------

            if (
                selectedPeriod === "ALL"
            ) {

                return {

                    ...report,

                    export_period:
                        "ALL",

                    export_period_label:
                        "All Special Surveys",

                    columns: [

                        "Department",

                        ...specialSurveys.map(
                            special =>
                                special.label
                        )

                    ],

                    departments

                };

            }


            // ---------------------------------------------
            // SPECIFIC SPECIAL
            //
            // period can be:
            // Special 1
            // Special 2
            // etc.
            // ---------------------------------------------

            const special =
                specialSurveys.find(
                    item =>
                        String(
                            item.label
                        )
                            .toUpperCase() ===
                        selectedPeriod
                );


            if (!special) {

                throw new Error(
                    `Special report "${period}" not found.`
                );

            }


            return {

                ...report,

                export_period:
                    special.label,

                export_period_label:
                    special.label,

                columns: [

                    "Department",

                    special.label,

                    "Average"

                ],

                departments:
                    departments.map(
                        department => ({

                            department_id:
                                department.department_id,

                            department_code:
                                department.department_code,

                            department_name:
                                department.department_name,

                            score:
                                department[
                                    special.label
                                ]

                        })
                    ),

                special_average: {

                    [special.label]:
                        report
                            ?.special_average
                            ?.[
                                special.label
                            ]

                }

            };

        }


        return report;

    }


    // =====================================================
    // GET EXPORT TITLE
    // =====================================================

    getExportTitle(report) {

        const baseTitle =
            this.getReportTitle(
                report
            );


        if (
            report.export_period_label
        ) {

            return `${baseTitle} - ${report.export_period_label}`;

        }


        return baseTitle;

    }


    // =====================================================
    // EXCEL
    // =====================================================

    async generateExcel(
        report,
        period = "YEARLY"
    ) {

        const exportReport =
            this.buildExportReport(
                report,
                period
            );


        const workbook =
            new ExcelJS.Workbook();


        workbook.creator =
            "USI Survey System";

        workbook.lastModifiedBy =
            "USI Survey System";

        workbook.createdAt =
            new Date();

        workbook.modifiedAt =
            new Date();


        const worksheet =
            workbook.addWorksheet(
                "Report",
                {
                    pageSetup: {

                        orientation:
                            "landscape",

                        fitToPage:
                            true,

                        fitToWidth:
                            1,

                        fitToHeight:
                            0

                    }
                }
            );


        // =================================================
        // TITLE
        // =================================================

        const title =
            this.getExportTitle(
                exportReport
            );


        const totalColumns =
            Math.max(
                Array.isArray(
                    exportReport.columns
                )
                    ? exportReport.columns.length
                    : 1,

                1
            );


        const titleRow =
            worksheet.addRow([
                title
            ]);


        worksheet.mergeCells(
            1,
            1,
            1,
            totalColumns
        );


        titleRow.height =
            32;


        titleRow.getCell(1).font = {

            bold:
                true,

            size:
                16

        };


        titleRow.getCell(1).alignment = {

            horizontal:
                "center",

            vertical:
                "middle"

        };


        // =================================================
        // FINANCIAL YEAR
        // =================================================

        const yearRow =
            worksheet.addRow([

                `Financial Year: ${
                    exportReport.financial_year
                    || "-"
                }`

            ]);


        worksheet.mergeCells(
            2,
            1,
            2,
            totalColumns
        );


        yearRow.height =
            22;


        yearRow.getCell(1).font = {

            bold:
                true,

            size:
                11

        };


        yearRow.getCell(1).alignment = {

            horizontal:
                "center",

            vertical:
                "middle"

        };


        // =================================================
        // REPORT PERIOD
        // =================================================

        const periodRow =
            worksheet.addRow([

                `Report Period: ${
                    exportReport.export_period_label
                    || "-"
                }`

            ]);


        worksheet.mergeCells(
            3,
            1,
            3,
            totalColumns
        );


        periodRow.getCell(1).alignment = {

            horizontal:
                "center",

            vertical:
                "middle"

        };


        // =================================================
        // EMPTY ROW
        // =================================================

        worksheet.addRow([]);


        // =================================================
        // HEADER
        // =================================================

        const headerRow =
            worksheet.addRow(
                exportReport.columns
            );


        headerRow.height =
            28;


        headerRow.eachCell(
            cell => {

                cell.font = {

                    bold:
                        true

                };


                cell.alignment = {

                    horizontal:
                        "center",

                    vertical:
                        "middle",

                    wrapText:
                        true

                };

            }
        );


        // =================================================
        // DATA
        // =================================================

        const departments =
            Array.isArray(
                exportReport.departments
            )
                ? exportReport.departments
                : [];


        for (
            const department
            of departments
        ) {

            let rowData;


            // ---------------------------------------------
            // GENERAL YEARLY
            // ---------------------------------------------

            if (
                exportReport.export_period ===
                    "YEARLY"
            ) {

                rowData = [

                    department.department_name
                        || "-",

                    this.formatScore(
                        department.Q1
                    ),

                    this.formatScore(
                        department.Q2
                    ),

                    this.formatScore(
                        department.Q3
                    ),

                    this.formatScore(
                        department.Q4
                    ),

                    this.formatScore(
                        department.yearly_average
                    )

                ];

            }

            // ---------------------------------------------
            // GENERAL QUARTER / SPECIAL SINGLE
            // ---------------------------------------------

            else if (
                exportReport.columns.length ===
                    3
            ) {

                rowData = [

                    department.department_name
                        || "-",

                    this.formatScore(
                        department.score
                    ),

                    ""

                ];

            }

            // ---------------------------------------------
            // SPECIAL ALL
            // ---------------------------------------------

            else {

                rowData = [

                    department.department_name
                        || "-"

                ];


                for (
                    const special
                    of exportReport.special_surveys
                    || []
                ) {

                    rowData.push(

                        this.formatScore(

                            department[
                                special.label
                            ]

                        )

                    );

                }

            }


            worksheet.addRow(
                rowData
            );

        }


        // =================================================
        // AVERAGE ROW
        // =================================================

        let averageRow;


        // ---------------------------------------------
        // GENERAL YEARLY
        // ---------------------------------------------

        if (
            exportReport.report_type ===
                "hod_general" ||
            exportReport.report_type ===
                "admin_general"
        ) {

            if (
                exportReport.export_period ===
                    "YEARLY"
            ) {

                const average =
                    exportReport.quarterly_average
                        || {};


                averageRow = [

                    "AVERAGE",

                    this.formatScore(
                        average.Q1
                    ),

                    this.formatScore(
                        average.Q2
                    ),

                    this.formatScore(
                        average.Q3
                    ),

                    this.formatScore(
                        average.Q4
                    ),

                    exportReport.report_type ===
                        "admin_general"

                        ? this.formatScore(
                            exportReport.yearly_average
                          )

                        : this.formatScore(
                            this.calculateYearlyAverageFromDepartments(
                                exportReport.departments
                            )
                          )

                ];

            }

            // ------------------------------------------
            // QUARTER
            // ------------------------------------------

            else {

                const quarter =
                    exportReport.export_period;


                averageRow = [

                    "AVERAGE",

                    this.formatScore(

                        exportReport
                            ?.quarterly_average
                            ?.[
                                quarter
                            ]

                    ),

                    ""

                ];

            }

        }


        // ---------------------------------------------
        // SPECIAL
        // ---------------------------------------------

        else {

            if (
                exportReport.export_period ===
                    "ALL"
            ) {

                averageRow = [

                    "AVERAGE"

                ];


                for (
                    const special
                    of exportReport.special_surveys
                    || []
                ) {

                    averageRow.push(

                        this.formatScore(

                            exportReport
                                ?.special_average
                                ?.[
                                    special.label
                                ]

                        )

                    );

                }

            } else {

                const label =
                    exportReport.export_period;


                averageRow = [

                    "AVERAGE",

                    this.formatScore(

                        exportReport
                            ?.special_average
                            ?.[
                                label
                            ]

                    ),

                    ""

                ];

            }

        }


        if (
            averageRow
        ) {

            const row =
                worksheet.addRow(
                    averageRow
                );


            row.eachCell(
                cell => {

                    cell.font = {

                        bold:
                            true

                    };


                    cell.alignment = {

                        horizontal:
                            "center",

                        vertical:
                            "middle"

                    };

                }
            );

        }


        // =================================================
        // COLUMN WIDTH
        // =================================================

        worksheet.columns.forEach(
            (
                column,
                index
            ) => {

                if (
                    index === 0
                ) {

                    column.width =
                        32;

                } else {

                    column.width =
                        20;

                }

            }
        );


        // =================================================
        // ALIGNMENT
        // =================================================

        worksheet.eachRow(
            (
                row,
                rowNumber
            ) => {

                if (
                    rowNumber >= 5
                ) {

                    row.eachCell(
                        (
                            cell,
                            columnNumber
                        ) => {

                            cell.alignment = {

                                horizontal:
                                    columnNumber === 1
                                        ? "left"
                                        : "center",

                                vertical:
                                    "middle",

                                wrapText:
                                    true

                            };

                        }
                    );

                }

            }
        );


        // =================================================
        // PRINT SETTINGS
        // =================================================

        worksheet.pageSetup = {

            orientation:
                "landscape",

            paperSize:
                9,

            fitToPage:
                true,

            fitToWidth:
                1,

            fitToHeight:
                0,

            horizontalCentered:
                true

        };


        worksheet.pageSetup.margins = {

            left:
                0.25,

            right:
                0.25,

            top:
                0.5,

            bottom:
                0.5,

            header:
                0.2,

            footer:
                0.2

        };


        // =================================================
        // FREEZE HEADER
        // =================================================

        worksheet.views = [

            {

                state:
                    "frozen",

                ySplit:
                    4

            }

        ];


        // =================================================
        // FOOTER
        // =================================================

        worksheet.headerFooter.oddFooter =
            "&CUSI Survey System";


        return await workbook.xlsx.writeBuffer();

    }


    // =====================================================
    // CALCULATE YEARLY AVERAGE
    //
    // Used only for HOD yearly export because HOD report
    // does not contain yearly_average in bottom row.
    // =====================================================

    calculateYearlyAverageFromDepartments(
        departments
    ) {

        if (
            !Array.isArray(
                departments
            )
        ) {

            return null;

        }


        const values =
            departments
                .map(
                    department =>
                        department.yearly_average
                )
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
            values.length === 0
        ) {

            return null;

        }


        const total =
            values.reduce(
                (
                    sum,
                    value
                ) =>
                    sum + value,

                0
            );


        return total /
            values.length;

    }


    // =====================================================
    // PDF
    // =====================================================

    async generatePdf(
        report,
        period = "YEARLY"
    ) {

        const exportReport =
            this.buildExportReport(
                report,
                period
            );


        return new Promise(
            (
                resolve,
                reject
            ) => {

                try {

                    const doc =
                        new PDFDocument({

                            size:
                                "A4",

                            layout:
                                "landscape",

                            margins: {

                                top:
                                    40,

                                bottom:
                                    40,

                                left:
                                    30,

                                right:
                                    30

                            }

                        });


                    const chunks = [];


                    doc.on(
                        "data",
                        chunk => {

                            chunks.push(
                                chunk
                            );

                        }
                    );


                    doc.on(
                        "end",
                        () => {

                            resolve(

                                Buffer.concat(
                                    chunks
                                )

                            );

                        }
                    );


                    doc.on(
                        "error",
                        reject
                    );


                    // =========================================
                    // TITLE
                    // =========================================

                    doc
                        .fontSize(18)
                        .font("Helvetica-Bold")
                        .text(
                            this.getExportTitle(
                                exportReport
                            ),
                            {
                                align:
                                    "center"
                            }
                        );


                    doc.moveDown(
                        0.4
                    );


                    // =========================================
                    // YEAR
                    // =========================================

                    doc
                        .fontSize(10)
                        .font("Helvetica")
                        .text(
                            `Financial Year: ${
                                exportReport.financial_year
                                || "-"
                            }`,
                            {
                                align:
                                    "center"
                            }
                        );


                    doc.moveDown(
                        0.2
                    );


                    // =========================================
                    // PERIOD
                    // =========================================

                    doc
                        .fontSize(10)
                        .text(
                            `Report Period: ${
                                exportReport.export_period_label
                                || "-"
                            }`,
                            {
                                align:
                                    "center"
                            }
                        );


                    doc.moveDown(
                        0.8
                    );


                    const columns =
                        Array.isArray(
                            exportReport.columns
                        )
                            ? exportReport.columns
                            : [];


                    const departments =
                        Array.isArray(
                            exportReport.departments
                        )
                            ? exportReport.departments
                            : [];


                    const pageWidth =
                        doc.page.width -
                        doc.page.margins.left -
                        doc.page.margins.right;


                    const firstColumnWidth =
                        190;


                    const otherColumnCount =
                        Math.max(
                            columns.length - 1,
                            1
                        );


                    const otherColumnWidth =
                        (
                            pageWidth -
                            firstColumnWidth
                        ) /
                        otherColumnCount;


                    const rowHeight =
                        28;


                    let y =
                        doc.y;


                    // =========================================
                    // DRAW HEADER
                    // =========================================

                    const drawHeader =
                        () => {

                            let x =
                                doc.page.margins.left;


                            doc
                                .font(
                                    "Helvetica-Bold"
                                )
                                .fontSize(9);


                            for (
                                let i = 0;
                                i < columns.length;
                                i++
                            ) {

                                const width =
                                    i === 0
                                        ? firstColumnWidth
                                        : otherColumnWidth;


                                doc
                                    .rect(
                                        x,
                                        y,
                                        width,
                                        rowHeight
                                    )
                                    .stroke();


                                doc.text(
                                    columns[i],
                                    x + 5,
                                    y + 8,
                                    {

                                        width:
                                            width - 10,

                                        align:
                                            "center"

                                    }
                                );


                                x += width;

                            }


                            y += rowHeight;

                        };


                    drawHeader();


                    // =========================================
                    // DATA ROWS
                    // =========================================

                    for (
                        const department
                        of departments
                    ) {

                        if (
                            y + rowHeight >
                            doc.page.height -
                            doc.page.margins.bottom
                        ) {

                            doc.addPage();

                            y =
                                doc.page.margins.top;

                            drawHeader();

                        }


                        let values;


                        // -------------------------------------
                        // YEARLY GENERAL
                        // -------------------------------------

                        if (
                            exportReport.export_period ===
                                "YEARLY"
                        ) {

                            values = [

                                department.department_name
                                    || "-",

                                this.formatScore(
                                    department.Q1
                                ),

                                this.formatScore(
                                    department.Q2
                                ),

                                this.formatScore(
                                    department.Q3
                                ),

                                this.formatScore(
                                    department.Q4
                                ),

                                this.formatScore(
                                    department.yearly_average
                                )

                            ];

                        }

                        // -------------------------------------
                        // QUARTER / SINGLE SPECIAL
                        // -------------------------------------

                        else if (
                            exportReport.columns.length ===
                                3
                        ) {

                            values = [

                                department.department_name
                                    || "-",

                                this.formatScore(
                                    department.score
                                ),

                                ""

                            ];

                        }

                        // -------------------------------------
                        // SPECIAL ALL
                        // -------------------------------------

                        else {

                            values = [

                                department.department_name
                                    || "-"

                            ];


                            for (
                                const special
                                of exportReport.special_surveys
                                || []
                            ) {

                                values.push(

                                    this.formatScore(

                                        department[
                                            special.label
                                        ]

                                    )

                                );

                            }

                        }


                        let x =
                            doc.page.margins.left;


                        doc
                            .font(
                                "Helvetica"
                            )
                            .fontSize(8);


                        for (
                            let i = 0;
                            i < values.length;
                            i++
                        ) {

                            const width =
                                i === 0
                                    ? firstColumnWidth
                                    : otherColumnWidth;


                            doc
                                .rect(
                                    x,
                                    y,
                                    width,
                                    rowHeight
                                )
                                .stroke();


                            doc.text(
                                String(
                                    values[i]
                                ),
                                x + 5,
                                y + 8,
                                {

                                    width:
                                        width - 10,

                                    align:
                                        i === 0
                                            ? "left"
                                            : "center"

                                }
                            );


                            x += width;

                        }


                        y += rowHeight;

                    }


                    // =========================================
                    // AVERAGE ROW
                    // =========================================

                    if (
                        y + rowHeight >
                        doc.page.height -
                        doc.page.margins.bottom
                    ) {

                        doc.addPage();

                        y =
                            doc.page.margins.top;

                        drawHeader();

                    }


                    let averageValues;


                    // -----------------------------------------
                    // GENERAL YEARLY
                    // -----------------------------------------

                    if (
                        exportReport.report_type ===
                            "hod_general" ||
                        exportReport.report_type ===
                            "admin_general"
                    ) {

                        if (
                            exportReport.export_period ===
                                "YEARLY"
                        ) {

                            const average =
                                exportReport
                                    .quarterly_average
                                    || {};


                            averageValues = [

                                "AVERAGE",

                                this.formatScore(
                                    average.Q1
                                ),

                                this.formatScore(
                                    average.Q2
                                ),

                                this.formatScore(
                                    average.Q3
                                ),

                                this.formatScore(
                                    average.Q4
                                ),

                                exportReport
                                    .report_type ===
                                    "admin_general"

                                    ? this.formatScore(
                                        exportReport
                                            .yearly_average
                                      )

                                    : this.formatScore(
                                        this
                                            .calculateYearlyAverageFromDepartments(
                                                exportReport
                                                    .departments
                                            )
                                      )

                            ];

                        }

                        // --------------------------------------
                        // QUARTER
                        // --------------------------------------

                        else {

                            const quarter =
                                exportReport
                                    .export_period;


                            averageValues = [

                                "AVERAGE",

                                this.formatScore(

                                    exportReport
                                        ?.quarterly_average
                                        ?.[
                                            quarter
                                        ]

                                ),

                                ""

                            ];

                        }

                    }

                    // -----------------------------------------
                    // SPECIAL
                    // -----------------------------------------

                    else {

                        if (
                            exportReport.export_period ===
                                "ALL"
                        ) {

                            averageValues = [

                                "AVERAGE"

                            ];


                            for (
                                const special
                                of exportReport
                                    .special_surveys
                                || []
                            ) {

                                averageValues.push(

                                    this.formatScore(

                                        exportReport
                                            ?.special_average
                                            ?.[
                                                special.label
                                            ]

                                    )

                                );

                            }

                        } else {

                            const label =
                                exportReport
                                    .export_period;


                            averageValues = [

                                "AVERAGE",

                                this.formatScore(

                                    exportReport
                                        ?.special_average
                                        ?.[
                                            label
                                        ]

                                ),

                                ""

                            ];

                        }

                    }


                    let x =
                        doc.page.margins.left;


                    doc
                        .font(
                            "Helvetica-Bold"
                        )
                        .fontSize(8);


                    for (
                        let i = 0;
                        i < averageValues.length;
                        i++
                    ) {

                        const width =
                            i === 0
                                ? firstColumnWidth
                                : otherColumnWidth;


                        doc
                            .rect(
                                x,
                                y,
                                width,
                                rowHeight
                            )
                            .stroke();


                        doc.text(
                            String(
                                averageValues[i]
                            ),
                            x + 5,
                            y + 8,
                            {

                                width:
                                    width - 10,

                                align:
                                    i === 0
                                        ? "left"
                                        : "center"

                            }
                        );


                        x += width;

                    }


                    // =========================================
                    // FOOTER
                    // =========================================

                    doc
                        .font(
                            "Helvetica"
                        )
                        .fontSize(8)
                        .text(
                            "Generated by USI Survey System",
                            doc.page.margins.left,
                            doc.page.height - 30,
                            {

                                align:
                                    "center",

                                width:
                                    pageWidth

                            }
                        );


                    doc.end();

                }

                catch (error) {

                    reject(
                        error
                    );

                }

            }
        );

    }

}


module.exports =
    new ReportExportService();