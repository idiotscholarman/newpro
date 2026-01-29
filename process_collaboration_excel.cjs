const XLSX = require('xlsx');
const fs = require('fs');

const inputFile = 'data/southwest_minzu/合作机构/Incites Organizations.xlsx';
const outputFile = 'public/data/collaboration_institutions.json';

// Column Mapping - CORRECTED
const COL_NAME = "Name";
const COL_PAPERS = "Web of Science Documents";
const COL_CITATIONS = "Times Cited";
const COL_CNCI = "Category Normalized Citation Impact";
const COL_COUNTRY = "Country or Region"; // ACTUAL COLUMN IN EXCEL (F column)

function processExcel() {
    console.log(`Reading file: ${inputFile}...`);

    if (!fs.existsSync(inputFile)) {
        console.error(`Error: File not found at ${inputFile}`);
        return;
    }

    const workbook = XLSX.readFile(inputFile);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    const rawData = XLSX.utils.sheet_to_json(worksheet);
    console.log(`Found ${rawData.length} rows.`);

    // Process and filter data
    const institutions = rawData.map(row => {
        const name = row[COL_NAME];
        const papers = parseInt(row[COL_PAPERS]) || 0;
        const citations = parseInt(row[COL_CITATIONS]) || 0;
        const cnci = parseFloat(row[COL_CNCI]) || 0;
        const country = row[COL_COUNTRY] || "Unknown";

        // Filter out home institution and baseline
        if (name && (
            name.includes("Southwest Minzu") ||
            name.toUpperCase().includes("SOUTHWEST MINZU") ||
            name.includes("西南民族") ||
            name.includes("Global Baseline")
        )) return null;

        return {
            name: name,
            papers: papers,
            citations: citations,
            cnci: cnci,
            country: country
        };
    }).filter(item => item && item.papers > 0)
        .sort((a, b) => b.papers - a.papers);

    fs.writeFileSync(outputFile, JSON.stringify(institutions, null, 2));
    console.log(`Successfully saved ${institutions.length} institutions to ${outputFile}`);
    console.log("Top 5:", institutions.slice(0, 5));

    // Statistics
    const withCountry = institutions.filter(i => i.country && i.country !== "Unknown").length;
    console.log(`Country coverage: ${withCountry}/${institutions.length} (${(withCountry / institutions.length * 100).toFixed(1)}%)`);
}

processExcel();
