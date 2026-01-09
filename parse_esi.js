const xlsx = require('xlsx');
const path = require('path');
const fs = require('fs');

const logFile = 'd:/home_project/vibe_coding/esi_debug_log.txt';
function log(msg) {
    fs.appendFileSync(logFile, msg + '\n');
}

log("Script started");

const filePath = 'd:/home_project/vibe_coding/data/esi_institution/202511/IndicatorsExport.xlsx';
log("File path: " + filePath);

try {
    if (!fs.existsSync(filePath)) {
        log("File does not search: " + filePath);
        process.exit(1);
    }

    log("Reading file...");
    const workbook = xlsx.readFile(filePath);
    log("Workbook read. Sheets: " + workbook.SheetNames.join(', '));

    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(sheet);
    log("Data parsed. Rows: " + data.length);

    const output = {
        Headers: Object.keys(data[0] || {}),
        FirstRow: data[0]
    };
    fs.writeFileSync('d:/home_project/vibe_coding/esi_debug.json', JSON.stringify(output, null, 2));
    log("Written to esi_debug.json");

} catch (error) {
    log("Error: " + error.message);
    log("Stack: " + error.stack);
}

