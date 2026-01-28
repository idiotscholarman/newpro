/**
 * 更新common.json中的rankings数据，添加region字段
 * 用于支持弹窗的全球/中国/内陆筛选功能
 */

const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');
const nameMapping = require('./src/translated_mapping.json');

const ESI_FILE = 'data/esi_institution/202601/IndicatorsExport .xlsx';
const COMMON_FILE = 'public/data/common.json';

// 中文名映射
const cnMap = {};
Object.entries(nameMapping).forEach(([k, v]) => {
    cnMap[k.toUpperCase().trim()] = v;
});

function main() {
    console.log('读取ESI全球机构排名数据...');

    const wb = XLSX.readFile(ESI_FILE);
    const ws = wb.Sheets[wb.SheetNames[0]];
    const rawData = XLSX.utils.sheet_to_json(ws, { header: 1 });

    // 跳过第0行(标题描述)和第1行(列名)，从第2行开始解析数据
    const rankings = [];
    for (let i = 2; i < rawData.length; i++) {
        const row = rawData[i];
        if (!row || !row[0]) continue;

        const rank = parseInt(row[0]);
        const name = row[1];
        const region = row[2];  // Countries/Regions
        const papers = parseInt(row[3]) || 0;
        const citations = parseInt(row[4]) || 0;
        const cpp = parseFloat(row[5]) || 0;
        const topPapers = parseInt(row[6]) || 0;

        if (!name || isNaN(rank)) continue;

        rankings.push({
            rank,
            name,
            cnName: cnMap[name.toUpperCase()] || null,
            region,  // CHINA MAINLAND, USA, etc.
            citations,
            papers,
            cpp,
            topPapers
        });
    }

    console.log(`解析了 ${rankings.length} 个机构的排名数据`);

    // 统计地区
    const regions = {};
    rankings.forEach(r => {
        regions[r.region] = (regions[r.region] || 0) + 1;
    });
    console.log('地区分布:', Object.entries(regions).slice(0, 10));

    // 更新common.json
    let common = { rankings: [] };
    if (fs.existsSync(COMMON_FILE)) {
        common = JSON.parse(fs.readFileSync(COMMON_FILE, 'utf8'));
    }

    common.rankings = rankings;

    fs.writeFileSync(COMMON_FILE, JSON.stringify(common, null, 2));
    console.log(`✅ 已更新 ${COMMON_FILE}`);

    // 找到西南民族大学的内陆排名
    const chinaMainlandRanks = rankings.filter(r => r.region === 'CHINA MAINLAND');
    const swmuRank = chinaMainlandRanks.findIndex(r =>
        r.name.toUpperCase().includes('SOUTHWEST MINZU') ||
        r.name.toUpperCase().includes('SOUTHWEST UNIVERSITY FOR NATIONALITIES')
    );

    if (swmuRank >= 0) {
        console.log(`西南民族大学内陆排名: #${swmuRank + 1} / ${chinaMainlandRanks.length}`);
    }
}

main();
