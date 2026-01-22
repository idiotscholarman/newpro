const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'data/esi_institution/202601');
const oldPath = path.join(dir, 'IndicatorsExport .xlsx');
const newPath = path.join(dir, 'IndicatorsExport.xlsx');

console.log(`Checking file: ${oldPath}`);
if (fs.existsSync(oldPath)) {
    try {
        fs.renameSync(oldPath, newPath);
        console.log("Rename successful!");
    } catch (e) {
        console.error("Rename failed:", e.message);
    }
} else {
    console.error("File not found (with space). Checking target...");
    if (fs.existsSync(newPath)) {
        console.log("File already renamed.");
    } else {
        console.log("Target file also not found. Listing dir:");
        console.log(fs.readdirSync(dir));
    }
}
