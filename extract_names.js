import pkg from 'xlsx';
const { readFile, utils } = pkg; // 这种方式在 CommonJS 和 ESM 混用时最稳妥

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const filePath = path.join(__dirname, 'data/org/Incites Organizations.xlsx');
const outputPath = path.join(__dirname, 'names.json');

console.log(`Reading file from: ${filePath}`);

try {
    if (!fs.existsSync(filePath)) {
        console.error(`File not found: ${filePath}`);
        process.exit(1);
    }

    // 现在可以使用解构出来的函数了
    const workbook = readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    const data = utils.sheet_to_json(sheet, { header: 1 });

    if (data.length < 2) {
        console.error('File seems empty or only has header');
        process.exit(1);
    }

    const names = data.slice(1).map(row => row[0]).filter(name => name);
    const uniqueNames = [...new Set(names)];

    fs.writeFileSync(outputPath, JSON.stringify(uniqueNames, null, 2));
    console.log(`Success! Extracted ${uniqueNames.length} unique names to names.json`);

} catch (error) {
    console.error('Error extracting names:', error);
}