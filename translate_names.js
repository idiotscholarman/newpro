import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 配置参数
const API_KEY = process.env.DASHSCOPE_API_KEY; // 请确保你的 .env 文件中有此变量
const BASE_URL = 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions';
const MODEL = 'qwen3-max';
const BATCH_SIZE = 30; // 每批次翻译的数量，避免超出 Token 限制

async function translateBatch(names) {
    const prompt = `你是一个专业的学术机构名称翻译专家。请将以下英文机构名称翻译成通顺、准确的中文官方名称。
    
请直接返回 JSON 对象格式，Key 是原始英文名，Value 是中文译名。不要包含任何解释或 Markdown 代码块标签。

待翻译列表：
${JSON.stringify(names)}`;

    try {
        const response = await fetch(BASE_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: MODEL,
                messages: [{ role: 'user', content: prompt }],
                temperature: 0.3
            })
        });

        const result = await response.json();
        const content = result.choices[0].message.content;

        // 清理可能存在的 Markdown 标记
        const cleanContent = content.replace(/```json|```/g, '').trim();
        return JSON.parse(cleanContent);
    } catch (error) {
        console.error('Batch translation failed:', error);
        return null;
    }
}

async function main() {
    if (!API_KEY) {
        console.error('Error: DASHSCOPE_API_KEY is not set in .env file');
        return;
    }

    const inputPath = path.join(__dirname, 'names.json');
    const outputPath = path.join(__dirname, 'translated_mapping.json');

    const names = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
    const mapping = {};

    console.log(`Starting translation of ${names.length} names in batches of ${BATCH_SIZE}...`);

    for (let i = 0; i < names.length; i += BATCH_SIZE) {
        const batch = names.slice(i, i + BATCH_SIZE);
        console.log(`Translating batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(names.length / BATCH_SIZE)}...`);

        const translatedBatch = await translateBatch(batch);
        if (translatedBatch) {
            Object.assign(mapping, translatedBatch);
        }

        // 适当限速，避免触发布控
        await new Promise(resolve => setTimeout(resolve, 500));
    }

    fs.writeFileSync(outputPath, JSON.stringify(mapping, null, 2), 'utf8');
    console.log(`Success! Translated mapping saved to translated_mapping.json`);
}

main();