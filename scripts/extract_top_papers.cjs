const fs = require('fs');
const path = require('path');
const readline = require('readline');

// 配置
const INPUT_DIR = path.join(__dirname, '../data/southwest_minzu/学院贡献/');
const MAPPING_FILE = path.join(__dirname, '../public/data/college_mapping.json');
const OUTPUT_FILE = path.join(__dirname, '../public/data/top_papers.json');

// 读取映射规则
let collegeMapping = { mappings: [], default: '其他/未识别' };
if (fs.existsSync(MAPPING_FILE)) {
    collegeMapping = JSON.parse(fs.readFileSync(MAPPING_FILE, 'utf8'));
} else {
    console.warn('Warning: College mapping file not found. All colleges will be undefined.');
}

/**
 * 将学院关键词映射到学院名
 * @param {string[]} addressLines - C1字段的所有行
 * @returns {string[]} - 匹配到的学院列表
 */
function mapColleges(addressLines) {
    if (!addressLines || addressLines.length === 0) return [];

    const matchedColleges = new Set();

    // 只处理本校地址
    const myInstLines = addressLines.filter(line => {
        const upper = line.toUpperCase();
        return upper.includes('SOUTHWEST MINZU') || upper.includes('SOUTHWEST UNIV NAT');
    });

    if (myInstLines.length === 0) {
        // 如果C1没有找到本校，但这是Top Paper，理论上C1必须有。
        // 如果仅在C3出现，无法精确匹配学院。
        return [];
    }

    // 针对每一条【本校】地址行进行匹配
    for (const line of myInstLines) {
        const upperLine = line.toUpperCase();
        for (const map of collegeMapping.mappings) {

            // 检查排除词 (Excludes)
            if (map.excludes && Array.isArray(map.excludes)) {
                let isExcluded = false;
                for (const excludePhrase of map.excludes) {
                    if (upperLine.includes(excludePhrase.toUpperCase())) {
                        isExcluded = true;
                        break;
                    }
                }
                if (isExcluded) continue; // 如果包含排除词，跳过该学院匹配
            }

            for (const keyword of map.keywords) {
                if (upperLine.includes(keyword.toUpperCase())) {
                    matchedColleges.add(map.name);
                    // 同一行中如果匹配到一个学院，通常这一行就归属该学院
                    break;
                }
            }
        }
    }

    return Array.from(matchedColleges);
}

/**
 * 处理单个文件
 */
async function processFile(filePath, papersMap) {
    const fileStream = fs.createReadStream(filePath);
    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
    });

    let currentPaper = {};
    let lastKey = '';

    for await (const line of rl) {
        if (!line) continue;

        // 字段标识符
        const key = line.substring(0, 2).trim();
        const value = line.substring(3).trim();

        if (key === 'PT') {
            // 保存上一条
            if (Object.keys(currentPaper).length > 0) {
                addPaperIfTop(currentPaper, papersMap);
            }
            currentPaper = { PT: value };
            lastKey = 'PT';
        } else if (key === 'ER') {
            // 结束
            addPaperIfTop(currentPaper, papersMap);
            currentPaper = {};
            lastKey = '';
        } else if (key && key.length === 2 && line[2] === ' ') {
            // 新字段
            if (key === 'C1') {
                // C1 特殊处理：始终存为数组
                currentPaper[key] = [value];
            } else {
                if (currentPaper[key]) {
                    if (Array.isArray(currentPaper[key])) {
                        currentPaper[key].push(value);
                    } else {
                        currentPaper[key] = [currentPaper[key], value];
                    }
                } else {
                    currentPaper[key] = value;
                }
            }
            lastKey = key;
        } else if (key === '' && lastKey && line.length > 3) {
            // 延续行
            const continuation = line.substring(3);

            if (lastKey === 'C1') {
                // C1 地址字段的延续行处理
                if (continuation.startsWith('[')) {
                    // 如果以 [ 开头，视为新的一条地址
                    currentPaper[lastKey].push(continuation);
                } else {
                    // 否则是上一条地址的换行延续
                    const arr = currentPaper[lastKey];
                    arr[arr.length - 1] += ' ' + continuation;
                }
            } else {
                // 其他字段保持原有拼接逻辑
                if (Array.isArray(currentPaper[lastKey])) {
                    const arr = currentPaper[lastKey];
                    arr[arr.length - 1] += ' ' + continuation;
                } else {
                    currentPaper[lastKey] += ' ' + continuation;
                }
            }
        }
    }
    // 文件末尾
    if (Object.keys(currentPaper).length > 0) {
        addPaperIfTop(currentPaper, papersMap);
    }
}

function addPaperIfTop(paper, papersMap) {
    if (paper.HC === 'Y' || paper.HP === 'Y') {
        // 使用 UT (WOS Accession Number) 作为唯一ID去重
        const id = paper.UT || paper.DI || paper.TI;
        if (id && !papersMap.has(id)) {
            papersMap.set(id, formatPaper(paper));
        }
    }
}

function formatPaper(raw) {
    let authors = [];
    if (Array.isArray(raw.AF)) authors = raw.AF;
    else if (raw.AF) authors = [raw.AF];
    else if (Array.isArray(raw.AU)) authors = raw.AU;
    else if (raw.AU) authors = [raw.AU];

    // C1 Address
    let addresses = [];
    if (Array.isArray(raw.C1)) addresses = raw.C1;
    else if (raw.C1) addresses = [raw.C1];

    // Map Colleges (Strictly for My Institution)
    const colleges = mapColleges(addresses);

    return {
        title: raw.TI,
        authors: authors,
        journal: raw.SO,
        year: raw.PY,
        volume: raw.VL,
        issue: raw.IS,
        abstract: raw.AB,
        keywords: Array.isArray(raw.DE) ? raw.DE.join('; ') : raw.DE || (Array.isArray(raw.ID) ? raw.ID.join('; ') : raw.ID),
        doi: raw.DI,
        isHot: raw.HP === 'Y',
        isHighlyCited: raw.HC === 'Y',
        colleges: colleges.length > 0 ? colleges : ['其他/未识别']
    };
}

async function main() {
    if (!fs.existsSync(INPUT_DIR)) {
        console.error(`Input directory not found: ${INPUT_DIR}`);
        return;
    }

    const files = fs.readdirSync(INPUT_DIR).filter(f => f.startsWith('savedrecs') && f.endsWith('.txt'));
    console.log(`Found ${files.length} data files.`);

    const papersMap = new Map(); // UT -> Paper

    for (const file of files) {
        console.log(`Processing ${file}...`);
        await processFile(path.join(INPUT_DIR, file), papersMap);
    }

    const papers = Array.from(papersMap.values());
    console.log(`Extracted ${papers.length} unique Top Papers.`);

    // Sort by Year Desc
    papers.sort((a, b) => (b.year || 0) - (a.year || 0));

    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(papers, null, 2));
    console.log(`Saved to ${OUTPUT_FILE}`);
}

main();
