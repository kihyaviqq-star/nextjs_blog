import { PrismaClient } from '@prisma/client';
import * as cheerio from 'cheerio';

const prisma = new PrismaClient();

// Helper to find official site using DuckDuckGo Lite
async function findOfficialSite(appName: string): Promise<string> {
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

// Fallback category if none exists
const DEFAULT_CATEGORY_SLUG = 'system';

async function main() {
  console.log('🤖 Запуск Робота-Скрапера (SoftPortal) 🤖');
  
  // Ensure we have a default category for scraped software
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

  // 1. Fetch homepage to get links
  const BASE_URL = 'https://www.softportal.com/';
  console.log(`📡 Сканируем главную страницу: ${BASE_URL}`);
  
  const response = await fetch(BASE_URL, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    }
  });
  
  const html = await response.text();
  const $ = cheerio.load(html);
  
  // Extract all software links
  const links: string[] = [];
  $('a[href^="https://www.softportal.com/software-"]').each((i, el) => {
    links.push($(el).attr('href')!);
  });
  
  const uniqueLinks = [...new Set(links)];
  console.log(`✅ Найдено уникальных ссылок на программы: ${uniqueLinks.length}`);
  
  // Process the first 3 links as a demo
  const targetLinks = uniqueLinks.slice(0, 3);
  console.log(`🚀 Начинаем парсинг и ИИ-обработку ${targetLinks.length} программ...`);
  
  for (const link of targetLinks) {
    try {
      console.log(`\n⬇️ Парсинг: ${link}`);
      const progRes = await fetch(link, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
      });
      const progHtml = await progRes.text();
      const $p = cheerio.load(progHtml);
      
      const rawName = $p('h1').text().trim();
      const name = rawName.split(' для ')[0].split(' - ')[0].trim() || 'Unknown App';
      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      
      // Extract data
      let shortDesc = $p('meta[name="description"]').attr('content') || '';
      shortDesc = shortDesc.replace(/скачать бесплатно/gi, '').trim().substring(0, 200);
      
      let rawDescription = $p('div[itemprop="description"]').text().trim();
      if (!rawDescription) {
        rawDescription = $p('p').eq(1).text().trim() + '\n' + $p('p').eq(2).text().trim();
      }
      
      // Extract Logo URL
      let logoUrl = $p('meta[property="og:image"]').attr('content') || 
                    $p('.program-logo img').attr('src') || 
                    $p('img[itemprop="image"]').attr('src');
                    
      if (logoUrl && !logoUrl.startsWith('http')) {
        logoUrl = 'https://www.softportal.com' + logoUrl;
      }
      
      // Extract Screenshots
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
      
      // Limit to max 5 screenshots
      const finalScreenshots = screenshots.slice(0, 5);
      
      // Fix OS extraction
      let platforms = 'Windows';
      $p('.software-info-block span').each((i, el) => {
        if ($p(el).text().includes('ОС:')) {
          platforms = $p(el).next('span').text().trim() || 'Windows';
        }
      });
      // Fallback if the above doesn't work perfectly
      if (platforms.length > 100) platforms = 'Windows, Android, macOS, iOS';
      
      let licenseType = 'Trial';
      $p('.software-info-block span').each((i, el) => {
        if ($p(el).text().includes('Лицензия:')) {
          licenseType = $p(el).next('span').text().trim().includes('Бесплат') ? 'Free' : 'Trial';
        }
      });
      
      console.log(`  📝 Оригинальный текст: ${rawDescription.substring(0, 50)}...`);
      console.log('  🧠 Запуск AI Рерайтера (Simulated)...');
      
      // OPENROUTER INTEGRATION
      let aiRewrittenDescription = '';
      
      if (process.env.OPENROUTER_API_KEY) {
        try {
          const OpenAI = require('openai').default;
          const openai = new OpenAI({
            baseURL: "https://openrouter.ai/api/v1",
            apiKey: process.env.OPENROUTER_API_KEY,
          });

          // Find Official Site via DDG
          const officialSite = await findOfficialSite(name);
          
          const prompt = `Ты - профессиональный IT-копирайтер. Твоя задача написать SEO-оптимизированный обзор программы ${name}.
Используй следующий исходный текст с SoftPortal в качестве базы фактов (но не копируй его дословно):
${rawDescription}

Официальный сайт для справки: ${officialSite}

ВАЖНЫЕ ПРАВИЛА:
1. ВЫДАЙ ТОЛЬКО ГОТОВЫЙ MARKDOWN ТЕКСТ. 
2. НИКАКИХ ВСТУПИТЕЛЬНЫХ СЛОВ (например: "Вот ваш текст", "Конечно, вот переработанный текст").
3. Начни сразу с заголовка (например, # ${name} - лучший инструмент для...).
4. Разбей текст на логические блоки с подзаголовками (##).
5. Обязательно выдели ключевые функции маркированным списком (- или *).
6. Сделай текст живым, интересным и продающим. Объем: 2000-3000 символов.`;
          
          const completion = await openai.chat.completions.create({
            model: "google/gemma-4-31b-it:free", // Valid OpenRouter free model
            messages: [
              {
                "role": "system",
                "content": prompt
              }
            ],
          });
          
          aiRewrittenDescription = completion.choices[0].message.content || '';
          console.log(`  ✅ AI Успешно сгенерировал SEO-текст (${aiRewrittenDescription.length} символов)`);
          
        } catch (apiError) {
          console.error('  ⚠️ Ошибка API OpenRouter:', apiError);
          aiRewrittenDescription = rawDescription; // Fallback to original
        }
      } else {
        console.log(`  ⚠️ OPENROUTER_API_KEY не найден. Использую оригинальный текст.`);
        aiRewrittenDescription = rawDescription;
      }
      
      // Save to database
      const existing = await prisma.software.findUnique({ where: { slug } });
      if (existing) {
        console.log(`  ⏭️ Программа ${name} уже есть в базе. Пропускаем.`);
        continue;
      }
      
      // Removed duplicate findOfficialSite from loop
      // ----------------------------------------
      // Find Official Site via DDG
      console.log('  🔍 Поиск официального сайта...');
      const officialSite = await findOfficialSite(name);
      const finalUrl = officialSite || link;
      if (officialSite) {
        console.log(`  🌐 Найден официальный сайт: ${officialSite}`);
      } else {
        console.log(`  🌐 Сайт не найден, используем ссылку донора.`);
      }
      // ----------------------------------------
      
      await prisma.software.create({
        data: {
          name,
          slug,
          description: aiRewrittenDescription,
          shortDesc: shortDesc || `Скачать ${name} - лучший софт.`,
          logoUrl: logoUrl || null,
          pricing: licenseType,
          websiteUrl: finalUrl, // <-- USING OFFICIAL SITE
          platforms: platforms,
          licenseType: licenseType,
          screenshots: finalScreenshots.length > 0 ? JSON.stringify(finalScreenshots) : null,
          isAutoGenerated: true,
          sourceUrl: link,
          lastCrawledAt: new Date(),
          isAi: false, // Important! This goes to /software, not /tools
          categoryId: category.id,
        }
      });
      
      console.log(`  ✅ Успешно добавлено в базу данных: ${name}`);
      
      // Wait a bit to not spam the server
      await new Promise(r => setTimeout(r, 1000));
      
    } catch (e) {
      console.error(`  ❌ Ошибка при парсинге ${link}:`, e);
    }
  }
  
  console.log('\n🎉 Робот-Скрапер успешно завершил работу!');
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
