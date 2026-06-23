import { PrismaClient } from '@prisma/client';
import * as cheerio from 'cheerio';
import { prisma } from '@/lib/prisma';

export async function findOfficialSite(appName: string): Promise<string> {
  try {
    const url = 'https://lite.duckduckgo.com/lite/';
    const formData = new URLSearchParams();
    formData.append('q', `${appName} official site`);

    const response = await fetch(url, {
      method: 'POST',
      body: formData,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Content-Type': 'application/x-www-form-urlencoded',
        'Origin': 'https://lite.duckduckgo.com',
        'Referer': 'https://lite.duckduckgo.com/'
      }
    });
    
    if (!response.ok) return '';
    
    const html = await response.text();
    const $ = cheerio.load(html);
    
    let officialUrl = '';
    $('a').each((i, el) => {
      const href = $(el).attr('href');
      if (href && href.startsWith('http') && !href.includes('duckduckgo') && !officialUrl) {
        officialUrl = href;
      }
    });
    return officialUrl;
  } catch (e) {
    console.error('Ошибка поиска оф. сайта:', e);
    return '';
  }
}

const DEFAULT_CATEGORY_SLUG = 'system';

export async function runSoftwareScraper(
  limit: number = 3,
  onProgress?: (msg: string, current: number, total: number) => void
): Promise<{ added: number, names: string[] }> {
  console.log(`🤖 Запуск Робота-Скрапера (Лимит: ${limit}) 🤖`);
  
  let category = await prisma.softwareCategory.findUnique({
    where: { slug: DEFAULT_CATEGORY_SLUG }
  });
  
  if (!category) {
    category = await prisma.softwareCategory.create({
      data: {
        name: 'Системные',
        slug: DEFAULT_CATEGORY_SLUG,
        icon: 'Monitor',
      }
    });
  }

  const BASE_URL = 'https://www.softportal.com/';
  
  const response = await fetch(BASE_URL, {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
  });
  
  const html = await response.text();
  const $ = cheerio.load(html);
  
  const links: string[] = [];
  $('a[href^="https://www.softportal.com/software-"]').each((i, el) => {
    links.push($(el).attr('href')!);
  });
  
  const uniqueLinks = [...new Set(links)];
  const addedNames: string[] = [];
  
  // We need to fetch links, but only process ones that don't already exist
  let processedCount = 0;
  
  for (const link of uniqueLinks) {
    if (processedCount >= limit) break;

    try {
      // First, get the raw HTML to find the name before hitting OpenRouter
      const progRes = await fetch(link, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
      });
      const progHtml = await progRes.text();
      const $p = cheerio.load(progHtml);
      
      const rawName = $p('h1').text().trim();
      const name = rawName.split(' для ')[0].split(' - ')[0].trim() || 'Unknown App';
      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      
      // Check if it already exists
      const existing = await prisma.software.findUnique({ where: { slug } });
      if (existing) {
        continue; // Skip if already exists, don't increment processedCount
      }

      console.log(`\n⬇️ Парсинг: ${name} (${link})`);
      onProgress?.(`Скачивание данных: ${name}...`, processedCount + 1, limit);
      
      let shortDesc = $p('meta[name="description"]').attr('content') || '';
      shortDesc = shortDesc.replace(/скачать бесплатно/gi, '').trim().substring(0, 200);
      
      let rawDescription = $p('div[itemprop="description"]').text().trim();
      if (!rawDescription) {
        rawDescription = $p('p').eq(1).text().trim() + '\n' + $p('p').eq(2).text().trim();
      }
      
      let logoUrl = $p('meta[property="og:image"]').attr('content') || 
                    $p('.program-logo img').attr('src') || 
                    $p('img[itemprop="image"]').attr('src');
                    
      if (logoUrl && !logoUrl.startsWith('http')) {
        logoUrl = 'https://www.softportal.com' + logoUrl;
      }
      
      const screenshots: string[] = [];
      $p('a.mfp-item[href*="/scr/"], a[href*="/scr/"]').each((i, el) => {
        let src = $p(el).attr('href');
        if (src && !src.startsWith('http')) src = 'https://www.softportal.com' + src;
        if (src && !screenshots.includes(src)) screenshots.push(src);
      });
      
      if (screenshots.length === 0) {
        $p('a[data-fancybox="gallery"]').each((i, el) => {
          let src = $p(el).attr('href');
          if (src && !src.startsWith('http')) src = 'https://www.softportal.com' + src;
          if (src && !screenshots.includes(src)) screenshots.push(src);
        });
      }
      
      const finalScreenshots = screenshots.slice(0, 5);
      
      let platforms = 'Windows';
      $p('.software-info-block span').each((i, el) => {
        if ($p(el).text().includes('ОС:')) {
          platforms = $p(el).next('span').text().trim() || 'Windows';
        }
      });
      if (platforms.length > 100) platforms = 'Windows, Android, macOS, iOS';
      
      let licenseType = 'Trial';
      $p('.software-info-block span').each((i, el) => {
        if ($p(el).text().includes('Лицензия:')) {
          licenseType = $p(el).next('span').text().trim().includes('Бесплат') ? 'Free' : 'Trial';
        }
      });
      
      let aiRewrittenDescription = '';
      onProgress?.(`Поиск официального сайта для ${name}...`, processedCount + 1, limit);
      const officialSite = await findOfficialSite(name);
      
      if (process.env.OPENROUTER_API_KEY) {
        try {
          onProgress?.(`Нейросеть переписывает описание ${name}...`, processedCount + 1, limit);
          const OpenAI = require('openai').default;
          const openai = new OpenAI({
            baseURL: "https://openrouter.ai/api/v1",
            apiKey: process.env.OPENROUTER_API_KEY,
          });

          const prompt = `Ты - профессиональный IT-копирайтер. Твоя задача написать SEO-оптимизированный обзор программы ${name}.
Используй следующий исходный текст с SoftPortal в качестве базы фактов (но не копируй его дословно):
${rawDescription}

Официальный сайт для справки: ${officialSite}

ВАЖНЫЕ ПРАВИЛА:
1. ВЫДАЙ ТОЛЬКО ГОТОВЫЙ MARKDOWN ТЕКСТ. 
2. НИКАКИХ ВСТУПИТЕЛЬНЫХ СЛОВ (например: "Вот ваш текст").
3. Начни сразу с заголовка (например, # ${name} - лучший инструмент для...).
4. Разбей текст на логические блоки с подзаголовками (##).
5. Обязательно выдели ключевые функции маркированным списком (- или *).
6. Объем: 2000-3000 символов.`;
          
          const completion = await openai.chat.completions.create({
            model: "google/gemma-4-31b-it:free",
            messages: [{ "role": "system", "content": prompt }],
          });
          
          aiRewrittenDescription = completion.choices[0].message.content || '';
        } catch (apiError) {
          console.error('  ⚠️ Ошибка API OpenRouter:', apiError);
          aiRewrittenDescription = rawDescription;
        }
      } else {
        aiRewrittenDescription = rawDescription;
      }
      
      const finalUrl = officialSite || link;
      
      await prisma.software.create({
        data: {
          name,
          slug,
          description: aiRewrittenDescription,
          shortDesc: shortDesc || `Скачать ${name}`,
          logoUrl: logoUrl || null,
          pricing: licenseType,
          websiteUrl: finalUrl,
          platforms: platforms,
          licenseType: licenseType,
          screenshots: finalScreenshots.length > 0 ? JSON.stringify(finalScreenshots) : null,
          isAutoGenerated: true,
          sourceUrl: link,
          lastCrawledAt: new Date(),
          isAi: false,
          categoryId: category.id,
        }
      });
      
      addedNames.push(name);
      processedCount++;
      onProgress?.(`Сохранено: ${name}`, processedCount, limit);
      
    } catch (e) {
      console.error(`  ❌ Ошибка при парсинге ${link}:`, e);
    }
  }
  
  return { added: processedCount, names: addedNames };
}
