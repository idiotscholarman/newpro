const xlsx = require('xlsx');
const fs = require('fs');
const path = require('path');

const logFile = path.join(__dirname, 'esi_update_log.txt');
function log(msg) {
    try {
        fs.appendFileSync(logFile, msg + '\n');
        console.log(msg);
    } catch (e) { console.log(msg); }
}

const baseInstDir = path.join(__dirname, 'data/esi_institution');
const jsonPath = path.join(__dirname, 'src/data.json');
const targetInst = 'SOUTHWEST MINZU UNIVERSITY';

function getDataFromFolder(folderName) {
    if (!folderName) return null;
    const folderPath = path.join(baseInstDir, folderName);
    if (!fs.existsSync(folderPath)) return null;

    let excelPath = null;
    try {
        const files = fs.readdirSync(folderPath);
        const excelFile = files.find(f => f.startsWith('IndicatorsExport') && f.endsWith('.xlsx'));
        if (excelFile) {
            excelPath = path.join(folderPath, excelFile);
        }
    } catch (e) {
        return null;
    }

    if (!excelPath) return null;

    try {
        const workbook = xlsx.readFile(excelPath);
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        // Use header:1 to get array of arrays, allowing us to find the header row dynamically
        const rows = xlsx.utils.sheet_to_json(sheet, { header: 1 });

        if (!rows || rows.length === 0) return null;

        // 1. Find Header Row
        // Look for a row that contains "Institutions" and "Cites" (or "Citations")
        let headerRowIdx = -1;
        let instColIdx = -1;
        let countryColIdx = -1;
        let rankColIdx = -1;
        let citesColIdx = -1;
        let papersColIdx = -1;
        let topPapersColIdx = -1;

        for (let i = 0; i < Math.min(20, rows.length); i++) {
            const row = rows[i] || [];
            // Skip rows that look like titles (too few columns)
            const filledCols = row.filter(c => c !== undefined && c !== null && String(c).trim() !== '').length;
            if (filledCols < 3) continue;

            const rowUpper = row.map(c => String(c || '').trim().toUpperCase());

            // STRICTER CHECK: Must have Institution AND (Cites OR Papers OR Web of Science Documents)
            const hasInst = rowUpper.some(c => c.includes("INSTITUTION") || c.includes("机构"));
            const hasMetrics = rowUpper.some(c => c.includes("CITES") || c.includes("CITATION") || c.includes("被引") || c.includes("WEB OF SCIENCE") || c.includes("PAPER") || c.includes("DOCUMENT"));

            if (hasInst && hasMetrics) {
                headerRowIdx = i;
                // Find column indices
                instColIdx = rowUpper.findIndex(c => c.includes("INSTITUTION") || c.includes("机构"));
                countryColIdx = rowUpper.findIndex(c => c.includes("COUNTRY") || c.includes("REGION") || c.includes("国家") || c.includes("地区"));

                // Rank often not labeled explicitly or matches "Indicators Results List"
                rankColIdx = rowUpper.findIndex(c => c.includes("RANK") || c.includes("INDICATORS RESULTS LIST"));

                citesColIdx = rowUpper.findIndex(c => c === "CITES" || c === "CITATIONS" || c.includes("被引"));
                papersColIdx = rowUpper.findIndex(c => c === "WEB OF SCIENCE DOCUMENTS" || c === "PAPERS" || c.includes("论文"));
                topPapersColIdx = rowUpper.findIndex(c => c.includes("TOP PAPERS") || c.includes("高被引"));

                // Fallback for Rank: If header detected but rank explicit col not found, assume it is Col 0 (common in ESI)
                // UNLESS Inst Name is Col 0.
                if (rankColIdx === -1) {
                    rankColIdx = (instColIdx === 0) ? -1 : 0;
                }

                break;
            }
        }

        if (headerRowIdx === -1 || instColIdx === -1) {
            log(`Could not find valid header row in ${folderName} (searched first 20 rows)`);
            log("--- DEBUG: First 5 Rows ---");
            for (let i = 0; i < Math.min(5, rows.length); i++) log(JSON.stringify(rows[i]));
            return null;
        }

        // AUTO-DETECT Country Column if not found in header
        // ESI sometimes names it "Countries/Regions" or just doesn't label it clearly?
        if (countryColIdx === -1) {
            log("Country header not found, attempting auto-detection via data scan...");
            const sampleKeywords = ["USA", "CHINA", "JAPAN", "GERMANY", "UK", "FRANCE"];
            const colScores = {};

            // Scan next 10 rows
            for (let i = headerRowIdx + 1; i < Math.min(headerRowIdx + 11, rows.length); i++) {
                const row = rows[i];
                if (!row) continue;
                row.forEach((val, idx) => {
                    if (idx === instColIdx) return; // Skip name col
                    const sVal = String(val || '').toUpperCase();
                    if (sampleKeywords.some(k => sVal.includes(k))) {
                        colScores[idx] = (colScores[idx] || 0) + 1;
                    }
                });
            }

            // Find max score
            let bestCol = -1;
            let maxScore = 0;
            for (const [col, score] of Object.entries(colScores)) {
                if (score > maxScore) {
                    maxScore = score;
                    bestCol = parseInt(col);
                }
            }

            if (bestCol !== -1) {
                countryColIdx = bestCol;
                log(`Auto-detected Country Column at Index ${countryColIdx}`);
            } else {
                log("Failed to auto-detect Country Column. Domestic filtering will fail.");
            }
        }

        log(`Confirmed Header at Row ${headerRowIdx}. Inst: ${instColIdx}, Country: ${countryColIdx}, Rank: ${rankColIdx}`);

        // Load translation mapping
        let nameMapping = {};
        let caseInsensitiveMapping = {};
        try {
            const mappingPath = path.join(__dirname, 'src/translated_mapping.json');
            if (fs.existsSync(mappingPath)) {
                nameMapping = JSON.parse(fs.readFileSync(mappingPath, 'utf8'));
                // Create uppercase map for case checking
                for (const [key, val] of Object.entries(nameMapping)) {
                    caseInsensitiveMapping[key.toUpperCase().trim()] = val;
                }
            } else {
                // Try looking in root if not in src (path.join(__dirname, 'src/...') vs just 'src/...')
                // The previous prompt said 'src/translated_mapping.json'. 
                // If script is in root, path.join(__dirname, 'src/...') is correct.
            }
        } catch (e) {
            log("Warning: Could not load translation mapping: " + e.message);
        }

        // 2. Iterate Data Rows
        let foundRow = null;
        const rankings = [];
        const chinaKeywords = ["CHINA MAINLAND", "CHINA", "HONG KONG", "MACAO", "TAIWAN", "PEOPLES R CHINA"];

        // DEBUG: Track first few rows to ensure we are reading right column
        let debugRowsCount = 0;

        for (let i = headerRowIdx + 1; i < rows.length; i++) {
            const row = rows[i];
            if (!row || row.length === 0) continue;

            const instName = row[instColIdx];

            // DEBUG: Log first 3 institutions seen
            if (debugRowsCount < 3) {
                log(`Debug Row ${i}: InstName='${instName}', Country='${row[countryColIdx]}'`);
                debugRowsCount++;
            }

            if (!instName || typeof instName !== 'string') continue;

            // Clean name for comparison
            const cleanInstName = instName.toUpperCase().trim();
            // ... strict compare ...


            // Extract metrics
            const rank = parseInt(row[rankColIdx]) || 0;
            const cites = parseInt(row[citesColIdx]) || 0;
            const papers = parseInt(row[papersColIdx]) || 0;
            const topPapers = parseInt(row[topPapersColIdx]) || 0;

            // Check if it's our target
            if (cleanInstName === targetInst) {
                foundRow = {
                    rank, cites, papers, topPapers
                };
            }

            // Check if it's a Chinese institution
            let isChina = false;
            // Strategy A: Use Country Column if found
            if (countryColIdx !== -1) {
                const countryVal = String(row[countryColIdx]).toUpperCase();
                if (chinaKeywords.some(k => countryVal.includes(k))) {
                    isChina = true;
                }
            }
            // Strategy B: Fallback - Scan logic if no country col (unlikely for ESI) or just as safety
            else {
                // Scan all columns? No, might be too slow or match paper title. 
                // If no country column, maybe we skip or try to guess.
                // Let's assume ESI export always has it if filter wasn't applied during export.
            }

            if (isChina) {
                const upperName = instName.toUpperCase().trim();
                const cnName = caseInsensitiveMapping[upperName] || instName; // Fallback to English

                rankings.push({
                    rank: rank,
                    name: instName,
                    cnName: cnName,
                    citations: cites,
                    papers: papers
                });
            }
        }

        if (!foundRow) {
            log(`Target institution not found in ${folderName}`);
            return null;
        }

        rankings.sort((a, b) => a.rank - b.rank);
        const myDomesticRank = rankings.findIndex(r => r.name.toUpperCase().trim() === targetInst) + 1;

        return {
            rank: foundRow.rank,
            citations: foundRow.cites,
            papers: foundRow.papers,
            topPapers: foundRow.topPapers,
            rankings: rankings,
            domesticRank: myDomesticRank
        };

    } catch (e) {
        log(`Error reading data from ${folderName}: ${e.message}`);
        return null;
    }
}

try {
    log("Starting update process...");

    // 1. Detect Folders
    let folders = [];
    try {
        folders = fs.readdirSync(baseInstDir)
            .filter(f => /^\d+$/.test(f) && fs.statSync(path.join(baseInstDir, f)).isDirectory())
            .sort()
            .reverse();
    } catch (e) {
        log("Error listing directories: " + e.message);
    }

    if (folders.length === 0) {
        log("No data folders found.");
        process.exit(1);
    }

    const latestFolder = folders[0];
    const prevFolder = folders.length > 1 ? folders[1] : null;

    log(`Latest folder: ${latestFolder}, Previous folder: ${prevFolder || 'None'}`);

    // 2. Fetch Data
    const latestData = getDataFromFolder(latestFolder);
    if (!latestData) {
        log("Failed to extract data from latest folder.");
        process.exit(1);
    }

    const prevData = getDataFromFolder(prevFolder);

    log(`Latest Data: Rank ${latestData.rank}, Citations ${latestData.citations}, Papers ${latestData.papers}`);
    if (prevData) {
        log(`Previous Data: Rank ${prevData.rank}, Citations ${prevData.citations}, Papers ${prevData.papers}`);
    }

    // 3. Update data.json
    if (!fs.existsSync(jsonPath)) {
        log("data.json not found");
        process.exit(1);
    }

    // 2.5 Fetch Annual Publication Trend & Citation Analysis
    const pubsDir = path.join(__dirname, 'data/incites_institution_publications_by_year');
    const pubTrend = [];

    if (fs.existsSync(pubsDir)) {
        try {
            const pubFiles = fs.readdirSync(pubsDir).filter(f => f.endsWith('.xlsx') && !f.startsWith('~$'));

            log(`Found ${pubFiles.length} publication history files.`);

            for (const file of pubFiles) {
                // Extract Year
                const yearMatch = file.match(/_(\d{4})\.xlsx$/);
                if (!yearMatch) continue;
                const year = yearMatch[1];

                try {
                    log(`Reading data for ${year} from ${file}...`);
                    const wb = xlsx.readFile(path.join(pubsDir, file));
                    const ws = wb.Sheets[wb.SheetNames[0]];
                    const pRows = xlsx.utils.sheet_to_json(ws, { header: 1 });

                    // Fixed indices based on user request: Col 1(Name), 2(Papers), 3(Cites), 4(CPP), 5(CNCI)
                    // Indices: 0, 1, 2, 3, 4
                    let pHeaderIdx = -1;
                    let pNameIdx = 0;
                    let pDocsIdx = 1;
                    let pCitesIdx = 2;
                    let pCppIdx = 3;
                    let pCnciIdx = 4;

                    // Simple detection to be safe
                    for (let k = 0; k < Math.min(20, pRows.length); k++) {
                        const r = (pRows[k] || []).map(c => String(c || '').toUpperCase());
                        if (r.some(c => c.includes("ORGANIZATION") || c.includes("NAME") || c.includes("机构"))) {
                            pHeaderIdx = k;
                            // Update indices if header found
                            pNameIdx = r.findIndex(c => c.includes("ORGANIZATION") || c.includes("NAME") || c.includes("机构"));
                            const docsI = r.findIndex(c => c.includes("WEB OF SCIENCE DOCUMENTS") || c.includes("PAPERS") || c.includes("论文"));
                            if (docsI !== -1) pDocsIdx = docsI;

                            const citesI = r.findIndex(c => c === "CITES" || c === "CITATIONS" || c.includes("被引"));
                            if (citesI !== -1) pCitesIdx = citesI;

                            const cppI = r.findIndex(c => c.includes("PER PAPER") || c.includes("篇均"));
                            if (cppI !== -1) pCppIdx = cppI;

                            const cnciI = r.findIndex(c => c.includes("CNCI") || c.includes("CATEGORY NORMALIZED"));
                            if (cnciI !== -1) pCnciIdx = cnciI;

                            break;
                        }
                    }

                    if (pHeaderIdx !== -1) {
                        let myStats = null;
                        let baseStats = null;

                        for (let k = pHeaderIdx + 1; k < pRows.length; k++) {
                            const r = pRows[k];
                            if (!r) continue;
                            const nameVal = String(r[pNameIdx] || '').toUpperCase().trim();

                            if (nameVal === targetInst) {
                                myStats = {
                                    papers: parseInt(r[pDocsIdx]) || 0,
                                    citations: parseInt(r[pCitesIdx]) || 0,
                                    cpp: parseFloat((parseFloat(r[pCppIdx]) || 0).toFixed(2)),
                                    cnci: parseFloat((parseFloat(r[pCnciIdx]) || 0).toFixed(2))
                                };
                            } else if (nameVal.includes("GLOBAL BASELINE") || nameVal === "BASELINE") {
                                baseStats = {
                                    cpp: parseFloat((parseFloat(r[pCppIdx]) || 0).toFixed(2))
                                };
                            }
                            if (myStats && baseStats) break;
                        }

                        if (myStats) {
                            pubTrend.push({
                                year: year,
                                ...myStats,
                                baselineCpp: baseStats ? baseStats.cpp : 0
                            });
                            log(`  -> ${year}: MyPapers=${myStats.papers}, MyCPP=${myStats.cpp}, BaseCPP=${baseStats?.cpp}`);
                        }
                    }
                } catch (e) {
                    log(`Error reading ${file}: ${e.message}`);
                }
            }
        } catch (e) {
            log("Error accessing publication directory: " + e.message);
        }
    }

    // Sort by year
    pubTrend.sort((a, b) => parseInt(a.year) - parseInt(b.year));

    // 2.6 Fetch Top Author Contributions
    const authorFile = path.join(__dirname, 'data/southwest_minzu/作者贡献/西南民大all作者贡献.xlsx');
    const topAuthors = [];
    if (fs.existsSync(authorFile)) {
        try {
            log("Reading author contributions...");
            const wb = xlsx.readFile(authorFile);
            const ws = wb.Sheets[wb.SheetNames[0]];
            const rows = xlsx.utils.sheet_to_json(ws, { header: 1 });

            // Take Top 20 (Rows 1 to 20)
            for (let i = 1; i <= 20 && i < rows.length; i++) {
                const r = rows[i];
                if (!r || r.length === 0) continue;
                let contrib = r[5];
                // Check if it's a raw number like 0.0805 -> 8.05%
                if (typeof contrib === 'number') {
                    contrib = (contrib * 100).toFixed(2) + '%';
                } else if (typeof contrib === 'string' && !contrib.includes('%')) {
                    // Try to parse string number
                    const num = parseFloat(contrib);
                    if (!isNaN(num)) {
                        contrib = (num * 100).toFixed(2) + '%';
                    }
                }

                topAuthors.push({
                    name: r[0],
                    dept: r[1],
                    papers: parseInt(r[2]) || 0,
                    citations: parseInt(r[3]) || 0,
                    cpp: parseFloat((parseFloat(r[4]) || 0).toFixed(2)),
                    contribution: contrib
                });
            }
            log(`Extracted ${topAuthors.length} top authors.`);
        } catch (e) {
            log("Error reading author file: " + e.message);
        }
    } else {
        log("Author contribution file not found.");
    }

    const jsonData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

    if (!jsonData.overview) jsonData.overview = {};
    jsonData.overview.publicationTrend = pubTrend;
    jsonData.overview.topAuthors = topAuthors;

    jsonData.overview.globalRank = latestData.rank;
    jsonData.overview.totalCitations = latestData.citations;
    jsonData.overview.totalPapers = latestData.papers;
    jsonData.overview.topPapers = latestData.topPapers;
    jsonData.overview.rankings = latestData.rankings; // List of domestic institutions
    jsonData.overview.domesticRank = latestData.domesticRank;

    // Calculate changes
    if (prevData) {
        // Rank: Smaller is better. OLD - NEW. Positive means improved.
        jsonData.overview.globalRankChange = prevData.rank - latestData.rank;
        // Citations/Papers: Larger is better. NEW - OLD. Positive means increased.
        jsonData.overview.totalCitationsChange = latestData.citations - prevData.citations;
        jsonData.overview.totalPapersChange = latestData.papers - prevData.papers;
    } else {
        jsonData.overview.globalRankChange = 0;
        jsonData.overview.totalCitationsChange = 0;
        jsonData.overview.totalPapersChange = 0;
    }

    // Derived metrics
    const disciplines = jsonData.disciplines || [];
    const subjectsCount = disciplines.filter(d => d.isTop1).length;
    const potentialCount = disciplines.filter(d => !d.isTop1 && d.citations > 0 && parseFloat(d.potentialValue) > 50).length;

    jsonData.overview.subjectsCount = subjectsCount;
    jsonData.overview.top1Percent = potentialCount;
    jsonData.updatedAt = new Date().toLocaleString();

    fs.writeFileSync(jsonPath, JSON.stringify(jsonData, null, 2));
    log("data.json updated successfully via automated script.");

} catch (e) {
    log("Critical Error: " + e.message + "\n" + e.stack);
}
