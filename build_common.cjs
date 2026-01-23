const xlsx = require('xlsx');
const fs = require('fs');
const path = require('path');

const baseInstDir = path.join(__dirname, 'data/esi_institution');
const outputCommonPath = path.join(__dirname, 'public/data/common.json');
const mappingPath = path.join(__dirname, 'src/translated_mapping.json');

function log(msg) {
    console.log(`[CommonData] ${msg}`);
}

function buildCommonData() {
    try {
        log("Starting common data generation...");

        // 1. Detect latest institution folder
        const folders = fs.readdirSync(baseInstDir)
            .filter(f => /^\d+$/.test(f) && fs.statSync(path.join(baseInstDir, f)).isDirectory())
            .sort().reverse();

        if (folders.length === 0) throw new Error("No data folders found in data/esi_institution");

        const latestFolder = folders[0];
        log(`Reading from latest folder: ${latestFolder}`);

        const folderPath = path.join(baseInstDir, latestFolder);
        const excelFile = fs.readdirSync(folderPath).find(f => f.startsWith('IndicatorsExport') && f.endsWith('.xlsx'));

        if (!excelFile) throw new Error("IndicatorsExport file not found");

        const workbook = xlsx.readFile(path.join(folderPath, excelFile));
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = xlsx.utils.sheet_to_json(sheet, { header: 1 });

        // 2. Find Headers
        let headerRowIdx = -1, instColIdx = -1, countryColIdx = -1;
        let rankColIdx = -1, citesColIdx = -1, papersColIdx = -1;

        for (let i = 0; i < Math.min(20, rows.length); i++) {
            const row = (rows[i] || []).map(c => String(c || '').toUpperCase().trim());
            if (row.some(c => c.includes("INSTITUTION") || c.includes("机构")) &&
                row.some(c => c.includes("CITES") || c.includes("被引"))) {
                headerRowIdx = i;
                instColIdx = row.findIndex(c => c.includes("INSTITUTION") || c.includes("机构"));
                countryColIdx = row.findIndex(c => c.includes("COUNTRY") || c.includes("REGION") || c.includes("国家"));
                rankColIdx = row.findIndex(c => c.includes("RANK") || c.includes("INDICATORS"));
                citesColIdx = row.findIndex(c => c === "CITES" || c === "CITATIONS" || c.includes("被引"));
                papersColIdx = row.findIndex(c => c.includes("WEB OF SCIENCE") || c === "PAPERS" || c.includes("论文"));

                if (rankColIdx === -1) rankColIdx = (instColIdx === 0) ? -1 : 0;
                break;
            }
        }

        if (headerRowIdx === -1) throw new Error("Header row not found");

        // 3. Auto-detect country column if missing
        if (countryColIdx === -1) {
            // Simple heuristic scanning
            const sampleKeywords = ["CHINA", "USA"];
            const colScores = {};
            for (let i = headerRowIdx + 1; i < Math.min(headerRowIdx + 20, rows.length); i++) {
                (rows[i] || []).forEach((val, idx) => {
                    if (idx === instColIdx) return;
                    if (sampleKeywords.some(k => String(val).toUpperCase().includes(k))) colScores[idx] = (colScores[idx] || 0) + 1;
                });
            }
            const best = Object.entries(colScores).sort((a, b) => b[1] - a[1])[0];
            if (best) countryColIdx = parseInt(best[0]);
        }

        // 4. Load Mappings
        let nameMapping = {};
        if (fs.existsSync(mappingPath)) {
            nameMapping = JSON.parse(fs.readFileSync(mappingPath, 'utf8'));
        }
        const caseInsensitiveMapping = {};
        Object.entries(nameMapping).forEach(([k, v]) => caseInsensitiveMapping[k.toUpperCase().trim()] = v);

        // 5. Extract Rankings
        const rankings = [];
        const chinaKeywords = ["CHINA MAINLAND", "CHINA", "HONG KONG", "MACAO", "TAIWAN", "PEOPLES R CHINA"];

        for (let i = headerRowIdx + 1; i < rows.length; i++) {
            const row = rows[i];
            if (!row || !row[instColIdx]) continue;

            // Check Country
            let isChina = false;
            if (countryColIdx !== -1) {
                const cVal = String(row[countryColIdx]).toUpperCase();
                if (chinaKeywords.some(k => cVal.includes(k))) isChina = true;
            }

            if (isChina) {
                const instName = row[instColIdx];
                const upperName = String(instName).toUpperCase().trim();
                const cnName = caseInsensitiveMapping[upperName] || instName;

                rankings.push({
                    rank: parseInt(row[rankColIdx]) || 0,
                    name: instName,
                    cnName: cnName,
                    citations: parseInt(row[citesColIdx]) || 0,
                    papers: parseInt(row[papersColIdx]) || 0
                });
            }
        }

        // Sort by Rank
        rankings.sort((a, b) => a.rank - b.rank);

        // 6. Write JSON
        const commonData = {
            updatedAt: new Date().toLocaleString(),
            sourceDate: latestFolder,
            rankings: rankings
        };

        // Ensure directory exists
        const publicDataDir = path.dirname(outputCommonPath);
        if (!fs.existsSync(publicDataDir)) fs.mkdirSync(publicDataDir, { recursive: true });

        fs.writeFileSync(outputCommonPath, JSON.stringify(commonData, null, 2));
        log(`Successfully generated common.json with ${rankings.length} entries.`);

    } catch (e) {
        console.error("Error generating common data:", e);
        process.exit(1);
    }
}

buildCommonData();
