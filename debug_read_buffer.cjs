const xlsx = require('xlsx');
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'data/incites_institution_publications_by_year/20251125_all_2015.xlsx');
console.log(`Reading: ${filePath}`);

try {
    const buf = fs.readFileSync(filePath);
    console.log(`Buffer length: ${buf.length}`);
    const wb = xlsx.read(buf, { type: 'buffer' });
    console.log("Read success!");
    console.log("Sheet names:", wb.SheetNames);
} catch (e) {
    console.error("Read failed:", e.message);
    if (e.stack) console.error(e.stack);
}
