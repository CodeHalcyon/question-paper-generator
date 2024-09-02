const fs = require('fs');
const mammoth = require('mammoth');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const root = require("../root")
async function convertDocxTablesToCsv(inputFilePath) {
    try {
        // Extract raw HTML from the .docx file
        
        const { value } = await mammoth.convertToHtml({ path: inputFilePath });
        
        // Use a regex to find all tables in the HTML
        const tableRegex = /<table>([\s\S]*?)<\/table>/g;
        const tables = [];
        let match;

        // Extract all tables from the document
        while ((match = tableRegex.exec(value)) !== null) {
            tables.push(match[0]);
        }

        if (tables.length === 0) {
            console.error('No tables found in the document.');
            return;
        }

        // Process each table found
        tables.forEach((tableHtml, tableIndex) => {
            const rowRegex = /<tr>([\s\S]*?)<\/tr>/g;
            const cellRegex = /<t[hd]>([\s\S]*?)<\/t[hd]>/g;
            const rows = [];
            let rowMatch;

            // Extract rows and cells
            while ((rowMatch = rowRegex.exec(tableHtml)) !== null) {
                const rowHtml = rowMatch[1];
                const cells = [];
                let cellMatch;

                while ((cellMatch = cellRegex.exec(rowHtml)) !== null) {
                    const cellText = cellMatch[1]
                        .replace(/<[^>]+>/g, '') // Remove any remaining HTML tags
                        .replace(/\s+/g, ' ')    // Replace multiple spaces with single space
                        .trim();                 // Trim leading and trailing spaces
                    cells.push(cellText);
                }

                if (cells.length > 0) {
                    rows.push(cells);
                }
            }

            if (rows.length > 0) {
                // Prepare CSV headers and records
                const headers = rows[0].map((header, index) => ({
                    id: `column${index}`,
                    title: header || `Column ${index + 1}`,
                }));

                const records = rows.slice(1).map(row => {
                    const record = {};
                    row.forEach((cell, index) => {
                        record[`column${index}`] = cell;
                    });
                    return record;
                });

                // Write to a CSV file
                const csvWriter = createCsvWriter({
                    path: `${root}/misc/generatedCsvs/output_table_${tableIndex + 1}.csv`,
                    header: headers,
                });

                csvWriter.writeRecords(records)
                    .then(() => {
                        console.log(`Table ${tableIndex + 1} converted successfully.`);
                    })
                    .catch((err) => {
                        console.error(`Error writing Table ${tableIndex + 1} to CSV:`, err);
                    });
            }
        });

    } catch (error) {
        console.error('An error occurred during conversion:', error);
    }
}

module.exports = {
    convertDocxTablesToCsv
}