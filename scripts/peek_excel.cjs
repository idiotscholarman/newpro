const XLSX = require('xlsx');
const path = require('path');

const filePath = path.join(__dirname, '../data/southwest_minzu/合作国家地区/Incites Locations.xlsx');

try {
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });

    console.log("Headers:", JSON.stringify(data[0]));
    console.log("Row 1:", JSON.stringify(data[1]));
    console.log("Row 2:", data[2]);
    console.log("Total Rows:", data.length);
} catch (error) {
    console.error("Error reading file:", error.message);
}
