/**
 * 提取22学科的全球基准CPP和CNCI数据
 * 从 data/incites_potential/20251210 的22个学科Excel文件中读取
 */

const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

const BASE_DIR = 'data/incites_potential/20251210';
const OUTPUT_FILE = 'public/data/discipline_quality_metrics.json';
const XNMZ_FILE = 'public/data/xnmz.json';

// 学科文件夹映射
const DISCIPLINE_FOLDERS = [
    { folder: '01Agricultural Sciences', name: 'Agricultural Sciences', cnName: '农业科学' },
    { folder: '02Biology & Biochemistry', name: 'Biology & Biochemistry', cnName: '生物学与生物化学' },
    { folder: '03Chemistry', name: 'Chemistry', cnName: '化学' },
    { folder: '04Clinical Medicine', name: 'Clinical Medicine', cnName: '临床医学' },
    { folder: '05Computer Science', name: 'Computer Science', cnName: '计算机科学' },
    { folder: '06Economics & Business', name: 'Economics & Business', cnName: '经济学与商学' },
    { folder: '07Engineering', name: 'Engineering', cnName: '工程学' },
    { folder: '08EnvironmentEcology', name: 'EnvironmentEcology', cnName: '环境/生态学' },
    { folder: '09Geosciences', name: 'Geosciences', cnName: '地球科学' },
    { folder: '10Immunology', name: 'Immunology', cnName: '免疫学' },
    { folder: '11Materials Science', name: 'Materials Science', cnName: '材料科学' },
    { folder: '12Mathematics', name: 'Mathematics', cnName: '数学' },
    { folder: '13Microbiology', name: 'Microbiology', cnName: '微生物学' },
    { folder: '14Molecular Biology & Genetics', name: 'Molecular Biology & Genetics', cnName: '分子生物学与遗传学' },
    { folder: '15Multidisciplinary', name: 'Multidisciplinary', cnName: '综合交叉学科' },
    { folder: '16Neuroscience & Behavior', name: 'Neuroscience & Behavior', cnName: '神经科学与行为学' },
    { folder: '17Pharmacology & Toxicology', name: 'Pharmacology & Toxicology', cnName: '药理学与毒理学' },
    { folder: '18Physics', name: 'Physics', cnName: '物理学' },
    { folder: '19Plant & Animal Science', name: 'Plant & Animal Science', cnName: '植物学与动物学' },
    { folder: '20PsychiatryPsychology', name: 'PsychiatryPsychology', cnName: '心理学/精神病学' },
    { folder: '21Social Sciences, General', name: 'Social Sciences, General', cnName: '社会科学总论' },
    { folder: '22Space Science', name: 'Space Science', cnName: '空间科学' }
];

// 西南民族大学机构名称变体
const SWMU_NAMES = ['Southwest Minzu University', 'Southwest University for Nationalities'];

function findMainExcelFile(folderPath, folderName) {
    const files = fs.readdirSync(folderPath);
    // 查找包含学科名和"2015-2025"的主文件
    const mainFile = files.find(f =>
        f.endsWith('.xlsx') &&
        f.includes('2015-2025') &&
        f.startsWith(folderName.substring(0, 3))
    );
    return mainFile;
}

function extractMetrics(filePath) {
    try {
        const wb = XLSX.readFile(filePath);
        const ws = wb.Sheets[wb.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(ws);

        if (data.length === 0) return null;

        // 查找西南民族大学行
        const swmuRow = data.find(row =>
            row.Name && SWMU_NAMES.some(name =>
                row.Name.toLowerCase().includes(name.toLowerCase())
            )
        );

        if (!swmuRow) return null;

        // 获取列名
        const cols = Object.keys(data[0]);

        // Citation Impact = 篇均被引 (CPP)
        const cppCol = cols.find(c => c === 'Citation Impact');
        // CNCI = Category Normalized Citation Impact (本校CNCI，非Collab-CNCI)
        const cnciCol = cols.find(c => c === 'Category Normalized Citation Impact');
        // 被引频次
        const citationsCol = cols.find(c => c === 'Times Cited');
        // 论文数
        const papersCol = cols.find(c => c === 'Web of Science Documents');

        // 本校CPP
        const cpp = Number(swmuRow[cppCol]) || null;
        // 本校CNCI
        const cnci = Number(swmuRow[cnciCol]) || null;

        // 计算全球基准CPP（全部机构的总被引/总论文）
        let totalCitations = 0;
        let totalPapers = 0;
        data.forEach(row => {
            if (row[citationsCol] && row[papersCol]) {
                totalCitations += Number(row[citationsCol]) || 0;
                totalPapers += Number(row[papersCol]) || 0;
            }
        });
        const baselineCpp = totalPapers > 0 ? totalCitations / totalPapers : null;

        return {
            cpp,
            cnci,
            baselineCpp,
            debug: {
                name: swmuRow.Name,
                citations: swmuRow[citationsCol],
                papers: swmuRow[papersCol],
                cppValue: cpp,
                cnciValue: cnci,
                globalCitations: totalCitations,
                globalPapers: totalPapers
            }
        };
    } catch (err) {
        console.error(`Error reading ${filePath}:`, err.message);
        return null;
    }
}

async function main() {
    console.log('开始提取22学科质量指标...\n');

    const results = {};

    for (const disc of DISCIPLINE_FOLDERS) {
        const folderPath = path.join(BASE_DIR, disc.folder);

        if (!fs.existsSync(folderPath)) {
            console.log(`❌ 文件夹不存在: ${disc.folder}`);
            continue;
        }

        const mainFile = findMainExcelFile(folderPath, disc.folder);
        if (!mainFile) {
            console.log(`❌ 未找到主文件: ${disc.folder}`);
            continue;
        }

        const filePath = path.join(folderPath, mainFile);
        console.log(`\n📊 处理 ${disc.cnName} (${disc.name})`);
        console.log(`   文件: ${mainFile}`);

        const metrics = extractMetrics(filePath);

        if (metrics) {
            results[disc.name] = {
                cnName: disc.cnName,
                cpp: metrics.cpp,
                cnci: metrics.cnci,
                baselineCpp: metrics.baselineCpp,
                debug: metrics.rowData
            };
            console.log(`   ✅ CPP: ${metrics.cpp?.toFixed(2)}, CNCI: ${metrics.cnci?.toFixed(2)}, Baseline CPP: ${metrics.baselineCpp?.toFixed(2)}`);
        } else {
            console.log(`   ⚠️ 未找到西南民族大学数据`);
        }
    }

    // 保存结果
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(results, null, 2));
    console.log(`\n✅ 结果已保存到 ${OUTPUT_FILE}`);

    // 更新 xnmz.json
    if (fs.existsSync(XNMZ_FILE)) {
        console.log('\n更新 xnmz.json 中的学科数据...');
        const xnmz = JSON.parse(fs.readFileSync(XNMZ_FILE, 'utf8'));

        xnmz.disciplines.forEach(disc => {
            const key = disc.name;
            if (results[key]) {
                disc.baselineCpp = results[key].baselineCpp;
                disc.cnci = results[key].cnci;
                console.log(`   更新 ${disc.cnName}: baselineCpp=${disc.baselineCpp?.toFixed(2)}, cnci=${disc.cnci?.toFixed(2)}`);
            }
        });

        fs.writeFileSync(XNMZ_FILE, JSON.stringify(xnmz, null, 2));
        console.log('✅ xnmz.json 已更新');
    }
}

main().catch(console.error);
