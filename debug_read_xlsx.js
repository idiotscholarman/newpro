const xlsx = require('xlsx');
const path = require('path');

const filePath = path.join(__dirname, 'data/southwest_minzu/作者贡献/西南民大all作者贡献.xlsx');
console.log(`Reading: ${filePath}`);

try {
    const wb = xlsx.readFile(filePath);
    console.log("Read success!");
    console.log("Sheet names:", wb.SheetNames);
    const ws = wb.Sheets[wb.SheetNames[0]];
    const rows = xlsx.utils.sheet_to_json(ws, { header: 1 });
    console.log(`Row count: ${rows.length}`);
    console.log("First row:", rows[0]);
} catch (e) {
    console.error("Read failed:", e.message);
}
