import { PrismaClient } from '@prisma/client';
import { downloadImage } from '../lib/utils/download-image';

const prisma = new PrismaClient();

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
