const PDFDocument = require("pdfkit");

/**
 * Generates a PDF document buffer containing tabular data.
 * @param {string} title Report title
 * @param {string[]} dataHeaders Table column headers
 * @param {any[][]} dataRows Table rows
 * @returns {Promise<Buffer>}
 */
const generatePDFReport = (title, dataHeaders, dataRows) => {
    return new Promise((resolve, reject) => {
        const doc = new PDFDocument({ margin: 30, size: "A4" });
        const buffers = [];

        doc.on("data", buffers.push.bind(buffers));
        doc.on("end", () => {
            const pdfData = Buffer.concat(buffers);
            resolve(pdfData);
        });
        doc.on("error", reject);

        // Header / Logo area
        doc.fontSize(22).font("Helvetica-Bold").text("User Satisfaction Index (USI)", { align: "center" });
        doc.fontSize(14).font("Helvetica-Oblique").text(title, { align: "center" });
        doc.moveDown(1.5);

        // Metadata
        doc.fontSize(9).font("Helvetica").text(`Generated on: ${new Date().toLocaleString()}`, { align: "right" });
        doc.moveDown();

        // Simple Table layout
        let y = doc.y;
        const startX = 30;
        const endX = 565; // A4 width is 595, minus 30 margin
        const tableWidth = endX - startX;
        const colWidth = tableWidth / dataHeaders.length;

        // Draw headers
        doc.fontSize(10).font("Helvetica-Bold");
        dataHeaders.forEach((header, index) => {
            doc.text(header, startX + index * colWidth, y, { width: colWidth - 5, align: "left" });
        });

        y += 18;
        doc.moveTo(startX, y).lineTo(endX, y).strokeColor("#aaaaaa").lineWidth(1).stroke();
        y += 8;

        // Draw rows
        doc.fontSize(9).font("Helvetica");
        dataRows.forEach(row => {
            // Check for page break
            if (y > 750) {
                doc.addPage();
                y = 30;
                // Re-draw table headers on new page
                doc.fontSize(10).font("Helvetica-Bold");
                dataHeaders.forEach((header, index) => {
                    doc.text(header, startX + index * colWidth, y, { width: colWidth - 5, align: "left" });
                });
                y += 18;
                doc.moveTo(startX, y).lineTo(endX, y).strokeColor("#aaaaaa").lineWidth(1).stroke();
                y += 8;
                doc.fontSize(9).font("Helvetica");
            }

            row.forEach((cell, index) => {
                const textVal = cell === null || cell === undefined ? "" : String(cell);
                doc.text(textVal, startX + index * colWidth, y, { width: colWidth - 5, align: "left" });
            });
            y += 16;
        });

        doc.end();
    });
};

module.exports = {
    generatePDFReport
};
