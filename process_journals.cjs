const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

const inputPath = 'd:\\home_project\\newpro\\data\\southwest_minzu\\发文期刊\\西南民大发文期刊详情.xlsx';
const outputPath = 'd:\\home_project\\newpro\\public\\data\\journal_stats.json';

try {
    const workbook = XLSX.readFile(inputPath);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rawData = XLSX.utils.sheet_to_json(sheet);

    const cleanData = rawData.map(row => ({
        name: row['期刊'] || 'Unknown',
        papers: Number(row['发文量']) || 0,
        citations: Number(row['被引频次']) || 0,
        cpp: Number(row['篇均被引频次']) || 0,
        contribution: Number(row['被引贡献率']) || 0,
        jcr: row['JCR分区'] || 'N/A',
        rank: Number(row['Rank']) || 999,
        percentCited: Number(row['% Docs Cited']) || 0
    })).filter(d => d.papers > 0);

    // Ensure output directory exists
    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(outputPath, JSON.stringify(cleanData, null, 2));
    console.log(`Successfully processed ${cleanData.length} journals to ${outputPath}`);

} catch (error) {
    console.error("Error processing journal data:", error.message);
    process.exit(1);
}
