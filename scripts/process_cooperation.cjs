const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

const inputPath = path.join(__dirname, '../data/southwest_minzu/合作国家地区/Incites Locations.xlsx');
const outputPath = path.join(__dirname, '../public/data/cooperation_stats.json');

// Mapping Incites names to simpler map names (matching react-simple-maps/topojson)
const nameMapping = {
    "PEOPLES R CHINA": "China",
    "USA": "United States",
    "ENGLAND": "United Kingdom",
    "SCOTLAND": "United Kingdom",
    "WALES": "United Kingdom",
    "NORTH IRELAND": "United Kingdom",
    "GERMANY (FED REP GER)": "Germany",
    "GERMANY": "Germany",
    "AUSTRALIA": "Australia",
    "CANADA": "Canada",
    "JAPAN": "Japan",
    "FRANCE": "France",
    "ITALY": "Italy",
    "SPAIN": "Spain",
    "SOUTH KOREA": "South Korea",
    "TAIWAN": "Taiwan",
    "INDIA": "India",
    "BRAZIL": "Brazil",
    "NETHERLANDS": "Netherlands",
    "RUSSIA": "Russia",
    "SWITZERLAND": "Switzerland",
    "SWEDEN": "Sweden",
    "BELGIUM": "Belgium",
    "POLAND": "Poland",
    "TURKEY": "Turkey",
    "IRAN": "Iran",
    "EGYPT": "Egypt",
    "SAUDI ARABIA": "Saudi Arabia",
    "PAKISTAN": "Pakistan",
    "MALAYSIA": "Malaysia",
    "SINGAPORE": "Singapore",
    "VIETNAM": "Vietnam",
    "THREAD": "Thailand", // Typo check? Usually THAILAND
    "THAILAND": "Thailand"
};

try {
    console.log(`Reading file: ${inputPath}`);
    const workbook = XLSX.readFile(inputPath);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    // Header row is row 0
    const rawData = XLSX.utils.sheet_to_json(sheet);

    console.log(`Total records found: ${rawData.length}`);

    const stats = {};

    rawData.forEach(row => {
        const rawName = row["Name"] || row["Location"]; // Adapt to likely headers
        if (!rawName) return;

        // Skip "Southwest Minzu University" itself if it appears as a location (usually Incites lists it if we exported collaboration)
        // But usually "Locations" file lists PARTNERS.
        // We will normalize name
        let name = rawName.toUpperCase();
        // Simple mapping
        const mapped = Object.keys(nameMapping).find(k => name.includes(k) || name === k);
        const finalName = mapped ? nameMapping[mapped] : rawName; // Fallback to raw if no map

        // Key: Name
        if (!stats[finalName]) {
            stats[finalName] = {
                name: finalName,
                papers: 0,
                citations: 0,
                cnciSum: 0,
                count: 0
            };
        }

        const papers = parseInt(row["Web of Science Documents"] || 0);
        const citations = parseInt(row["Times Cited"] || 0);
        const cnci = parseFloat(row["Category Normalized Citation Impact"] || 0);

        stats[finalName].papers += papers;
        stats[finalName].citations += citations;
        // Weighted CNCI? Or average? Let's just sum for now and avg later if needed, or just store raw
        stats[finalName].cnciSum += (cnci * papers); // Weighted by papers
        stats[finalName].count += papers;
    });

    const result = Object.values(stats)
        .filter(s => s.name !== "Unknown")
        .map(s => ({
            name: s.name,
            papers: s.papers,
            citations: s.citations,
            cnci: s.count > 0 ? parseFloat((s.cnciSum / s.count).toFixed(2)) : 0
        }))
        .sort((a, b) => b.papers - a.papers);

    console.log(`Processed ${result.length} unique locations.`);
    console.log("Top 5:", result.slice(0, 5));

    fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));
    console.log(`Saved to ${outputPath}`);

} catch (err) {
    console.error("Error processing:", err);
}
