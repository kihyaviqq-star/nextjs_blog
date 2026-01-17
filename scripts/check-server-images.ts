/**
 * Скрипт для проверки доступности изображений на сервере
 * Запуск: npx tsx scripts/check-server-images.ts
 */

import { PrismaClient } from '@prisma/client';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

const prisma = new PrismaClient();

async function checkImages() {
  console.log('🔍 Проверка изображений статей...\n');
  
  const posts = await prisma.post.findMany({
    select: {
      id: true,
      title: true,
      slug: true,
      coverImage: true,
    },
    take: 10, // Проверяем первые 10 статей
  });

  if (posts.length === 0) {
    console.log('❌ Статьи не найдены');
    await prisma.$disconnect();
    return;
  }

  const publicDir = join(process.cwd(), 'public');
  let foundCount = 0;
  let missingCount = 0;

  for (const post of posts) {
    if (!post.coverImage) {
      console.log(`⚠️  "${post.title}" - нет обложки`);
      continue;
    }

    // Проверяем относительные пути
    if (post.coverImage.startsWith('/uploads/')) {
      const imagePath = join(publicDir, post.coverImage);
      const exists = existsSync(imagePath);
      
      if (exists) {
        console.log(`✅ "${post.title}" - ${post.coverImage}`);
        foundCount++;
      } else {
        console.log(`❌ "${post.title}" - файл не найден: ${post.coverImage}`);
        console.log(`   Ожидаемый путь: ${imagePath}`);
        missingCount++;
      }
    } else if (post.coverImage.startsWith('http://') || post.coverImage.startsWith('https://')) {
      console.log(`🌐 "${post.title}" - внешний URL: ${post.coverImage}`);
      // Можно добавить проверку доступности через fetch
    } else {
      console.log(`⚠️  "${post.title}" - неверный формат: ${post.coverImage}`);
    }
  }

  console.log(`\n📊 Результаты:`);
  console.log(`   Найдено: ${foundCount}`);
  console.log(`   Не найдено: ${missingCount}`);
  console.log(`   Всего проверено: ${posts.length}`);

  // Проверка папки uploads
  console.log(`\n📁 Проверка структуры папок:`);
  const uploadsDirs = ['covers', 'avatars', 'logos', 'favicons'];
  for (const dir of uploadsDirs) {
    const dirPath = join(publicDir, 'uploads', dir);
    const exists = existsSync(dirPath);
    if (exists) {
      try {
        const files = readFileSync(dirPath, { encoding: 'utf8' });
        // Просто проверяем существование директории
        console.log(`   ✅ /uploads/${dir}/ - существует`);
      } catch {
        console.log(`   ✅ /uploads/${dir}/ - существует (директория)`);
      }
    } else {
      console.log(`   ❌ /uploads/${dir}/ - не найдена`);
    }
  }

  await prisma.$disconnect();
}

checkImages().catch(console.error);
