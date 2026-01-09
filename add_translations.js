
import pkg from 'xlsx';
const { readFile, utils, writeFile } = pkg;
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const originalFilePath = path.join(__dirname, 'data/org/Incites Organizations.xlsx');
// Use a new file name to avoid overwriting the original until confirmed, or just overwrite if confident. 
// Plan said "Update Excel file", but safer to create a new one first or overwrite if sure. 
// Let's overwrite as per implied user request "update into xlsx".
const mappingPath = path.join(__dirname, 'translated_mapping.json');

console.log(`Reading Excel file from: ${originalFilePath}`);
console.log(`Reading Mapping from: ${mappingPath}`);

try {
    if (!fs.existsSync(originalFilePath)) {
        console.error(`Excel file not found: ${originalFilePath}`);
        process.exit(1);
    }
    if (!fs.existsSync(mappingPath)) {
        console.error(`Mapping file not found: ${mappingPath}`);
        process.exit(1);
    }

    const mapping = JSON.parse(fs.readFileSync(mappingPath, 'utf8'));
    const workbook = readFile(originalFilePath);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    // Convert to JSON with array of arrays to handle columns easily
    const data = utils.sheet_to_json(sheet, { header: 1 });

    if (data.length < 2) {
        console.error('File seems empty or only has header');
        process.exit(1);
    }

    // Process header
    const headerRow = data[0];
    // Check if cn_name already exists to avoid duplicate columns
    let cnNameIndex = headerRow.indexOf('cn_name');
    if (cnNameIndex === -1) {
        // Insert after first column (Name)
        headerRow.splice(1, 0, 'cn_name');
        cnNameIndex = 1;
    }

    let updatedCount = 0;
    // Process data rows
    for (let i = 1; i < data.length; i++) {
        const row = data[i];
        const originalName = row[0];

        let translatedName = mapping[originalName] || '';
        if (!translatedName) {
            // Trim and try again if direct match failed
            translatedName = mapping[originalName?.trim()] || '';
        }

        // Ensure row has enough columns
        while (row.length < headerRow.length) {
            row.push(null);
        }

        // Update or Insert the translated name
        if (cnNameIndex === 1) {
            // If we just inserted the column in header, we need to insert in rows too
            // actually, splice is safer if we just inserted into header
            if (row.length === headerRow.length - 1) {
                row.splice(1, 0, translatedName);
            } else {
                // Existing row structure might vary, strictly update index 1
                // But wait, if we added to header, we shifted everything right.
                // We should splice only if we spliced the header.
                // Let's assume we construct a NEW data array to be safe.
            }
        }
    }

    // Safer approach: specific reconstruction
    const newData = [];
    newData.push(headerRow); // Header with cn_name at index 1

    for (let i = 1; i < data.length; i++) {
        const oldRow = data[i];
        const name = oldRow[0];
        const translation = mapping[name] || mapping[name?.trim()] || '';

        // Construct new row: [Name, Translation, ...rest of columns]
        const newRow = [name, translation, ...oldRow.slice(1)];
        newData.push(newRow);

        if (translation) updatedCount++;
    }

    // Convert back to sheet
    const newSheet = utils.aoa_to_sheet(newData);
    workbook.Sheets[sheetName] = newSheet;

    writeFile(workbook, originalFilePath);
    console.log(`Success! Updated ${originalFilePath}`);
    console.log(`Filled ${updatedCount} translations.`);

} catch (error) {
    console.error('Error updating Excel:', error);
}
