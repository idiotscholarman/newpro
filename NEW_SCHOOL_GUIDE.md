# 新增学校数据接入指南 (Data Import Guide for New Tenants)

本文档将指导您如何为 Multi-University 系统添加一所新的学校。系统目前支持通过自动化脚本从 Excel 源数据中提取并生成前端所需的 JSON 配置文件。

## 1. 核心原理
前端页面 (`/report/:schoolId`) 不直接存储数据，而是动态请求 `public/data/:schoolId.json`。
我们需要做的是：
1.  **准备原始 Excel 数据**（ESI 排名、学科潜力、发文趋势等）。
2.  **配置脚本** (`fast_parse.js` 和 `update_esi_stats.cjs`)。
3.  **生成 JSON** 并放入 `public/data/` 目录。

---

## 2. 数据准备 (Data Preparation)

您需要准备以下几类数据文件，并按照指定目录结构存放。假设新学校 ID 为 `test_uni`，英文名为 `TEST UNIVERSITY`。

### 2.1 ESI 学科排名数据 (用于 `fast_parse.js`)
*   **来源**: ESI 官网下载的各学科 Excel 报表。
*   **位置**: `data/esi_rankings/202511/` (日期文件夹可变)
*   **文件名**: 必须严格对应学科 ID，如 `03Chemistry.xlsx`, `07Engineering.xlsx`。
*   **用途**: 计算该校各学科的排名、潜力值、是否入围 ESI 前 1%。

### 2.2 InCites 潜力数据 (用于 `fast_parse.js`)
*   **来源**: InCites 数据库导出的各学科详细数据 (含未入围学科的被引情况)。
*   **位置**: `data/incites_potential/` 下的各学科文件夹，如 `data/incites_potential/03Chemistry/`。
*   **文件名**: 包含 `2015-2025` 字样的 Excel 文件。
*   **用途**: 获取未入围学科的真实被引频次，计算距离阈值的百分比（潜力值）。

### 2.3 机构总体排名与趋势 (用于 `update_esi_stats.cjs`)
*   **来源**: ESI 整体机构排名列表。
*   **位置**: `data/esi_institution/XXXXXX/` (数字文件夹，如 `20251114`)。
*   **文件名**: `IndicatorsExport...xlsx`。
*   **用途**: 获取全校的全球排名、总被引、总论文数及其变化趋势（对比上期数据）。

### 2.4 发文趋势与作者贡献 (用于 `update_esi_stats.cjs`)
*   **位置**:
    *   `data/incites_institution_publications_by_year/`: 存放每年的发文统计 Excel (`..._2023.xlsx`)。
    *   `data/southwest_minzu/作者贡献/`: 存放作者贡献 Excel。
*   **注意**: 这里目前的路径写死了 `southwest_minzu`，新增学校时需要修改脚本中的路径配置。

---

## 3. 配置与执行步骤

### 第一步：修改 `fast_parse.js` (生成学科数据)
打开 `fast_parse.js`，找到顶部的配置区域：

```javascript
// ================= 配置中心 =================
const CONFIG = {
    // 1. 修改这里为新学校的匹配名称 (英文名及可能的变体)
    institution: ["TEST UNIVERSITY", "TEST UNIV"],
    
    esiDir: path.resolve(__dirname, 'data/esi_rankings/202511'),
    incitesBaseDir: path.resolve(__dirname, 'data/incites_potential'),
    
    // 2. 修改输出路径，直接生成到 public/data 目录
    outputFile: path.resolve(__dirname, 'public/data/test_uni.json') 
};
```

执行命令：
```bash
node fast_parse.js
```
成功后，`public/data/test_uni.json` 将被创建，包含学科列表数据。

### 第二步：修改 `update_esi_stats.cjs` (补全总览数据)
打开 `update_esi_stats.cjs`：

1.  **修改目标学校**:
    ```javascript
    const targetInst = 'TEST UNIVERSITY'; // 必须匹配 Excel 中的机构名大写
    ```
2.  **修改 JSON 路径**:
    ```javascript
    const jsonPath = path.join(__dirname, 'public/data/test_uni.json'); // 读取刚才生成的 JSON
    ```
3.  **修改作者/发文数据路径** (如有):
    ```javascript
    // 在代码中搜索 'authors' 或相关路径，指向新学校的文件夹
    const authorFile = path.join(__dirname, 'data/test_uni/authors.xlsx'); 
    ```

执行命令：
```bash
node update_esi_stats.cjs
```
脚本会自动读取 ESI 总榜，计算排名升降，并将这些 Overview 数据写入 `public/data/test_uni.json`。

### 第三步：验证结果
1.  确保 `public/data/test_uni.json` 内容完整 (包含 `overview`, `disciplines`)。
2.  启动项目: `npm run dev`。
3.  访问: `http://localhost:5173/report/test_uni`。

---

## 4. 常见问题 (FAQ)

*   **Q: 为什么生成的页面是空的？**
    *   A: 检查 `fast_parse.js` 中的 `institution` 数组是否包含了 Excel 中使用的准确名称（不区分大小写，但拼写必须包含）。
*   **Q: 为什么没有排名变化箭头？**
    *   A: `update_esi_stats.cjs` 需要比对两个文件夹的数据（本期和上期）。请确保 `data/esi_institution/` 下至少有两个不同日期的文件夹。
*   **Q: 能够完全自动化吗？**
    *   A: 可以。建议将上述配置参数化（通过命令行参数传递学校 ID），这样就不需要每次改代码。我们可以封装一个 `npm run build:data -- --school=test_uni` 的命令。
