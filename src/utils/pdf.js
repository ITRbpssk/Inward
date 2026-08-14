const PDFDocument = require("pdfkit");

/**
 * Generates a professional PDF report with a properly formatted table.
 *
 * @param {string} title Report title
 * @param {string[]} dataHeaders Table column headers
 * @param {any[][]} dataRows Table rows
 * @returns {Promise<Buffer>}
 */
const generatePDFReport = (title, dataHeaders, dataRows) => {

    return new Promise((resolve, reject) => {

        const doc = new PDFDocument({
            margin: 35,
            size: "A4",
            bufferPages: true
        });

        const buffers = [];

        doc.on("data", buffers.push.bind(buffers));

        doc.on("end", () => {
            resolve(Buffer.concat(buffers));
        });

        doc.on("error", reject);


        // =====================================================
        // PAGE CONSTANTS
        // =====================================================

        const pageWidth = doc.page.width;
        const pageHeight = doc.page.height;

        const margin = 35;

        const startX = margin;
        const tableWidth =
            pageWidth - (margin * 2);

        const bottomMargin = 45;


        // =====================================================
        // REPORT HEADER
        // =====================================================

        doc
            .font("Helvetica-Bold")
            .fontSize(21)
            .fillColor("#172033")
            .text(
                "User Satisfaction Index (USI)",
                startX,
                35,
                {
                    width: tableWidth,
                    align: "center"
                }
            );


        doc
            .moveDown(0.35)
            .font("Helvetica")
            .fontSize(11)
            .fillColor("#56647a")
            .text(
                title,
                startX,
                doc.y,
                {
                    width: tableWidth,
                    align: "center"
                }
            );


        // Small separator
        const separatorY =
            doc.y + 12;

        doc
            .moveTo(startX, separatorY)
            .lineTo(
                startX + tableWidth,
                separatorY
            )
            .strokeColor("#dce2ea")
            .lineWidth(1)
            .stroke();


        // =====================================================
        // GENERATED DATE
        // =====================================================

        doc
            .font("Helvetica")
            .fontSize(8.5)
            .fillColor("#7a8597")
            .text(
                `Generated on: ${new Date().toLocaleString()}`,
                startX,
                separatorY + 12,
                {
                    width: tableWidth,
                    align: "right"
                }
            );


        // =====================================================
        // TABLE POSITION
        // =====================================================

        let y =
            separatorY + 38;


        // =====================================================
        // COLUMN WIDTHS
        // =====================================================

        let columnWidths;


        /*
         * Different reports have different column structures.
         *
         * Detailed department report:
         *
         * Parameter Name
         * Description
         * Weightage (%)
         * Average Rating
         */

        if (
    dataHeaders.includes("Parameter Name") &&
    dataHeaders.includes("Description")
) {

    // ==========================================
    // DETAILED DEPARTMENT REPORT
    // ==========================================

    columnWidths = [
        tableWidth * 0.24,
        tableWidth * 0.40,
        tableWidth * 0.16,
        tableWidth * 0.20
    ];

} else {

    // ==========================================
    // GENERAL DEPARTMENT SCORE REPORT
    // ==========================================

    columnWidths = [
        tableWidth * 0.16,  // Code
        tableWidth * 0.38,  // Department Name
        tableWidth * 0.23,  // Score Received
        tableWidth * 0.23   // Score Given
    ];

}

        // =====================================================
        // TABLE STYLING
        // =====================================================

        const headerHeight = 34;

        const cellPaddingX = 8;

        const cellPaddingY = 8;

        const rowFontSize = 9;

        const headerFontSize = 9;


        // =====================================================
        // DRAW TABLE HEADER
        // =====================================================

        const drawTableHeader = () => {

            // Header background

            doc
                .rect(
                    startX,
                    y,
                    tableWidth,
                    headerHeight
                )
                .fill("#eef3fb");


            let x = startX;


            dataHeaders.forEach(
                (header, index) => {

                    const width =
                        columnWidths[index];


                    doc
                        .font("Helvetica-Bold")
                        .fontSize(headerFontSize)
                        .fillColor("#26344b")
                        .text(
                            String(header),
                            x + cellPaddingX,
                            y + 10,
                            {
                                width:
                                    width -
                                    (cellPaddingX * 2),
                                align:
                                    index >= 2
                                        ? "center"
                                        : "left",
                                lineGap: 2
                            }
                        );


                    x += width;

                }
            );


            // Header bottom border

            doc
                .moveTo(
                    startX,
                    y + headerHeight
                )
                .lineTo(
                    startX + tableWidth,
                    y + headerHeight
                )
                .strokeColor("#cfd7e3")
                .lineWidth(1)
                .stroke();


            y += headerHeight;

        };


        // =====================================================
        // INITIAL HEADER
        // =====================================================

        drawTableHeader();


        // =====================================================
        // DRAW DATA ROW
        // =====================================================

        dataRows.forEach((row, rowIndex) => {

            // -------------------------------------------------
            // CALCULATE ROW HEIGHT
            // -------------------------------------------------

            let rowHeight = 0;


            row.forEach(
                (cell, index) => {

                    const textVal =
                        cell === null ||
                        cell === undefined
                            ? ""
                            : String(cell);


                    const width =
                        columnWidths[index];


                    const textHeight =
                        doc
                            .font("Helvetica")
                            .fontSize(rowFontSize)
                            .heightOfString(
                                textVal,
                                {
                                    width:
                                        width -
                                        (cellPaddingX * 2),
                                    lineGap: 2
                                }
                            );


                    const requiredHeight =
                        textHeight +
                        (cellPaddingY * 2);


                    rowHeight =
                        Math.max(
                            rowHeight,
                            requiredHeight
                        );

                }
            );


            // Minimum row height

            rowHeight =
                Math.max(
                    rowHeight,
                    32
                );


            // -------------------------------------------------
            // PAGE BREAK
            // -------------------------------------------------

            if (
                y + rowHeight >
                pageHeight - bottomMargin
            ) {

                doc.addPage();

                y = 40;

                drawTableHeader();

            }


            // -------------------------------------------------
            // ALTERNATE ROW BACKGROUND
            // -------------------------------------------------

            if (rowIndex % 2 === 1) {

                doc
                    .rect(
                        startX,
                        y,
                        tableWidth,
                        rowHeight
                    )
                    .fill("#f9fbfd");

            }


            // -------------------------------------------------
            // DRAW VERTICAL COLUMNS
            // -------------------------------------------------

            let x = startX;


            row.forEach(
                (cell, index) => {

                    const width =
                        columnWidths[index];


                    const textVal =
                        cell === null ||
                        cell === undefined
                            ? ""
                            : String(cell);


                    // Cell text

                    doc
                        .font("Helvetica")
                        .fontSize(rowFontSize)
                        .fillColor("#354158")
                        .text(
                            textVal,
                            x + cellPaddingX,
                            y + cellPaddingY,
                            {
                                width:
                                    width -
                                    (cellPaddingX * 2),

                                align:
                                    index >= 2
                                        ? "center"
                                        : "left",

                                lineGap: 2
                            }
                        );


                    // Vertical line

                    doc
                        .moveTo(
                            x,
                            y
                        )
                        .lineTo(
                            x,
                            y + rowHeight
                        )
                        .strokeColor("#e1e6ed")
                        .lineWidth(0.6)
                        .stroke();


                    x += width;

                }
            );


            // Right border

            doc
                .moveTo(
                    startX + tableWidth,
                    y
                )
                .lineTo(
                    startX + tableWidth,
                    y + rowHeight
                )
                .strokeColor("#e1e6ed")
                .lineWidth(0.6)
                .stroke();


            // Bottom border

            doc
                .moveTo(
                    startX,
                    y + rowHeight
                )
                .lineTo(
                    startX + tableWidth,
                    y + rowHeight
                )
                .strokeColor("#dfe5ec")
                .lineWidth(0.7)
                .stroke();


            // Move to next row

            y += rowHeight;

        });


        // =====================================================
        // TABLE OUTER BORDER
        // =====================================================

        const tableBottom = y;

        const tableTop =
            separatorY + 38;


        doc
            .rect(
                startX,
                tableTop,
                tableWidth,
                tableBottom - tableTop
            )
            .strokeColor("#cfd7e3")
            .lineWidth(0.8)
            .stroke();


        // =====================================================
        // FOOTER
        // =====================================================

        const range =
            doc.bufferedPageRange();


        for (
            let i = range.start;
            i < range.start + range.count;
            i++
        ) {

            doc.switchToPage(i);


            doc
                .font("Helvetica")
                .fontSize(7.5)
                .fillColor("#8a94a5")
                .text(
                    `User Satisfaction Index (USI)  •  Page ${i + 1} of ${range.count}`,
                    margin,
                    pageHeight - 25,
                    {
                        width:
                            pageWidth -
                            (margin * 2),
                        align: "center"
                    }
                );

        }


        // =====================================================
        // FINISH
        // =====================================================

        doc.end();

    });

};


module.exports = {
    generatePDFReport
};