import pkg from 'xlsx';
const { readFile, utils } = pkg;
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ================= 配置中心 =================
const CONFIG = {
    institution: ["SOUTHWEST MINZU UNIVERSITY", "SOUTHWEST UNIVERSITY FOR NATIONALITIES", "西南民族大学", "SOUTHWEST MINZU UNIV"],
    esiDir: path.resolve(__dirname, 'data/esi_rankings/202601'),
    incitesBaseDir: path.resolve(__dirname, 'data/incites_potential'),
    outputFile: path.resolve(__dirname, 'src/data.json')
};

// 22个学科标准定义（严格匹配您的文件名和文件夹名）
const DISCIPLINE_CONFIG = [
    { id: '01', name: 'Agricultural Sciences', cn: '农业科学' },
    { id: '02', name: 'Biology & Biochemistry', cn: '生物学与生物化学' },
    { id: '03', name: 'Chemistry', cn: '化学' },
    { id: '04', name: 'Clinical Medicine', cn: '临床医学' },
    { id: '05', name: 'Computer Science', cn: '计算机科学' },
    { id: '06', name: 'Economics & Business', cn: '经济学与商学' },
    { id: '07', name: 'Engineering', cn: '工程学' },
    { id: '08', name: 'EnvironmentEcology', cn: '环境/生态学' },
    { id: '09', name: 'Geosciences', cn: '地球科学' },
    { id: '10', name: 'Immunology', cn: '免疫学' },
    { id: '11', name: 'Materials Science', cn: '材料科学' },
    { id: '12', name: 'Mathematics', cn: '数学' },
    { id: '13', name: 'Microbiology', cn: '微生物学' },
    { id: '14', name: 'Molecular Biology & Genetics', cn: '分子生物学与遗传学' },
    { id: '15', name: 'Multidisciplinary', cn: '多学科' },
    { id: '16', name: 'Neuroscience & Behavior', cn: '神经科学与行为学' },
    { id: '17', name: 'Pharmacology & Toxicology', cn: '药理学与毒理学' },
    { id: '18', name: 'Physics', cn: '物理学' },
    { id: '19', name: 'Plant & Animal Science', cn: '植物学与动物学' },
    { id: '20', name: 'PsychiatryPsychology', cn: '心理学/精神病学' },
    { id: '21', name: 'Social Sciences, General', cn: '社会科学总论' },
    { id: '22', name: 'Space Science', cn: '空间科学' }
];

// 工具函数
const cleanNum = (val) => {
    if (typeof val === 'number') return Math.floor(val);
    return parseInt(String(val || 0).replace(/,/g, '')) || 0;
};

const normalize = (str) => String(str || "").toUpperCase().replace(/[\s,/-]/g, "");

const getLatestDateFolder = (baseDir) => {
    if (!fs.existsSync(baseDir)) return null;
    const folders = fs.readdirSync(baseDir).filter(f => /^\d{8}$/.test(f)); // Match YYYYMMDD
    if (folders.length === 0) return null;
    return folders.sort().pop(); // Return latest date
};

/**
 * 穿透式扫描 InCites 数据
 */
function fetchInCitesData(disc) {
    try {
        const latestDate = getLatestDateFolder(CONFIG.incitesBaseDir);
        if (!latestDate) {
            console.warn(`  ⚠️ InCites 数据缺失: 未找到日期文件夹`);
            return null;
        }

        const folderName = `${disc.id}${disc.name}`;
        const folderPath = path.join(CONFIG.incitesBaseDir, latestDate, folderName); // Use dynamic date
        if (!fs.existsSync(folderPath)) return null;

        const files = fs.readdirSync(folderPath);
        const targetFile = files.find(f => f.includes('2015-2025') && f.endsWith('.xlsx'));
        if (!targetFile) return null;

        const wb = readFile(path.join(folderPath, targetFile));
        for (const sn of wb.SheetNames) {
            const rows = utils.sheet_to_json(wb.Sheets[sn]);
            if (rows.length === 0) continue;

            // 识别列名
            const keys = Object.keys(rows[0]);
            const nameKey = keys.find(k => /Name|Organization|机构/i.test(k));
            const citesKey = keys.find(k => /Times Cited|Citations|被引/i.test(k));
            const docsKey = keys.find(k => /Documents|论文/i.test(k));
            const topKey = keys.find(k => /Highly Cited|高被引/i.test(k));

            if (!nameKey || !citesKey) continue;

            const myRow = rows.find(r => {
                const n = normalize(r[nameKey]);
                return CONFIG.institution.some(t => n.includes(normalize(t)));
            });

            if (myRow) {
                return {
                    citations: cleanNum(myRow[citesKey]),
                    papers: cleanNum(myRow[docsKey]),
                    topPapers: cleanNum(myRow[topKey])
                };
            }
        }
    } catch (e) { console.warn(`  ⚠️ InCites [${disc.cn}] 解析失败: ${e.message}`); }
    return null;
}

async function startParsing() {
    console.log(`🚀 正在全量解析西南民族大学 ESI/InCites 数据...`);
    const results = [];

    for (const disc of DISCIPLINE_CONFIG) {
        try {
            const esiFileName = `${disc.id}${disc.name}.xlsx`;
            const esiPath = path.join(CONFIG.esiDir, esiFileName);

            let threshold = 0, totalOrgs = 0, esiMatch = null;
            let instCol = -1, citesCol = -1, docsCol = -1, topCol = -1;

            // 1. 尝试读取 ESI 数据 (作为基准/Tooltip显示)
            if (fs.existsSync(esiPath)) {
                const wb = readFile(esiPath);
                const rows = utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1 });

                const hIdx = rows.findIndex(r => r.some(c => /Institutions|机构/i.test(String(c))) && r.some(c => /Cites|总被引/i.test(String(c))));

                if (hIdx !== -1) {
                    const header = rows[hIdx];
                    instCol = header.findIndex(c => /Institutions|机构/i.test(String(c)));
                    citesCol = header.findIndex(c => /^Cites$|总被引/i.test(String(c)));
                    docsCol = header.findIndex(c => /Documents|论文/i.test(String(c)));
                    topCol = header.findIndex(c => /Top Papers|高被引/i.test(String(c)));

                    const dataRows = rows.slice(hIdx + 1).filter(r => r[instCol] && !String(r[instCol]).includes('Copyright'));
                    threshold = cleanNum(dataRows[dataRows.length - 1][citesCol]);
                    totalOrgs = dataRows.length;

                    esiMatch = dataRows.find(r => {
                        const n = normalize(r[instCol]);
                        return CONFIG.institution.some(t => n.includes(normalize(t)));
                    });
                }
            }

            // 初始化指标 (Prioritize InCites for visuals, store ESI for tooltip)
            let metrics = {
                name: disc.name,
                cnName: disc.cn,
                threshold,
                isTop1: !!esiMatch,

                // ESI Specific Data (For Tooltips)
                esiRank: esiMatch ? cleanNum(esiMatch[instCol - 1] || esiMatch[0]) : '未入围',
                esiCitations: esiMatch ? cleanNum(esiMatch[citesCol]) : 0,
                esiPapers: esiMatch ? cleanNum(esiMatch[docsCol]) : 0,

                // Visual Data (Default to ESI, overwrite with InCites if available)
                rank: esiMatch ? cleanNum(esiMatch[instCol - 1] || esiMatch[0]) : '未入围',
                citations: esiMatch ? cleanNum(esiMatch[citesCol]) : 0,
                papers: esiMatch ? cleanNum(esiMatch[docsCol]) : 0,
                topPapers: esiMatch ? cleanNum(esiMatch[topCol]) : 0,

                percentile: 'N/A',
                potentialValue: '0.00'
            };

            // 2. 始终尝试读取 InCites 数据 (覆盖 Visual Data)
            const incites = fetchInCitesData(disc);
            if (incites) {
                // Overwrite visual metrics with InCites data (latest 11-year window)
                metrics.citations = incites.citations;
                metrics.papers = incites.papers;
                metrics.topPapers = incites.topPapers;
                console.log(`  📊 [${disc.cn}] 使用 InCites 数据: Paper=${metrics.papers}, Cite=${metrics.citations}`);
            }

            // 3. 计算衍生指标
            if (metrics.isTop1) {
                if (typeof metrics.rank === 'number' && totalOrgs > 0) {
                    metrics.percentile = ((metrics.rank / totalOrgs) * 100).toFixed(2);
                }
            } else {
                if (threshold > 0) {
                    metrics.potentialValue = ((metrics.citations / threshold) * 100).toFixed(2);
                }
            }

            // 计算通用衍生指标
            metrics.citationsPerPaper = metrics.papers > 0 ? (metrics.citations / metrics.papers).toFixed(2) : '0.00';

            results.push(metrics);

        } catch (e) { console.error(`❌ [${disc.cn}] 处理失败: ${e.message}`); }
    }

    // 排序：已入围排前，潜力值（达标进度）高的排后
    results.sort((a, b) => b.isTop1 - a.isTop1 || parseFloat(b.potentialValue) - parseFloat(a.potentialValue));

    fs.writeFileSync(CONFIG.outputFile, JSON.stringify({ institution: "西南民族大学", disciplines: results, updatedAt: new Date().toLocaleString() }, null, 2));
    console.log(`\n✨ 解析任务完成！结果已存入 src/data.json`);
    process.exit(0);
}

startParsing();