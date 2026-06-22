const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Create categories
  const catText = await prisma.softwareCategory.upsert({
    where: { slug: 'text' },
    update: {},
    create: { slug: 'text', name: 'Текст и Код', icon: '📝' }
  });
  
  const catImage = await prisma.softwareCategory.upsert({
    where: { slug: 'image' },
    update: {},
    create: { slug: 'image', name: 'Генерация картинок', icon: '🎨' }
  });

  // Create software
  await prisma.software.upsert({
    where: { slug: 'chatgpt' },
    update: {},
    create: {
      slug: 'chatgpt',
      name: 'ChatGPT',
      shortDesc: 'Самая популярная нейросеть для общения, написания текстов и кода от OpenAI.',
      description: 'ChatGPT — это чат-бот с искусственным интеллектом, разработанный компанией OpenAI и способный работать в диалоговом режиме, поддерживающий запросы на естественных языках. Он отлично справляется с написанием кода, генерацией идей и переводом.',
      pricing: 'Freemium',
      websiteUrl: 'https://chat.openai.com',
      categoryId: catText.id,
      logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/0/04/ChatGPT_logo.svg'
    }
  });

  await prisma.software.upsert({
    where: { slug: 'midjourney' },
    update: {},
    create: {
      slug: 'midjourney',
      name: 'Midjourney',
      shortDesc: 'Нейросеть для генерации потрясающих изображений по текстовому описанию.',
      description: 'Midjourney — исследовательская лаборатория и одноимённая нейросеть, создающая изображения по текстовым описаниям. Работает через Discord и позволяет генерировать арт высочайшего качества.',
      pricing: 'Paid',
      websiteUrl: 'https://midjourney.com',
      categoryId: catImage.id,
      logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/e/e6/Midjourney_Emblem.png'
    }
  });

  console.log('Seeded initial AI tools!');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
