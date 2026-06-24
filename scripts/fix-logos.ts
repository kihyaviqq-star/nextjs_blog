import { PrismaClient } from '@prisma/client';
import fs from 'fs/promises';
import path from 'path';

const prisma = new PrismaClient();

async function downloadImage(url: string, subfolder: string): Promise<string | null> {
  try {
    if (!url || !url.startsWith('http')) return null;

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    if (!response.ok) {
      console.warn(`Не удалось скачать картинку: ${url} (Status: ${response.status})`);
      return null;
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Определение расширения
    const contentType = response.headers.get('content-type');
    let ext = '.png'; // default
    if (contentType) {
      if (contentType.includes('jpeg') || contentType.includes('jpg')) ext = '.jpg';
      else if (contentType.includes('png')) ext = '.png';
      else if (contentType.includes('svg')) ext = '.svg';
      else if (contentType.includes('webp')) ext = '.webp';
      else if (contentType.includes('gif')) ext = '.gif';
      else if (contentType.includes('x-icon')) ext = '.ico';
    } else {
      // Попытка взять расширение из URL
      const urlPath = new URL(url).pathname;
      const urlExt = path.extname(urlPath);
      if (urlExt) ext = urlExt;
    }

    // Формируем имя и пути
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}${ext}`;
    const publicDir = path.join(process.cwd(), 'public');
    const uploadDir = path.join(publicDir, 'uploads', subfolder);

    await fs.mkdir(uploadDir, { recursive: true });

    const filePath = path.join(uploadDir, fileName);
    await fs.writeFile(filePath, buffer);

    // Возвращаем относительный URL
    return `/uploads/${subfolder}/${fileName}`;
  } catch (error) {
    console.error(`Ошибка при скачивании картинки ${url}:`, error);
    return null;
  }
}

async function main() {
  console.log('Поиск картинок, которые нужно скачать локально...');
  
  // Ищем модели, у которых картинки ведут на ai-stat.ru или имеют относительный путь
  const models = await prisma.software.findMany({
    where: {
      OR: [
        { logoUrl: { startsWith: '/icons/' } },
        { logoUrl: { startsWith: 'http' } }
      ]
    }
  });

  // Фильтруем те, что уже скачаны (лежат в /uploads)
  const modelsToUpdate = models.filter(m => m.logoUrl && !m.logoUrl.startsWith('/uploads/'));

  console.log(`Найдено программ для скачивания логотипов: ${modelsToUpdate.length}`);

  let updated = 0;
  for (const model of modelsToUpdate) {
    if (!model.logoUrl) continue;
    
    let externalUrl = model.logoUrl;
    // Если ссылка относительная, скорее всего она с ai-stat.ru
    if (externalUrl.startsWith('/icons/')) {
      externalUrl = `https://ai-stat.ru${externalUrl}`;
    }

    console.log(`Скачиваем для ${model.name}: ${externalUrl}...`);
    const localPath = await downloadImage(externalUrl, 'icons');
    
    if (localPath) {
      await prisma.software.update({
        where: { id: model.id },
        data: { logoUrl: localPath }
      });
      updated++;
      console.log(`✅ Успешно: ${localPath}`);
    } else {
      await prisma.software.update({
        where: { id: model.id },
        data: { logoUrl: null }
      });
      updated++;
      console.log(`❌ Ошибка скачивания для ${model.name}. Ссылка очищена.`);
    }
    
    // Небольшая задержка, чтобы не спамить чужой сервер
    await new Promise(r => setTimeout(r, 1000));
  }

  console.log(`\n🎉 Готово! Физически скачано и обновлено иконок: ${updated}`);
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
