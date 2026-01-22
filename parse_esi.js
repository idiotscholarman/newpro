import xlsx from 'xlsx';
import path from 'path';
import fs from 'fs';

const logFile = 'esi_debug_log.txt';
function log(msg) {
    fs.appendFileSync(logFile, msg + '\n');
}

log("Script started");

const baseInstDir = path.join(path.resolve(), 'data/esi_institution');
let latestFolder = '202511';
try {
    const folders = fs.readdirSync(baseInstDir).filter(f => /^\d+$/.test(f) && fs.statSync(path.join(baseInstDir, f)).isDirectory());
    if (folders.length > 0) {
        latestFolder = folders.sort().reverse()[0];
        log("Detected latest ESI data folder: " + latestFolder);
    }
} catch (e) {
    log("Warning: Could not detect latest folder, using default: " + latestFolder);
}

const filePath = path.join(baseInstDir, latestFolder, 'IndicatorsExport.xlsx');
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
    fs.writeFileSync('esi_debug.json', JSON.stringify(output, null, 2));
    log("Written to esi_debug.json");

} catch (error) {
    log("Error: " + error.message);
    log("Stack: " + error.stack);
}

