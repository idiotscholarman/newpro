
import xlsx from 'xlsx';
import path from 'path';

const filePath = 'data/org/Incites Organizations.xlsx';
const workbook = xlsx.readFile(filePath);
const sheetName = workbook.SheetNames[0];
const sheet = workbook.Sheets[sheetName];
const data = xlsx.utils.sheet_to_json(sheet, { header: 1 });

console.log('Headers:', data[0]);
console.log('First 5 rows:', data.slice(1, 6));
