const ExcelJS = require("exceljs");

/**
 * Generates an Excel spreadsheet buffer.
 * @param {string[]} headers Array of header strings
 * @param {any[][]} rows Array of row values
 * @param {string} sheetName Name of the worksheet
 * @returns {Promise<Buffer>}
 */
const generateExcelReport = async (headers, rows, sheetName = "Report") => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(sheetName);

    // Add headers
    worksheet.addRow(headers);

    // Add rows
    worksheet.addRows(rows);

    // Style header row
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFE0E0E0" }
    };

    // Auto-fit columns
    worksheet.columns.forEach(column => {
        let maxLength = 0;
        column.eachCell({ includeEmpty: true }, cell => {
            const columnLength = cell.value ? cell.value.toString().length : 10;
            if (columnLength > maxLength) {
                maxLength = columnLength;
            }
        });
        column.width = maxLength < 10 ? 10 : maxLength + 2;
    });

    return await workbook.xlsx.writeBuffer();
};

module.exports = {
    generateExcelReport
};
