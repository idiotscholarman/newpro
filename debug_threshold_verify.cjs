const fs = require('fs');
const xlsx = require('xlsx');
const path = require('path');

const file = 'data/esi_rankings/202601/03Chemistry.xlsx';
const fullPath = path.resolve(process.cwd(), file);

console.log('Reading:', fullPath);
const workbook = xlsx.readFile(fullPath);
const sheet = workbook.Sheets[workbook.SheetNames[0]];
const rows = xlsx.utils.sheet_to_json(sheet, { header: 1 });

// We manually identified columns from dump:
// Col 1: Inst Name
// Col 3: Papers
// Col 4: Citations

const instCol = 1;
const papersCol = 3;
const citesCol = 4;

const allData = [];

for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length < 5) continue;

    // Check if header
    const val = String(row[instCol] || '').toUpperCase();
    if (val.includes('INSTITUTION') || val.includes('NAME') || val.includes('机构')) continue;

    const name = val.trim();
    if (!name || name.includes('COPYRIGHT') || name.includes('SOURCE:')) continue;

    // Remove commas from numbers
    const parseNum = (v) => {
        if (typeof v === 'number') return v;
        return parseInt(String(v || '0').replace(/,/g, ''));
    };

    const papers = parseNum(row[papersCol]);
    const citations = parseNum(row[citesCol]);

    if (citations === 0 && papers === 0) continue;
    // Usually ESI threshold implies > 0 citations. 
    // But technically the last one is the threshold.

    allData.push({ name, papers, citations, rowIdx: i });
}

console.log(`Total institutions loaded: ${allData.length}`);

// Sort by citations descending
allData.sort((a, b) => b.citations - a.citations);

console.log('--- Bottom 20 Institutions ---');
const bottom20 = allData.slice(-20);
bottom20.forEach((d, i) => {
    console.log(`[${allData.length - 20 + i + 1}] ${d.name} | P:${d.papers} | C:${d.citations}`);
});

console.log('--- Threshold Check ---');
console.log('Last Place Citations:', bottom20[bottom20.length - 1].citations);

// Check last 5% avg
const last5Count = Math.ceil(allData.length * 0.05);
const last5 = allData.slice(-last5Count);
const avgP = last5.reduce((s, i) => s + i.papers, 0) / last5Count;
const avgC = last5.reduce((s, i) => s + i.citations, 0) / last5Count;
const avgCpp = last5.reduce((s, i) => s + (i.citations / i.papers), 0) / last5Count;

console.log(`Last 5% Count: ${last5Count}`);
console.log(`Avg Papers: ${Math.round(avgP)}`);
console.log(`Avg CPP: ${avgCpp.toFixed(2)}`);
console.log(`Avg Citations (just for info): ${Math.round(avgC)}`);
