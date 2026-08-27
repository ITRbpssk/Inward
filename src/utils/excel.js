const ExcelJS = require("exceljs");


// =====================================================
// HOD REPORT EXCEL GENERATOR
//
// YEARLY:
//
// Computer Department – Yearly Evaluation Report
//
//              Q1       Q2       Q3       Q4       Yearly Average
// ----------------------------------------------------------------
// Agriculture   85       88       90       92          88.75
// Accounts      90       85       88       91          88.50
// IT            95       90       92       94          92.75
// HR            90       89       91       90          90.00
// ----------------------------------------------------------------
// Average       90       88       90.25    91.75
// ----------------------------------------------------------------
// Yearly Average                                      90.00
//
//
// QUARTERLY:
//
// Computer Department – Q1 Evaluation Report
//
//              Q1
// -------------------------------
// Agriculture   85
// Accounts      90
// IT            95
// HR            90
// -------------------------------
// Average       90
// =====================================================


const generateExcelReport = async (
    report = {},
    options = {}
) => {

    const workbook =
        new ExcelJS.Workbook();


    // =====================================================
    // WORKBOOK INFORMATION
    // =====================================================

    workbook.creator =
        "USI Management Portal";

    workbook.lastModifiedBy =
        "USI Management Portal";

    workbook.created =
        new Date();

    workbook.modified =
        new Date();


    // =====================================================
    // WORKSHEET
    // =====================================================

    const sheetName =
        options.sheetName ||
        "HOD Report";


    const worksheet =
        workbook.addWorksheet(
            sheetName
        );


    // =====================================================
    // REPORT INFORMATION
    // =====================================================

    const departmentName =
        report.departmentName ??
        report.department_name ??
        report.hodDepartmentName ??
        report.hod_department_name ??
        report.department ??
        "Department";


    const financialYear =
        report.financialYear ??
        report.financial_year ??
        "";


    const period =
        String(
            report.period ??
            "YEARLY"
        )
            .trim()
            .toUpperCase();


    // =====================================================
    // TITLE
    // =====================================================

    let title;


    if (
        period === "YEARLY"
    ) {

        title =
            `${departmentName} – Yearly Evaluation Report`;

    } else {

        title =
            `${departmentName} – ${period} Evaluation Report`;

    }


    const titleColumnCount =
        period === "YEARLY"
            ? 6
            : 2;


    worksheet.mergeCells(
        1,
        1,
        1,
        titleColumnCount
    );


    const titleCell =
        worksheet.getCell(
            "A1"
        );


    titleCell.value =
        title;


    titleCell.font = {
        bold: true,
        size: 16
    };


    titleCell.alignment = {
        horizontal: "center",
        vertical: "middle"
    };


    worksheet.getRow(1).height =
        30;


    // =====================================================
    // FINANCIAL YEAR
    // =====================================================

    worksheet.mergeCells(
        2,
        1,
        2,
        titleColumnCount
    );


    const yearCell =
        worksheet.getCell(
            "A2"
        );


    yearCell.value =
        financialYear
            ? `Financial Year: ${financialYear}`
            : "";


    yearCell.font = {
        bold: true,
        size: 11
    };


    yearCell.alignment = {
        horizontal: "center",
        vertical: "middle"
    };


    worksheet.getRow(2).height =
        20;


    // =====================================================
    // EMPTY ROW
    // =====================================================

    worksheet.addRow([]);


    // =====================================================
    // REPORT
    // =====================================================

    if (
        period === "YEARLY"
    ) {

        generateYearlyReport(
            worksheet,
            report
        );

    } else {

        generateQuarterlyReport(
            worksheet,
            report,
            period
        );

    }


    // =====================================================
    // PAGE SETUP
    // =====================================================

    worksheet.pageSetup = {

        orientation:
            period === "YEARLY"
                ? "landscape"
                : "portrait",

        fitToPage:
            true,

        fitToWidth:
            1,

        fitToHeight:
            0,

        paperSize:
            9,

        horizontalDpi:
            300,

        verticalDpi:
            300

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


    // =====================================================
    // PRINT OPTIONS
    // =====================================================

    worksheet.printOptions = {

        horizontalCentered:
            true,

        verticalCentered:
            false

    };


    // =====================================================
    // VIEW
    // =====================================================

    worksheet.views = [

        {
            state:
                "frozen",

            ySplit:
                4
        }

    ];


    // =====================================================
    // RETURN EXCEL BUFFER
    // =====================================================

    return await workbook.xlsx.writeBuffer();

};


// =====================================================
// YEARLY REPORT
// =====================================================

const generateYearlyReport = (
    worksheet,
    report
) => {

    // =====================================================
    // HEADERS
    // =====================================================

    const headers = [

        "Department",

        "Q1",

        "Q2",

        "Q3",

        "Q4",

        "Yearly Average"

    ];


    const headerRow =
        worksheet.addRow(
            headers
        );


    styleHeader(
        headerRow
    );


    // =====================================================
    // REPORT DATA
    // =====================================================

    const rows =
        getReportRows(
            report
        );


    // =====================================================
    // DEPARTMENT ROWS
    // =====================================================

    rows.forEach(
        item => {

            const q1 =
                getValue(
                    item,
                    "Q1"
                );


            const q2 =
                getValue(
                    item,
                    "Q2"
                );


            const q3 =
                getValue(
                    item,
                    "Q3"
                );


            const q4 =
                getValue(
                    item,
                    "Q4"
                );


            // =================================================
            // YEARLY AVERAGE
            // =================================================

            let yearly =
                getValue(
                    item,
                    "YEARLY"
                );


            if (
                yearly === null ||
                yearly === undefined
            ) {

                yearly =
                    getValue(
                        item,
                        "yearly"
                    );

            }


            if (
                yearly === null ||
                yearly === undefined
            ) {

                yearly =
                    calculateAverage([
                        q1,
                        q2,
                        q3,
                        q4
                    ]);

            }


            const row =
                worksheet.addRow([

                    getDepartmentName(
                        item
                    ),

                    formatScore(
                        q1
                    ),

                    formatScore(
                        q2
                    ),

                    formatScore(
                        q3
                    ),

                    formatScore(
                        q4
                    ),

                    formatScore(
                        yearly
                    )

                ]);


            styleDataRow(
                row
            );

        }
    );


    // =====================================================
    // AVERAGE SEPARATOR
    // =====================================================

    addTopBorderToLastRow(
        worksheet
    );


    // =====================================================
    // QUARTER AVERAGES
    // =====================================================

    const averages =
        report.averages ??
        report.average ??
        {};


    let q1Average =
        getAverageValue(
            averages,
            "Q1"
        );


    let q2Average =
        getAverageValue(
            averages,
            "Q2"
        );


    let q3Average =
        getAverageValue(
            averages,
            "Q3"
        );


    let q4Average =
        getAverageValue(
            averages,
            "Q4"
        );


    // =====================================================
    // IF BACKEND DOES NOT SEND AVERAGES,
    // CALCULATE FROM REPORT ROWS
    // =====================================================

    if (
        q1Average === null ||
        q1Average === undefined
    ) {

        q1Average =
            calculateAverage(
                rows.map(
                    item =>
                        getValue(
                            item,
                            "Q1"
                        )
                )
            );

    }


    if (
        q2Average === null ||
        q2Average === undefined
    ) {

        q2Average =
            calculateAverage(
                rows.map(
                    item =>
                        getValue(
                            item,
                            "Q2"
                        )
                )
            );

    }


    if (
        q3Average === null ||
        q3Average === undefined
    ) {

        q3Average =
            calculateAverage(
                rows.map(
                    item =>
                        getValue(
                            item,
                            "Q3"
                        )
                )
            );

    }


    if (
        q4Average === null ||
        q4Average === undefined
    ) {

        q4Average =
            calculateAverage(
                rows.map(
                    item =>
                        getValue(
                            item,
                            "Q4"
                        )
                )
            );

    }


    // =====================================================
    // YEARLY AVERAGE
    // =====================================================

    let yearlyAverage =
        getAverageValue(
            averages,
            "yearly"
        );


    if (
        yearlyAverage === null ||
        yearlyAverage === undefined
    ) {

        yearlyAverage =
            calculateAverage([

                q1Average,

                q2Average,

                q3Average,

                q4Average

            ]);

    }


    // =====================================================
    // AVERAGE ROW
    // =====================================================

    const averageRow =
        worksheet.addRow([

            "Average",

            formatScore(
                q1Average
            ),

            formatScore(
                q2Average
            ),

            formatScore(
                q3Average
            ),

            formatScore(
                q4Average
            ),

            ""

        ]);


    styleAverageRow(
        averageRow
    );


    // =====================================================
    // SEPARATOR AFTER QUARTER AVERAGE
    // =====================================================

    addBottomBorder(
        worksheet
    );


    // =====================================================
    // YEARLY AVERAGE ROW
    // =====================================================

    const yearlyRow =
        worksheet.addRow([

            "Yearly Average",

            "",

            "",

            "",

            "",

            formatScore(
                yearlyAverage
            )

        ]);


    styleYearlyAverageRow(
        yearlyRow
    );


    // =====================================================
    // COLUMN WIDTHS
    // =====================================================

    setYearlyColumnWidths(
        worksheet
    );

};


// =====================================================
// QUARTERLY REPORT
// =====================================================

const generateQuarterlyReport = (
    worksheet,
    report,
    period
) => {

    // =====================================================
    // HEADER
    // =====================================================

    const headers = [

        "Department",

        period

    ];


    const headerRow =
        worksheet.addRow(
            headers
        );


    styleHeader(
        headerRow
    );


    // =====================================================
    // REPORT DATA
    // =====================================================

    const rows =
        getReportRows(
            report
        );


    // =====================================================
    // DEPARTMENT ROWS
    // =====================================================

    rows.forEach(
        item => {

            let score =
                getValue(
                    item,
                    period
                );


            // =================================================
            // FALLBACK FOR QUARTERLY RESPONSE
            // =================================================

            if (
                score === null ||
                score === undefined
            ) {

                score =
                    item.score ??
                    item.average ??
                    item.rating ??
                    item.value ??
                    null;

            }


            const row =
                worksheet.addRow([

                    getDepartmentName(
                        item
                    ),

                    formatScore(
                        score
                    )

                ]);


            styleDataRow(
                row
            );

        }
    );


    // =====================================================
    // SEPARATOR BEFORE AVERAGE
    // =====================================================

    addTopBorderToLastRow(
        worksheet
    );


    // =====================================================
    // AVERAGE
    // =====================================================

    let average =
        report.average;


    if (
        average === null ||
        average === undefined
    ) {

        average =
            getAverageValue(
                report.averages,
                period
            );

    }


    // =====================================================
    // CALCULATE IF NOT PROVIDED
    // =====================================================

    if (
        average === null ||
        average === undefined
    ) {

        average =
            calculateAverage(
                rows.map(
                    item => {

                        let value =
                            getValue(
                                item,
                                period
                            );


                        if (
                            value === null ||
                            value === undefined
                        ) {

                            value =
                                item.score ??
                                item.average ??
                                item.rating ??
                                item.value ??
                                null;

                        }


                        return value;

                    }
                )
            );

    }


    // =====================================================
    // AVERAGE ROW
    // =====================================================

    const averageRow =
        worksheet.addRow([

            "Average",

            formatScore(
                average
            )

        ]);


    styleAverageRow(
        averageRow
    );


    // =====================================================
    // COLUMN WIDTH
    // =====================================================

    setQuarterlyColumnWidths(
        worksheet
    );

};


// =====================================================
// GET REPORT ROWS
// =====================================================

const getReportRows = (
    report
) => {

    if (
        Array.isArray(
            report.rows
        )
    ) {

        return report.rows;

    }


    if (
        Array.isArray(
            report.departments
        )
    ) {

        return report.departments;

    }


    if (
        Array.isArray(
            report.data
        )
    ) {

        return report.data;

    }


    if (
        Array.isArray(
            report.results
        )
    ) {

        return report.results;

    }


    return [];

};


// =====================================================
// GET DEPARTMENT NAME
// =====================================================

const getDepartmentName = (
    item = {}
) => {

    return (

        item.departmentName ??

        item.department_name ??

        item.targetDepartmentName ??

        item.target_department_name ??

        item.name ??

        item.department ??

        "Department"

    );

};


// =====================================================
// GET VALUE
// =====================================================

const getValue = (
    item = {},
    period
) => {

    if (
        !period
    ) {

        return null;

    }


    const normalized =
        String(
            period
        )
            .trim()
            .toUpperCase();


    const variants = [

        normalized,

        normalized.toLowerCase(),

        `average_${normalized.toLowerCase()}`,

        `${normalized.toLowerCase()}_average`,

        `avg_${normalized.toLowerCase()}`,

        `${normalized.toLowerCase()}_avg`

    ];


    for (
        const key
        of variants
    ) {

        if (
            item[key] !== undefined &&
            item[key] !== null
        ) {

            return item[key];

        }

    }


    // =====================================================
    // SPECIAL YEARLY VARIANTS
    // =====================================================

    if (
        normalized === "YEARLY"
    ) {

        const yearlyVariants = [

            "yearly",

            "Yearly",

            "YEARLY",

            "yearly_average",

            "yearlyAverage",

            "YEARLY_AVERAGE",

            "annual",

            "annual_average",

            "annualAverage"

        ];


        for (
            const key
            of yearlyVariants
        ) {

            if (
                item[key] !== undefined &&
                item[key] !== null
            ) {

                return item[key];

            }

        }

    }


    return null;

};


// =====================================================
// GET AVERAGE VALUE
// =====================================================

const getAverageValue = (
    averages = {},
    key
) => {

    if (
        !averages ||
        typeof averages !== "object"
    ) {

        return null;

    }


    const normalized =
        String(
            key
        )
            .trim()
            .toUpperCase();


    const variants = [

        key,

        normalized,

        normalized.toLowerCase(),

        `${normalized}Average`,

        `${normalized}_average`,

        `${normalized.toLowerCase()}Average`,

        `${normalized.toLowerCase()}_average`,

        `average_${normalized.toLowerCase()}`,

        `avg_${normalized.toLowerCase()}`

    ];


    // =====================================================
    // YEARLY SPECIAL CASE
    // =====================================================

    if (
        normalized === "YEARLY"
    ) {

        variants.push(

            "yearly",

            "YEARLY",

            "Yearly",

            "yearlyAverage",

            "yearly_average",

            "YEARLY_AVERAGE",

            "annual",

            "annualAverage",

            "annual_average"

        );

    }


    for (
        const variant
        of variants
    ) {

        if (
            averages[variant] !== undefined &&
            averages[variant] !== null
        ) {

            return averages[variant];

        }

    }


    return null;

};


// =====================================================
// CALCULATE AVERAGE
// =====================================================

const calculateAverage = (
    values = []
) => {

    const validValues =
        values
            .filter(
                value => {

                    if (
                        value === null ||
                        value === undefined ||
                        value === ""
                    ) {

                        return false;

                    }


                    const number =
                        Number(value);


                    return !Number.isNaN(
                        number
                    );

                }
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


    return (
        total /
        validValues.length
    );

};


// =====================================================
// FORMAT SCORE
// =====================================================

const formatScore = (
    value
) => {

    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {

        return "";

    }


    const number =
        Number(value);


    if (
        Number.isNaN(
            number
        )
    ) {

        return value;

    }


    return Number(
        number.toFixed(2)
    );

};


// =====================================================
// HEADER STYLE
// =====================================================

const styleHeader = (
    row
) => {

    row.font = {

        bold:
            true,

        size:
            11

    };


    row.alignment = {

        horizontal:
            "center",

        vertical:
            "middle",

        wrapText:
            true

    };


    row.height =
        25;


    row.eachCell(
        cell => {

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

};


// =====================================================
// DATA ROW STYLE
// =====================================================

const styleDataRow = (
    row
) => {

    row.alignment = {

        vertical:
            "middle"

    };


    row.height =
        21;


    row.eachCell(
        (
            cell,
            columnNumber
        ) => {

            cell.border = {

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
                columnNumber === 1
            ) {

                cell.alignment = {

                    horizontal:
                        "left",

                    vertical:
                        "middle"

                };

            } else {

                cell.alignment = {

                    horizontal:
                        "center",

                    vertical:
                        "middle"

                };

            }

        }
    );

};


// =====================================================
// AVERAGE ROW STYLE
// =====================================================

const styleAverageRow = (
    row
) => {

    row.font = {

        bold:
            true

    };


    row.alignment = {

        vertical:
            "middle"

    };


    row.height =
        22;


    row.eachCell(
        (
            cell,
            columnNumber
        ) => {

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
                columnNumber === 1
            ) {

                cell.alignment = {

                    horizontal:
                        "left",

                    vertical:
                        "middle"

                };

            } else {

                cell.alignment = {

                    horizontal:
                        "center",

                    vertical:
                        "middle"

                };

            }

        }
    );

};


// =====================================================
// YEARLY AVERAGE STYLE
// =====================================================

const styleYearlyAverageRow = (
    row
) => {

    row.font = {

        bold:
            true,

        size:
            12

    };


    row.height =
        25;


    row.alignment = {

        vertical:
            "middle"

    };


    row.eachCell(
        (
            cell,
            columnNumber
        ) => {

            cell.border = {

                top: {
                    style:
                        "thin"
                },

                bottom: {
                    style:
                        "double"
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
                columnNumber === 1
            ) {

                cell.alignment = {

                    horizontal:
                        "left",

                    vertical:
                        "middle"

                };

            } else {

                cell.alignment = {

                    horizontal:
                        "center",

                    vertical:
                        "middle"

                };

            }

        }
    );

};


// =====================================================
// TOP BORDER
// =====================================================

const addTopBorderToLastRow = (
    worksheet
) => {

    const row =
        worksheet.lastRow;


    if (
        !row
    ) {

        return;

    }


    row.eachCell(
        cell => {

            cell.border = {

                ...cell.border,

                top: {
                    style:
                        "thin"
                }

            };

        }
    );

};


// =====================================================
// BOTTOM BORDER
// =====================================================

const addBottomBorder = (
    worksheet
) => {

    const row =
        worksheet.lastRow;


    if (
        !row
    ) {

        return;

    }


    row.eachCell(
        cell => {

            cell.border = {

                ...cell.border,

                bottom: {
                    style:
                        "thin"
                }

            };

        }
    );

};


// =====================================================
// YEARLY COLUMN WIDTHS
// =====================================================

const setYearlyColumnWidths = (
    worksheet
) => {

    worksheet.getColumn(1).width =
        28;


    worksheet.getColumn(2).width =
        14;


    worksheet.getColumn(3).width =
        14;


    worksheet.getColumn(4).width =
        14;


    worksheet.getColumn(5).width =
        14;


    worksheet.getColumn(6).width =
        20;

};


// =====================================================
// QUARTERLY COLUMN WIDTHS
// =====================================================

const setQuarterlyColumnWidths = (
    worksheet
) => {

    worksheet.getColumn(1).width =
        30;


    worksheet.getColumn(2).width =
        18;

};


// =====================================================
// EXPORT
// =====================================================

module.exports = {

    generateExcelReport

};