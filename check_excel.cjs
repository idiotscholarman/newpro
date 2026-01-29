const XLSX = require('xlsx');
const path = require('path');

const filePath = 'd:\\home_project\\newpro\\data\\southwest_minzu\\发文期刊\\西南民大发文期刊详情.xlsx';

try {
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1 }); // Array of arrays

    console.log("Headers:", data[0]);
    console.log("First Row:", data[1]);
} catch (error) {
    console.error("Error reading file:", error.message);
}
