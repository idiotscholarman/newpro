const xlsx = require('xlsx');
const fs = require('fs');
const path = require('path');

const logFile = 'd:/home_project/vibe_coding/esi_update_log.txt';
function log(msg) {
    try {
        fs.appendFileSync(logFile, msg + '\n');
        console.log(msg);
    } catch (e) { console.log(msg); }
}

const excelPath = 'd:/home_project/vibe_coding/data/esi_institution/202511/IndicatorsExport.xlsx';
const jsonPath = 'd:/home_project/vibe_coding/src/data.json';
const targetInst = 'SOUTHWEST MINZU UNIVERSITY';

try {
    log("Starting update process...");

    // 1. Read Excel
    if (!fs.existsSync(excelPath)) {
        log("Excel file not found");
        process.exit(1);
    }
    const workbook = xlsx.readFile(excelPath);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rawData = xlsx.utils.sheet_to_json(sheet);

    // 2. Find Target Row
    // The first row in rawData is likely the header mapping row (Row 2 in Excel)
    // The actual data starts after that.
    // We look for a row where __EMPTY (Institutions column) matches match

    let foundRow = null;

    // iterate
    for (const row of rawData) {
        const instName = row['__EMPTY'];
        if (instName && typeof instName === 'string' && instName.toUpperCase() === targetInst) {
            foundRow = row;
            break;
        }
    }

    if (!foundRow) {
        log("Institution not found in Excel: " + targetInst);
        // List some names to debug
        log("First 5 names found:");
        for (let i = 1; i < Math.min(6, rawData.length); i++) {
            log(rawData[i]['__EMPTY'] || 'null');
        }
        process.exit(1);
    }

    log("Found Institution: " + foundRow['__EMPTY']);

    // 3. Extract Metrics
    // Rank is in the first column. The key is huge.
    // We can just grab the first key of the object? Or use the valid key we saw in debug.
    const keys = Object.keys(foundRow);
    // Assuming the first key corresponds to Column A (Rank)
    // But object keys order isn't guaranteed. Better to find the key that starts with "Indicators Results List"
    const rankKey = keys.find(k => k.startsWith("Indicators Results List"));

    const rank = foundRow[rankKey];
    const citations = foundRow['__EMPTY_3']; // Cites
    const papers = foundRow['__EMPTY_2']; // Web of Science Documents
    const topPapers = foundRow['__EMPTY_5']; // Top Papers

    log(`Extracted - Rank: ${rank}, Citations: ${citations}, Papers: ${papers}, TopPapers: ${topPapers}`);

    // 4. Update data.json
    if (!fs.existsSync(jsonPath)) {
        log("data.json not found");
        process.exit(1);
    }

    const jsonData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

    // Update Overview
    if (!jsonData.overview) jsonData.overview = {};

    jsonData.overview.globalRank = parseInt(rank) || jsonData.overview.globalRank;
    jsonData.overview.totalCitations = parseInt(citations) || jsonData.overview.totalCitations;
    jsonData.overview.totalPapers = parseInt(papers) || jsonData.overview.totalPapers;
    jsonData.overview.topPapers = parseInt(topPapers) || jsonData.overview.topPapers;

    // Also recalculate Subjects Count and Potential from existing disciplines content
    const disciplines = jsonData.disciplines || [];
    const subjectsCount = disciplines.filter(d => d.isTop1).length;
    // Potential: not top 1, citations > 0 AND potentialValue > 50
    // User request: "Potential Subjects Count (potential value > 50%)"
    const potentialCount = disciplines.filter(d => !d.isTop1 && d.citations > 0 && parseFloat(d.potentialValue) > 50).length;

    jsonData.overview.subjectsCount = subjectsCount;
    jsonData.overview.top1Percent = potentialCount;

    // Update timestamp
    jsonData.updatedAt = new Date().toLocaleString();

    fs.writeFileSync(jsonPath, JSON.stringify(jsonData, null, 2));
    log("data.json updated successfully.");

} catch (e) {
    log("Error: " + e.message + "\n" + e.stack);
}
