const xlsx = require('xlsx');
const fs = require('fs');
const path = require('path');

const logFile = path.join(__dirname, 'esi_db_build_log.txt');
function log(msg) {
    try {
        console.log(msg);
        fs.appendFileSync(logFile, msg + '\n');
    } catch (e) {
        console.log(msg);
    }
}

// Prepare locations
// Note: User can update the folder '202511' to newer dates later.
// Ideally we scan for the latest folder, but for now we hardcode or grab the one we know.
// Let's try to be smart and verify the path exists.
const baseInstDir = path.join(__dirname, 'data/esi_institution');
let latestFolder = '202511'; // Default fallback
try {
    const folders = fs.readdirSync(baseInstDir).filter(f => /^\d+$/.test(f) && fs.statSync(path.join(baseInstDir, f)).isDirectory());
    if (folders.length > 0) {
        latestFolder = folders.sort().reverse()[0];
        log("Detected latest ESI data folder: " + latestFolder);
    }
} catch (e) {
    log("Warning: Could not detect latest folder, using default: " + latestFolder);
}

const baseDataDir = path.join(baseInstDir, latestFolder);
const excelPath = path.join(baseDataDir, 'IndicatorsExport.xlsx');
const dbOutputPath = path.join(__dirname, 'src/esi_stats_db.json');

try {
    // Clear log
    if (fs.existsSync(logFile)) fs.unlinkSync(logFile);

    log("Starting ESI Database Build...");

    if (!fs.existsSync(excelPath)) {
        log(`Error: Excel file not found at ${excelPath}`);
        process.exit(1);
    }

    log("Reading Excel file (this may take a moment)...");
    const workbook = xlsx.readFile(excelPath);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rawData = xlsx.utils.sheet_to_json(sheet);

    log(`Total rows read: ${rawData.length}`);

    const db = {};
    let count = 0;

    rawData.forEach(row => {
        // Identify the Institution Name column. From debug, it's '__EMPTY'
        const instName = row['__EMPTY'];

        // Skip header rows or invalid rows
        // Header row had "Institutions" as value
        if (!instName || instName === 'Institutions' || typeof instName !== 'string') {
            return;
        }

        // Extract metrics
        // Keys from debug:
        // Rank: likely the first column (complex key) or we trust it's the one with valid number
        // Cites: __EMPTY_3
        // Papers: __EMPTY_2
        // Top Papers: __EMPTY_5

        // Finding Rank key dynamically
        const rankKey = Object.keys(row).find(k => k.toLowerCase().includes('result') || k.includes('List'));
        const rank = parseInt(row[rankKey]);

        // Clean up name (ESI often uses ALL CAPS)
        const cleanName = instName.trim().toUpperCase();

        db[cleanName] = {
            globalRank: rank || 0,
            totalCitations: parseInt(row['__EMPTY_3']) || 0,
            totalPapers: parseInt(row['__EMPTY_2']) || 0,
            topPapers: parseInt(row['__EMPTY_5']) || 0,
            citationsPerPaper: parseFloat(row['__EMPTY_4']) || 0
        };
        count++;
    });

    log(`Processed ${count} institutions.`);

    fs.writeFileSync(dbOutputPath, JSON.stringify(db, null, 2));
    log(`Database successfully written to ${dbOutputPath}`);
    log("You can now update your App.jsx to use this file.");

} catch (err) {
    log(`Fatal Error: ${err.message}`);
    log(err.stack);
}
