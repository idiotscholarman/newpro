const fs = require('fs');
const xlsx = require('xlsx');
const path = require('path');

const file = 'data/esi_rankings/202601/03Chemistry.xlsx';
const fullPath = path.resolve(process.cwd(), file);

console.log('Reading:', fullPath);
const workbook = xlsx.readFile(fullPath);
const sheetName = workbook.SheetNames[0];
console.log('Sheet:', sheetName);
const sheet = workbook.Sheets[sheetName];
const rows = xlsx.utils.sheet_to_json(sheet, { header: 1 });

console.log('First 15 rows:');
for (let i = 0; i < 15; i++) {
    console.log(`[${i}]`, JSON.stringify(rows[i]));
}
