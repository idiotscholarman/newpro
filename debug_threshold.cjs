const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');

function parseExcelWithHeader(filePath) {
    if (!fs.existsSync(filePath)) return { rows: [], headerIdx: -1, cols: {} };

    const workbook = xlsx.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rows = xlsx.utils.sheet_to_json(sheet, { header: 1 });

    // Find header row (Case insensitive)
    let headerIdx = -1;
    const cols = { inst: -1, rank: -1, cites: -1, papers: -1 };

    for (let i = 0; i < Math.min(rows.length, 20); i++) {
        const row = rows[i].map(c => String(c).toLowerCase());

        // Match columns
        const instIdx = row.findIndex(c => c.includes('institution') || c.includes('机构'));
        const citesIdx = row.findIndex(c => c === 'citations' || c === '被引' || c === 'citations per paper' ? false : c.includes('citation') || c.includes('被引'));
        const papersIdx = row.findIndex(c => c === 'papers' || c === 'web of science documents' || c === 'wos documents' || c === '论文');

        if (instIdx !== -1 && citesIdx !== -1 && papersIdx !== -1) {
            headerIdx = i;
            cols.inst = instIdx;
            cols.cites = citesIdx;
            cols.papers = papersIdx;
            console.log('Found headers at row', i, cols);
            break;
        }
    }

    return { rows, headerIdx, cols };
}

const file = 'data/esi_rankings/202601/03Chemistry.xlsx';
const fullPath = path.resolve(process.cwd(), file);

console.log('Reading:', fullPath);
const { rows, headerIdx, cols } = parseExcelWithHeader(fullPath);

const allInstitutions = [];
for (let i = headerIdx + 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row) continue;
    const name = String(row[cols.inst] || '').trim().toUpperCase();
    if (!name || name.includes('COPYRIGHT')) continue;

    const p = parseInt(row[cols.papers]) || 0;
    const c = parseInt(row[cols.cites]) || 0;
    const cpp = p > 0 ? c / p : 0;

    allInstitutions.push({ name, papers: p, citations: c, cpp });
}

console.log('Total institutions:', allInstitutions.length);

// Sort by citations descending (standard ESI ranking)
allInstitutions.sort((a, b) => b.citations - a.citations);

const last5PercentCount = Math.max(1, Math.ceil(allInstitutions.length * 0.05));
console.log('Last 5% count:', last5PercentCount);

const last5Percent = allInstitutions.slice(-last5PercentCount);
console.log('First of last 5%:', last5Percent[0]);
console.log('Last of last 5% (Bottom):', last5Percent[last5Percent.length - 1]);

const avgPapers = Math.round(last5Percent.reduce((sum, i) => sum + i.papers, 0) / last5Percent.length);
const avgCpp = last5Percent.reduce((sum, i) => sum + i.cpp, 0) / last5Percent.length;

console.log('Calculated Thresholds:');
console.log('Avg Papers (Bottom 5%):', avgPapers);
console.log('Avg CPP (Bottom 5%):', avgCpp.toFixed(2));
console.log('Min Citations (Last Place):', last5Percent[last5Percent.length - 1].citations);
