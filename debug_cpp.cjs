const fs = require('fs');
const xlsx = require('xlsx');
const path = require('path');

const file = 'data/esi_rankings/202601/03Chemistry.xlsx';
const fullPath = path.resolve(process.cwd(), file);

console.log('Reading:', fullPath);
const workbook = xlsx.readFile(fullPath);
const sheet = workbook.Sheets[workbook.SheetNames[0]];
const rows = xlsx.utils.sheet_to_json(sheet, { header: 1 });

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

    const parseNum = (v) => parseInt(String(v || '0').replace(/,/g, ''));
    const papers = parseNum(row[papersCol]);
    const citations = parseNum(row[citesCol]);
    if (citations === 0 && papers === 0) continue;

    // Calculate CPP
    const cpp = papers > 0 ? citations / papers : 0;

    allData.push({ name, papers, citations, cpp });
}

// Sort by citations descending
allData.sort((a, b) => b.citations - a.citations);

const last5Count = Math.max(1, Math.ceil(allData.length * 0.05));
const last5 = allData.slice(-last5Count);

console.log(`Analyzing Bottom ${last5Count} institutions (by Citations)`);

// Calculate Stats
let sumCpp = 0;
let maxCpp = 0;
let minCpp = 999999;
let highCppCount = 0; // > 30
let sumPapers = 0;
let sumCitations = 0;

console.log('--- Sample Bottom Institutions ---');
last5.slice(0, 10).forEach(d => {
    console.log(`[${d.name}] P:${d.papers} C:${d.citations} CPP:${d.cpp.toFixed(2)}`);
});

last5.forEach(d => {
    sumCpp += d.cpp;
    sumPapers += d.papers;
    sumCitations += d.citations;
    if (d.cpp > maxCpp) maxCpp = d.cpp;
    if (d.cpp < minCpp) minCpp = d.cpp;
    if (d.cpp > 30) highCppCount++;
});

const avgCpp = sumCpp / last5Count;
const weightedAvgCpp = sumCitations / sumPapers; // Total Citations / Total Papers of the group

console.log('--- Stats ---');
console.log(`Simple Avg CPP: ${avgCpp.toFixed(2)}`);
console.log(`Weighted Avg CPP (Sum C / Sum P): ${weightedAvgCpp.toFixed(2)}`);
console.log(`Max CPP: ${maxCpp.toFixed(2)}`);
console.log(`Min CPP: ${minCpp.toFixed(2)}`);
console.log(`Count with CPP > 30: ${highCppCount} / ${last5Count}`);
