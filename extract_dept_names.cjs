const fs = require('fs');
const readline = require('readline');
const path = require('path');

const inputDir = 'data/southwest_minzu/学院贡献/';
const TARGET_INST_ALIASES = ['SOUTHWEST MINZU UNIV', 'SOUTHWEST UNIV NATIONALITIES', 'SOUTHWEST UNIV MINZU'];

async function analyzeDepartments() {
    const files = fs.readdirSync(inputDir).filter(f => f.endsWith('.txt'));
    console.log(`Analyzing ${files.length} files...`);

    const deptCounts = {};

    for (const file of files) {
        const filePath = path.join(inputDir, file);
        const fileStream = fs.createReadStream(filePath);
        const rl = readline.createInterface({
            input: fileStream,
            crlfDelay: Infinity
        });

        let currentTag = '';
        let c1Buffer = [];

        for await (const line of rl) {
            if (!line.trim()) continue;
            const tagMatch = line.match(/^([A-Z][A-Z0-9])(?: (.*))?$/);

            if (tagMatch) {
                if (currentTag === 'C1' && c1Buffer.length > 0) {
                    processAddressBuffer(c1Buffer.join(' '), deptCounts);
                    c1Buffer = [];
                }
                currentTag = tagMatch[1];
                const content = tagMatch[2] || '';
                if (currentTag === 'C1') c1Buffer.push(content);
            } else if (currentTag === 'C1' && line.startsWith('   ')) {
                c1Buffer.push(line.trim());
            }
        }
    }

    // Sort and Output
    const sortedDepts = Object.entries(deptCounts)
        .sort((a, b) => b[1] - a[1]);

    const outputContent = sortedDepts.map(([name, count]) => `${count}\t${name}`).join('\n');
    fs.writeFileSync('dept_frequency.txt', outputContent);
    console.log('Analysis complete. Results saved to dept_frequency.txt');
    console.log('Top 20 Departments:');
    console.log(sortedDepts.slice(0, 20));
}

function processAddressBuffer(text, counts) {
    text.split('[').forEach(part => {
        if (!part.includes(']')) return;
        const fullAddress = part.split(']')[1].trim();

        const segments = fullAddress.split(',').map(s => s.trim());
        const uniIndex = segments.findIndex(s => TARGET_INST_ALIASES.some(alias => s.toUpperCase().includes(alias)));

        if (uniIndex !== -1) {
            for (let i = 0; i < segments.length; i++) {
                if (i === uniIndex) continue;
                const seg = segments[i].toUpperCase();

                if (seg.match(/\d+/)) continue;
                if (['PEOPLES R CHINA', 'CHINA', 'USA', 'CHENGDU', 'SICHUAN', 'BEIJING'].includes(seg)) continue;

                if (seg.match(/\b(SCH|COLL|DEPT|INST|LAB|CTR|FAC|ACAD|HOSP|DIV|OFF|CTR|UNIV)\b/) || i === uniIndex + 1) {
                    // Clean numeric prefix if any
                    const cleanSeg = seg.replace(/^[0-9\W]+/, '');
                    if (cleanSeg.length > 2) {
                        counts[cleanSeg] = (counts[cleanSeg] || 0) + 1;
                    }
                }
            }
        }
    });
}

analyzeDepartments().catch(console.error);
