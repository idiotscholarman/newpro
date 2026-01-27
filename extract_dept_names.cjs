const fs = require('fs');
const readline = require('readline');

const filePath = 'data/southwest_minzu/学院贡献/savedrecs (1).txt';
const targetInsts = ['SOUTHWEST MINZU UNIV', 'SOUTHWEST UNIV NATIONALITIES', 'SOUTHWEST UNIV MINZU'];

async function processLineByLine() {
    const fileStream = fs.createReadStream(filePath);
    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
    });

    let currentTag = '';
    let c1Buffer = [];
    const depts = new Set();

    for await (const line of rl) {
        if (!line.trim()) continue;

        // Check if new tag
        const tagMatch = line.match(/^([A-Z][A-Z0-9]) (.*)/);
        if (tagMatch) {
            // Process previous buffer if it was C1
            if (currentTag === 'C1' && c1Buffer.length > 0) {
                parseC1(c1Buffer.join(' '), depts);
                c1Buffer = [];
            }

            currentTag = tagMatch[1];
            if (currentTag === 'C1') {
                c1Buffer.push(tagMatch[2]);
            }
        } else if (line.startsWith('   ') && currentTag === 'C1') {
            // Continuation line
            c1Buffer.push(line.trim());
        }
    }

    // Process last buffer
    if (currentTag === 'C1' && c1Buffer.length > 0) {
        parseC1(c1Buffer.join(' '), depts);
    }

    console.log('Unique Departments Found:');
    Array.from(depts).sort().forEach(d => console.log(d));
}

function parseC1(text, depts) {
    // Split by closing bracket ']' which separates addresses with author groups
    // Format: [Authors] Address
    const parts = text.split('[');

    parts.forEach(part => {
        if (!part.includes(']')) return;
        const address = part.split(']')[1].trim().toUpperCase();

        // Check if this address belongs to target institution
        if (targetInsts.some(inst => address.includes(inst))) {
            // Address usually: Org, Dept, City, ...
            // Split by comma
            const segments = address.split(',').map(s => s.trim());

            // Find the segment that contains the target institution
            const instIndex = segments.findIndex(s => targetInsts.some(inst => s.includes(inst)));

            if (instIndex !== -1) {
                // The department is usually the NEXT segment after the institution
                // Sometimes it's the one after that if there are multiple hierarchy levels

                // Let's capture all segments AFTER the university name, until the City (usually ends in digits) or Country
                for (let i = instIndex + 1; i < segments.length; i++) {
                    const seg = segments[i];
                    // Heuristic: ignore City (usually has Zip Code or is a known city)
                    if (/\d{5,6}/.test(seg)) continue; // Zip code
                    if (seg === 'PEOPLES R CHINA' || seg === 'CHINA') continue;
                    if (seg === 'SICHUAN' || seg === 'CHENGDU') continue;

                    depts.add(seg);
                }
            }
        }
    });
}

processLineByLine();
