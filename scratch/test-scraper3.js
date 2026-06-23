require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const OpenAI = require('openai');
const cheerio = require('cheerio');

const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
});

async function runTest() {
  console.log("Testing ai-stat-scraper logic...");
  
  // Create or fetch AI category
  let aiCategory = await prisma.softwareCategory.findUnique({
    where: { slug: 'ai-models' }
  });
  
  if (!aiCategory) {
    aiCategory = await prisma.softwareCategory.create({
      data: {
        name: 'Нейросети',
        slug: 'ai-models',
        icon: 'BrainCircuit',
      }
    });
  }
  
  console.log("Category ID:", aiCategory.id);
  
  // Scrape one model manually
  const testUrl = "https://ai-stat.ru/model/longcat-flash-lite";
  console.log("Fetching", testUrl);
  
  const res = await fetch(testUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
  const html = await res.text();
  const $ = cheerio.load(html);
  $('script, style, svg, path, header, footer').remove();
  const textContent = $('main').text().replace(/\s+/g, ' ').substring(0, 5000);
  
  console.log("Extracted text (first 200 chars):", textContent.substring(0, 200));
  
  console.log("Asking LLM...");
  const completion = await openai.chat.completions.create({
    model: "google/gemini-2.5-flash",
    messages: [
      {
        role: "system",
        content: `Ты парсер данных об ИИ-моделях. Тебе будет дан текст страницы модели нейросети с сайта ai-stat.ru. 
Ожидаемый формат JSON:
{
  "name": "Имя модели",
  "shortDesc": "Краткое описание (1 предложение)",
  "description": "Полное описание",
  "developer": "Название компании",
  "platforms": "Web, API",
  "licenseType": "Proprietary",
  "tags": ["LLM", "Text"],
  "aiSpecs": { "contextWindow": "128K", "pricing": { "input": "$0.10", "output": "$0.20" }, "benchmarks": { "MMLU": 88.5 } }
}`
      },
      {
        role: "user",
        content: `Название компании: Unknown\nТекст страницы:\n${textContent}`
      }
    ],
    response_format: { type: "json_object" }
  });

  const parsed = JSON.parse(completion.choices[0].message.content);
  console.log("LLM Output:", parsed);
  
  console.log("Saving to Prisma...");
  const saved = await prisma.software.create({
    data: {
      name: parsed.name || "Test Model",
      slug: "test-model-" + Date.now(),
      description: parsed.description || "Desc",
      shortDesc: parsed.shortDesc || "Short",
      developer: parsed.developer || "Dev",
      licenseType: parsed.licenseType || "Proprietary",
      platforms: parsed.platforms || "Web",
      size: "N/A",
      categoryId: aiCategory.id,
      tags: JSON.stringify(parsed.tags || []),
      isAi: true,
      aiSpecs: JSON.stringify(parsed.aiSpecs || {})
    }
  });
  
  console.log("Saved software ID:", saved.id);
  console.log("Test OK!");
  
  // Cleanup test model
  await prisma.software.delete({ where: { id: saved.id } });
  process.exit(0);
}

runTest().catch(console.error);
