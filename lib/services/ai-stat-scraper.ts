import { PrismaClient } from '@prisma/client';
import * as cheerio from 'cheerio';
import { prisma } from '@/lib/prisma';
import OpenAI from "openai";
import { generateSlug, generateUniqueSlug } from '@/lib/slug';

export async function runAiStatScraper(
  limit: number = 5,
  onProgress?: (msg: string, current: number, total: number) => void
): Promise<{ added: number, names: string[] }> {
  const openai = new OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey: process.env.OPENROUTER_API_KEY || "dummy-key-for-build",
  });

  console.log(`🤖 Запуск AI-Скрапера (Лимит: ${limit}) 🤖`);
  
  const BASE_URL = 'https://ai-stat.ru';
  let addedCount = 0;
  const addedNames: string[] = [];

  try {
    if (onProgress) onProgress('Получение списка моделей...', 0, limit);
    
    // Получаем список текстовых моделей
    const listRes = await fetch(`${BASE_URL}/model-list`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
      }
    });
    
    if (!listRes.ok) throw new Error('Не удалось получить список моделей');
    const html = await listRes.text();
    const $ = cheerio.load(html);
    
    const modelLinks: { name: string, url: string, developer: string }[] = [];
    
    $('section[id]').each((i, section) => {
      const developer = $(section).find('h2').text().trim();
      $(section).find('a[href^="/model/"]').each((j, el) => {
        const href = $(el).attr('href');
        const name = $(el).find('h3').text().trim();
        if (href && name) {
          modelLinks.push({ name, url: `${BASE_URL}${href}`, developer });
        }
      });
    });

    console.log(`Найдено ${modelLinks.length} моделей на ai-stat.ru`);

    // Перемешиваем, чтобы каждый раз получать разные
    const shuffled = modelLinks.sort(() => 0.5 - Math.random());
    const targetLinks = shuffled.slice(0, Math.max(limit * 3, 50)); // берем с запасом

    for (const link of targetLinks) {
      if (addedCount >= limit) break;

      // Проверяем, есть ли уже такая модель
      const existing = await prisma.software.findFirst({
        where: { name: link.name, isAi: true }
      });

      if (existing) {
        console.log(`Модель ${link.name} уже есть в базе. Пропуск.`);
        continue;
      }

      if (onProgress) onProgress(`Парсинг модели: ${link.name}`, addedCount, limit);
      console.log(`Парсинг: ${link.name} (${link.url})`);

      try {
        console.log(`  Скрапинг: ${link.url}`);
        const pageRes = await fetch(link.url);
        if (!pageRes.ok) continue;
        const pageHtml = await pageRes.text();
        const $ = cheerio.load(pageHtml);
        
        // Extract images and links to help LLM find logo and official site
        const imgUrls = $('img').map((_, el) => $(el).attr('src')).get().filter(s => s && s.length > 5).join('\n').slice(0, 500);
        const aLinks = $('a').map((_, el) => $(el).attr('href')).get().filter(s => s && s.startsWith('http')).join('\n').slice(0, 1000);
        
        const textContent = $('body').text().replace(/\s+/g, ' ').slice(0, 8000);
        
        const contentToAnalyze = `Текст: ${textContent}\nКартинки: ${imgUrls}\nСсылки: ${aLinks}`;

        // Используем LLM для извлечения структурированных данных
        console.log(`  Ожидание ответа от LLM для ${link.name}...`);
        
        let completion;
        try {
          completion = await openai.chat.completions.create({
            model: "google/gemini-2.5-flash",
            messages: [
              {
                role: "system",
                content: `Ты парсер данных об ИИ-моделях. Тебе будет дан текст страницы модели нейросети с сайта ai-stat.ru. 
Твоя задача — извлечь данные и вернуть их СТРОГО в формате JSON без markdown и лишних слов.
Ожидаемый формат JSON:
{
  "name": "Название",
  "description": "ПОДРОБНОЕ описание модели на 3-4 объемных абзаца. Расскажи про плюсы, минусы, архитектуру, и для каких задач она лучше всего подходит.",
  "shortDesc": "Краткое описание в 1-2 предложения (выжимка)",
  "websiteUrl": "Официальный сайт нейросети (выбери из Ссылок, если есть)",
  "logoUrl": "URL логотипа модели (выбери из списка Картинки самую подходящую под логотип, желательно svg, png или jpg)",
  "pricing": "Free, Paid, Freemium или конкретная цена",
  "platforms": "Web, API, Desktop",
  "licenseType": "MIT, Proprietary, Open Source и т.д.",
  "tags": ["LLM", "Text", "Code"],
  "aiSpecs": {
    "contextWindow": "число или текст",
    "parameters": "Например 72B, 8B, или неизвестно",
    "architecture": "Например MoE, Dense, Transformer",
    "releaseDate": "Дата выхода (YYYY-MM-DD или текст)",
    "knowledgeCutoff": "Дата или текст (Ограничение знаний)",
    "visionSupport": "Поддержка изображений (true/false)",
    "avgScore": "Средний балл по тестам (число или текст)",
    "features": ["Function Calling", "Web Search", "Fine-tuning", "Code Execution", "Structured Output"],
    "pricing": { 
      "input": "цена за 1M токенов", 
      "output": "цена за 1M токенов",
      "maxInput": "макс входящих токенов",
      "maxOutput": "макс исходящих токенов"
    },
    "benchmarks": {
      "Общие знания": { "MMLU": 88.5, "HellaSwag": 89.0 },
      "Программирование": { "HumanEval": 90.1, "MBPP": 80.5 },
      "Математика": { "MATH": 70.0, "GSM8K": 95.0 },
      "Рассуждение": { "GPQA": 50.2 }
    }
  }
}
Если какой-то информации (например, логотипа или сайта) нет, оставь поле null. Для бенчмарков постарайся сгруппировать их по категориям, как в примере.`
              },
              {
                role: "user",
                content: `Название компании: ${link.developer}\n${contentToAnalyze}`
              }
            ],
            response_format: { type: "json_object" }
          });
        } catch (e: any) {
          if (e.status === 429 || e.status === 404) {
            console.log(`  ⚠️ Ошибка ${e.status} от OpenRouter. Ждем 15 сек и пробуем запасную модель...`);
            await new Promise(res => setTimeout(res, 15000));
            completion = await openai.chat.completions.create({
              model: "meta-llama/llama-3.1-8b-instruct",
              messages: [{
                role: "system",
                content: "Return JSON for AI model specs."
              }, {
                role: "user",
                content: contentToAnalyze
              }],
              response_format: { type: "json_object" }
            });
          } else {
            throw e;
          }
        }

        const rawJson = completion.choices[0].message.content || '{}';
        const data = JSON.parse(rawJson);

        if (!data.name) data.name = link.name;
        if (!data.developer) data.developer = link.developer;

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

        let finalLogoUrl = data.logoUrl || null;
        if (finalLogoUrl && finalLogoUrl.startsWith('/')) {
          finalLogoUrl = `https://ai-stat.ru${finalLogoUrl}`;
        }

        const uniqueSlug = await generateUniqueSlug(generateSlug(data.name), async (s) => {
          const existing = await prisma.software.findUnique({ where: { slug: s } });
          return !!existing;
        });

        await prisma.software.create({
          data: {
            slug: uniqueSlug,
            name: data.name,
            description: data.description || '',
            shortDesc: data.shortDesc || '',
            websiteUrl: data.websiteUrl || link.url,
            logoUrl: finalLogoUrl,
            pricing: data.pricing || 'Free',
            platforms: data.platforms || 'Web',
            licenseType: data.licenseType || 'Proprietary',
            developer: data.developer,
            size: 'N/A', 
            categoryId: aiCategory.id,
            tags: JSON.stringify(data.tags || ['AI', 'LLM']),
            isAi: true,
            aiSpecs: JSON.stringify(data.aiSpecs || {}),
          }
        });

        addedCount++;
        addedNames.push(data.name);
        console.log(`  ✅ Успешно добавлена ИИ-модель: ${data.name}`);

      } catch (e) {
        console.error(`  ❌ Ошибка при парсинге модели ${link.name}:`, e);
      }
      
      // Задержка между запросами
      await new Promise(resolve => setTimeout(resolve, 5000));
    }

  } catch (error) {
    console.error('Ошибка в процессе парсинга AI моделей:', error);
  }

  if (onProgress) onProgress('Сбор ИИ-моделей завершен!', addedCount, limit);
  return { added: addedCount, names: addedNames };
}
