const fs = require('fs');
const readline = require('readline');
const path = require('path');

const inputFile = 'data/southwest_minzu/学院贡献/savedrecs (1).txt';
const mappingFile = 'public/data/college_mapping.json';
const outputFile = 'public/data/college_stats.json';

const TARGET_INST_ALIASES = ['SOUTHWEST MINZU UNIV', 'SOUTHWEST UNIV NATIONALITIES', 'SOUTHWEST UNIV MINZU'];

async function processData() {
    console.log('Loading mapping...');
    const mappingConfig = JSON.parse(fs.readFileSync(mappingFile, 'utf8'));

    console.log('Processing WOS file...');
    const fileStream = fs.createReadStream(inputFile);
    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
    });

    const collegeStats = {};

    let currentTag = '';
    let record = { c1: [], tc: 0 };
    let c1Buffer = [];
    let processedCount = 0;

    for await (const line of rl) {
        if (!line.trim()) continue;

        const tagMatch = line.match(/^([A-Z][A-Z0-9])(?: (.*))?$/);

        if (tagMatch) {
            if (currentTag === 'C1' && c1Buffer.length > 0) {
                record.c1.push(...extractAddresses(c1Buffer.join(' ')));
                c1Buffer = [];
            }

            currentTag = tagMatch[1];
            const content = tagMatch[2] || '';

            if (currentTag === 'C1') {
                c1Buffer.push(content);
            } else if (currentTag === 'TC') {
                record.tc = parseInt(content) || 0;
            } else if (currentTag === 'ER') {
                if (currentTag === 'C1' && c1Buffer.length > 0) {
                    record.c1.push(...extractAddresses(c1Buffer.join(' ')));
                    c1Buffer = [];
                }

                if (processedCount < 3) {
                    console.log(`[DEBUG] Record ${processedCount}:`, JSON.stringify(record.c1));
                }

                processRecord(record, mappingConfig, collegeStats);
                processedCount++;

                record = { c1: [], tc: 0 };
                c1Buffer = [];
                currentTag = '';
            }
        } else if (currentTag === 'C1' && line.startsWith('   ')) {
            c1Buffer.push(line.trim());
        }
    }

    const sortedStats = Object.entries(collegeStats)
        .map(([name, stats]) => ({
            name,
            papers: stats.papers,
            citations: stats.citations,
            cpp: stats.papers > 0 ? (stats.citations / stats.papers).toFixed(2) : 0
        }))
        .sort((a, b) => b.papers - a.papers);

    fs.writeFileSync(outputFile, JSON.stringify(sortedStats, null, 2));
    console.log(`Examples processed. Stats saved to ${outputFile}`);
    console.log('Top 5 Colleges:', sortedStats.slice(0, 5));
}

function extractAddresses(text) {
    return text.split('[').map(part => {
        if (!part.includes(']')) return '';
        return part.split(']')[1].trim().toUpperCase();
    }).filter(a => a);
}

function processRecord(record, mappingConfig, stats) {
    const attributedColleges = new Set();

    record.c1.forEach(address => {
        if (TARGET_INST_ALIASES.some(alias => address.includes(alias))) {

            let cleanAddr = address;
            TARGET_INST_ALIASES.forEach(alias => {
                cleanAddr = cleanAddr.replace(alias, '');
            });

            let match = null;
            for (const rule of mappingConfig.mappings) {
                if (rule.keywords.some(kw => cleanAddr.includes(kw))) {
                    match = rule.name;
                    break;
                }
            }

            if (match) {
                attributedColleges.add(match);
            } else {
                // Determine unmapped?
            }
        }
    });

    attributedColleges.forEach(college => {
        if (!stats[college]) {
            stats[college] = { papers: 0, citations: 0 };
        }
        stats[college].papers += 1;
        stats[college].citations += record.tc;
    });
}

processData().catch(console.error);
