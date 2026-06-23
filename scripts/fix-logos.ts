import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Поиск сломанных путей картинок...');
  
  const models = await prisma.software.findMany({
    where: {
      logoUrl: {
        startsWith: '/icons/'
      }
    }
  });

  console.log(`Найдено моделей с относительными путями: ${models.length}`);

  let updated = 0;
  for (const model of models) {
    if (model.logoUrl && model.logoUrl.startsWith('/icons/')) {
      const absoluteUrl = `https://ai-stat.ru${model.logoUrl}`;
      await prisma.software.update({
        where: { id: model.id },
        data: { logoUrl: absoluteUrl }
      });
      updated++;
      console.log(`✅ Обновлен: ${model.name} -> ${absoluteUrl}`);
    }
  }

  console.log(`\n🎉 Готово! Обновлено иконок: ${updated}`);
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
