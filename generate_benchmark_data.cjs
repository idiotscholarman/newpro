/**
 * Generate Benchmark Data for All Institutions
 * This script pre-computes Top Papers, ESI Discipline Count, and Potential Disciplines
 * for all institutions so it can be loaded quickly at runtime.
 */

const xlsx = require('xlsx');
const fs = require('fs');
const path = require('path');

const baseDir = path.join(__dirname, 'data');
const outputPath = path.join(__dirname, 'public/data/benchmark_data.json');

function log(msg) {
    console.log(msg);
}

// Find the latest date folder in a directory
function getLatestDateFolder(dir) {
    if (!fs.existsSync(dir)) return null;
    const folders = fs.readdirSync(dir)
        .filter(f => fs.statSync(path.join(dir, f)).isDirectory() && /^\d{6}$/.test(f))
        .sort()
        .reverse();
    return folders[0] || null;
}

// Read Excel and find header row
function parseExcelWithHeader(filePath) {
    if (!fs.existsSync(filePath)) return { rows: [], headerIdx: -1, cols: {} };

    const workbook = xlsx.readFile(filePath);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = xlsx.utils.sheet_to_json(sheet, { header: 1 });

    let headerIdx = -1;
    let cols = { inst: -1, cites: -1, papers: -1, topPapers: -1, rank: -1 };

    for (let i = 0; i < Math.min(20, rows.length); i++) {
        const row = rows[i] || [];
        const filledCols = row.filter(c => c !== undefined && c !== null && String(c).trim() !== '').length;
        if (filledCols < 3) continue;

        const rowUpper = row.map(c => String(c || '').trim().toUpperCase());
        const hasInst = rowUpper.some(c => c.includes("INSTITUTION") || c.includes("机构") || c.includes("NAME"));
        const hasMetrics = rowUpper.some(c => c.includes("CITES") || c.includes("PAPER") || c.includes("DOCUMENT"));

        if (hasInst && hasMetrics) {
            headerIdx = i;
            cols.inst = rowUpper.findIndex(c => c.includes("INSTITUTION") || c.includes("机构") || c.includes("NAME") || c.includes("ORGANIZATION"));
            cols.cites = rowUpper.findIndex(c => c === "CITES" || c === "CITATIONS" || c.includes("被引") || c.includes("CITED"));
            cols.papers = rowUpper.findIndex(c => c.includes("WEB OF SCIENCE") || c === "PAPERS");
            cols.topPapers = rowUpper.findIndex(c => c.includes("TOP PAPERS") || c.includes("高被引"));
            cols.rank = rowUpper.findIndex(c => c.includes("INDICATOR") || /^\d+$/.test(row[0]));
            if (cols.rank === -1 && cols.inst !== 0) cols.rank = 0;
            break;
        }
    }

    return { rows, headerIdx, cols };
}

async function main() {
    log("=== Benchmark Data Generator ===");

    // 1. Get Top Papers from esi_institution
    const instDir = path.join(baseDir, 'esi_institution');
    const latestInstDate = getLatestDateFolder(instDir);
    log(`Using institution data from: ${latestInstDate}`);

    const instFile = path.join(instDir, latestInstDate, 'IndicatorsExport .xlsx');
    const { rows: instRows, headerIdx: instHeaderIdx, cols: instCols } = parseExcelWithHeader(instFile);

    // Build institution lookup: name -> { topPapers, papers, cites, rank }
    const institutionData = {};

    if (instHeaderIdx !== -1) {
        for (let i = instHeaderIdx + 1; i < instRows.length; i++) {
            const row = instRows[i];
            if (!row) continue;

            const name = String(row[instCols.inst] || '').trim().toUpperCase();
            if (!name || name.includes('COPYRIGHT')) continue;

            institutionData[name] = {
                topPapers: parseInt(row[instCols.topPapers]) || 0,
                papers: parseInt(row[instCols.papers]) || 0,
                citations: parseInt(row[instCols.cites]) || 0,
                rank: parseInt(row[instCols.rank]) || parseInt(row[0]) || 0
            };
        }
    }
    log(`Loaded ${Object.keys(institutionData).length} institutions from IndicatorsExport`);

    // 2. Count ESI disciplines for each institution
    const rankingsDir = path.join(baseDir, 'esi_rankings');
    const latestRankDate = getLatestDateFolder(rankingsDir);
    log(`Using rankings data from: ${latestRankDate}`);

    const rankingsPath = path.join(rankingsDir, latestRankDate);
    const disciplineFiles = fs.readdirSync(rankingsPath).filter(f => f.endsWith('.xlsx') && !f.startsWith('~'));

    // Also store thresholds (last place citations for each discipline)
    const disciplineThresholds = {};

    for (const file of disciplineFiles) {
        const discName = file.replace('.xlsx', '');
        const { rows, headerIdx, cols } = parseExcelWithHeader(path.join(rankingsPath, file));

        if (headerIdx === -1) continue;

        // Find last valid row (threshold) and all institutions in this discipline
        let lastValidRow = null;
        for (let i = headerIdx + 1; i < rows.length; i++) {
            const row = rows[i];
            if (!row) continue;

            const name = String(row[cols.inst] || '').trim().toUpperCase();
            if (!name || name.includes('COPYRIGHT')) continue;

            lastValidRow = row;

            // Mark this institution as having this discipline
            if (institutionData[name]) {
                institutionData[name].esiDisciplines = (institutionData[name].esiDisciplines || 0) + 1;
                institutionData[name].disciplines = institutionData[name].disciplines || [];
                institutionData[name].disciplines.push(discName);

                // Store detailed metrics: [papers, citations]
                institutionData[name].details = institutionData[name].details || {};
                const p = parseInt(row[cols.papers]) || 0;
                const c = parseInt(row[cols.cites]) || 0;
                institutionData[name].details[discName] = [p, c];
            }
        }

        // Store threshold (last place citations)
        if (lastValidRow) {
            const threshold = parseInt(lastValidRow[cols.cites]) || 0;
            disciplineThresholds[discName] = threshold;
        }
    }
    log(`Processed ${disciplineFiles.length} discipline rankings`);

    // 3. Calculate potential disciplines from incites_potential
    const potentialDir = path.join(baseDir, 'incites_potential');
    const potentialFolders = fs.readdirSync(potentialDir).filter(f => fs.statSync(path.join(potentialDir, f)).isDirectory());

    for (const folder of potentialFolders) {
        const discCode = folder.substring(0, 2);
        const discName = folder;

        // Find the latest file in this folder (the one with date in name)
        const files = fs.readdirSync(path.join(potentialDir, folder))
            .filter(f => f.endsWith('.xlsx') && !f.startsWith('~') && f.includes('2015-2025'));

        if (files.length === 0) continue;

        const latestFile = files[0]; // Usually there's only one cumulative file
        const { rows, headerIdx, cols } = parseExcelWithHeader(path.join(potentialDir, folder, latestFile));

        if (headerIdx === -1) continue;

        const threshold = disciplineThresholds[discName] || disciplineThresholds[Object.keys(disciplineThresholds).find(k => k.startsWith(discCode))] || 0;

        if (threshold === 0) continue;

        for (let i = headerIdx + 1; i < rows.length; i++) {
            const row = rows[i];
            if (!row) continue;

            const name = String(row[cols.inst] || '').trim().toUpperCase();
            if (!name || name.includes('COPYRIGHT')) continue;

            const cites = parseInt(row[cols.cites]) || 0;
            const papers = parseInt(row[cols.papers]) || 0;

            // Store detailed metrics if missing (i.e. not in Top 1% ESI Rankings)
            institutionData[name] = institutionData[name] || {};
            institutionData[name].details = institutionData[name].details || {};
            if (!institutionData[name].details[discName]) {
                institutionData[name].details[discName] = [papers, cites];
            }

            const potential = threshold > 0 ? (cites / threshold) * 100 : 0;

            if (institutionData[name] && potential >= 50) {
                const alreadyRanked = institutionData[name].disciplines && institutionData[name].disciplines.includes(discName);
                if (!alreadyRanked) {
                    institutionData[name].potentialDisciplines = (institutionData[name].potentialDisciplines || 0) + 1;
                }
            }
        }
    }
    log(`Processed ${potentialFolders.length} potential discipline folders`);

    // 4. Save to JSON
    // Only keep institutions that have some data
    const outputData = {};
    for (const [name, data] of Object.entries(institutionData)) {
        if (data.rank > 0 || data.esiDisciplines > 0) {
            outputData[name] = {
                topPapers: data.topPapers || 0,
                esiDisciplines: data.esiDisciplines || 0,
                potentialDisciplines: data.potentialDisciplines || 0,
                papers: data.papers || 0,
                citations: data.citations || 0,
                rank: data.rank || 0,
                details: data.details || {}
            };
        }
    }

    // Ensure output directory exists
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    fs.writeFileSync(outputPath, JSON.stringify(outputData, null, 2));
    log(`\nSaved benchmark data for ${Object.keys(outputData).length} institutions to ${outputPath}`);
}

main().catch(e => {
    console.error('Error:', e);
    process.exit(1);
});
