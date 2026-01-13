/**
 * Database Seeding Script
 * Creates 12 realistic AI-related blog posts for testing
 * 
 * Usage: npx tsx scripts/seed-posts.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Sample AI-related posts
const samplePosts = [
  {
    title: "Крупный прорыв в технологии больших языковых моделей",
    slug: "llm-breakthrough-2026",
    excerpt: "Исследователи из Стэнфорда представили новую архитектуру, которая снижает вычислительные затраты на 60% без потери качества.",
    tags: ["LLM", "Исследования", "Прорыв"],
    coverImage: "https://images.unsplash.com/photo-1677442136019-21780ecad995?q=80&w=1932&auto=format&fit=crop",
    readTime: "8 мин",
  },
  {
    title: "GPT-5: Что мы знаем о следующем поколении ИИ",
    slug: "gpt-5-rumors-2026",
    excerpt: "OpenAI готовится к релизу GPT-5. Инсайдеры делятся подробностями о новых возможностях мультимодальной модели.",
    tags: ["GPT-5", "OpenAI", "Новости"],
    coverImage: "https://images.unsplash.com/photo-1676277791608-ac68e4e3f97c?q=80&w=1932&auto=format&fit=crop",
    readTime: "12 мин",
  },
  {
    title: "Искусственный интеллект в медицине: диагностика будущего",
    slug: "ai-healthcare-2026",
    excerpt: "Системы на базе ИИ уже превосходят врачей в точности диагностики онкологических заболеваний на ранних стадиях.",
    tags: ["Медицина", "Здравоохранение", "Применение"],
    coverImage: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?q=80&w=2070&auto=format&fit=crop",
    readTime: "10 мин",
  },
  {
    title: "Этика ИИ: где проходит граница ответственности?",
    slug: "ai-ethics-responsibility",
    excerpt: "Новые законодательные инициативы в ЕС и США устанавливают строгие требования к прозрачности алгоритмов искусственного интеллекта.",
    tags: ["Этика", "Законодательство", "Общество"],
    coverImage: "https://images.unsplash.com/photo-1507146426996-ef05306b995a?q=80&w=2070&auto=format&fit=crop",
    readTime: "15 мин",
  },
  {
    title: "Nvidia представила H200: революция в обучении нейросетей",
    slug: "nvidia-h200-announcement",
    excerpt: "Новый чип обещает удвоить скорость обучения больших моделей и снизить энергопотребление на 40%.",
    tags: ["Nvidia", "Железо", "Новости"],
    coverImage: "https://images.unsplash.com/photo-1591488320449-011701bb6704?q=80&w=2070&auto=format&fit=crop",
    readTime: "7 мин",
  },
  {
    title: "Как ChatGPT изменил работу программистов за год",
    slug: "chatgpt-developers-impact",
    excerpt: "Исследование показало, что 92% разработчиков используют ИИ-ассистентов ежедневно, увеличив продуктивность на 35%.",
    tags: ["ChatGPT", "Разработка", "Аналитика"],
    coverImage: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?q=80&w=2070&auto=format&fit=crop",
    readTime: "11 мин",
  },
  {
    title: "Generative AI в образовании: угроза или возможность?",
    slug: "ai-education-future",
    excerpt: "Университеты по всему миру пересматривают учебные программы, интегрируя ИИ-инструменты в процесс обучения.",
    tags: ["Образование", "Тренды", "Дискуссия"],
    coverImage: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?q=80&w=2022&auto=format&fit=crop",
    readTime: "9 мин",
  },
  {
    title: "Stable Diffusion 3.0: новая эра генерации изображений",
    slug: "stable-diffusion-3-release",
    excerpt: "Stability AI выпустила третью версию своего флагманского продукта с поддержкой текста и улучшенной детализацией.",
    tags: ["Stable Diffusion", "Генерация", "Релиз"],
    coverImage: "https://images.unsplash.com/photo-1547826039-bfc35e0f1ea8?q=80&w=2072&auto=format&fit=crop",
    readTime: "6 мин",
  },
  {
    title: "Автономные автомобили: Tesla vs Waymo в 2026 году",
    slug: "autonomous-cars-comparison",
    excerpt: "Сравнительный анализ технологий самоуправляемых автомобилей от двух лидеров индустрии и их подходов к безопасности.",
    tags: ["Автомобили", "Tesla", "Waymo"],
    coverImage: "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?q=80&w=2070&auto=format&fit=crop",
    readTime: "13 мин",
  },
  {
    title: "Квантовые вычисления и ИИ: прорыв или преувеличение?",
    slug: "quantum-ai-breakthrough",
    excerpt: "Google заявляет о создании квантового процессора, способного ускорить обучение нейросетей в тысячу раз.",
    tags: ["Квантовые вычисления", "Будущее", "Google"],
    coverImage: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?q=80&w=2070&auto=format&fit=crop",
    readTime: "14 мин",
  },
  {
    title: "ИИ-ассистенты в повседневной жизни: обзор 2026 года",
    slug: "ai-assistants-review-2026",
    excerpt: "От Siri до Gemini: какой голосовой помощник лучше справляется с реальными задачами пользователей.",
    tags: ["Ассистенты", "Обзор", "Сравнение"],
    coverImage: "https://images.unsplash.com/photo-1589254065878-42c9da997008?q=80&w=2070&auto=format&fit=crop",
    readTime: "10 мин",
  },
  {
    title: "Как защитить себя от AI-сгенерированных deepfakes",
    slug: "deepfake-protection-guide",
    excerpt: "Практическое руководство по распознаванию поддельных видео и защите своей цифровой идентичности в эпоху ИИ.",
    tags: ["Безопасность", "Deepfake", "Руководство"],
    coverImage: "https://images.unsplash.com/photo-1614064641938-3bbee52942c7?q=80&w=2070&auto=format&fit=crop",
    readTime: "8 мин",
  },
];

// Generate simple Editor.js content
function generateEditorContent(title: string, excerpt: string) {
  return {
    time: Date.now(),
    blocks: [
      {
        type: "header",
        data: {
          text: "Введение",
          level: 2,
        },
      },
      {
        type: "paragraph",
        data: {
          text: excerpt,
        },
      },
      {
        type: "paragraph",
        data: {
          text: "Развитие технологий искусственного интеллекта продолжает удивлять экспертов и обычных пользователей. В этой статье мы рассмотрим последние достижения и их влияние на нашу жизнь.",
        },
      },
      {
        type: "header",
        data: {
          text: "Ключевые особенности",
          level: 2,
        },
      },
      {
        type: "list",
        data: {
          style: "unordered",
          items: [
            "Значительное улучшение производительности",
            "Снижение стоимости вычислений",
            "Повышение точности и надежности",
            "Расширение области применения",
          ],
        },
      },
      {
        type: "paragraph",
        data: {
          text: "Эксперты отмечают, что данные изменения могут коренным образом повлиять на индустрию в ближайшие годы. Компании активно внедряют новые решения, стремясь получить конкурентное преимущество.",
        },
      },
      {
        type: "header",
        data: {
          text: "Влияние на индустрию",
          level: 2,
        },
      },
      {
        type: "paragraph",
        data: {
          text: "Внедрение новых технологий уже показывает впечатляющие результаты. Ранние пользователи сообщают о существенном росте эффективности и качества работы.",
        },
      },
      {
        type: "quote",
        data: {
          text: "Это не просто улучшение — это революция в том, как мы взаимодействуем с технологиями.",
          caption: "Ведущий эксперт в области ИИ",
          alignment: "left",
        },
      },
      {
        type: "paragraph",
        data: {
          text: "Впереди нас ждут еще более захватывающие открытия. Следите за обновлениями в этой быстро развивающейся области!",
        },
      },
    ],
    version: "2.28.0",
  };
}

// Random number between min and max
function randomBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Random date within last N days
function randomDateWithinDays(days: number): Date {
  const now = new Date();
  const msPerDay = 24 * 60 * 60 * 1000;
  const randomMs = Math.random() * days * msPerDay;
  return new Date(now.getTime() - randomMs);
}

async function main() {
  console.log('🌱 Starting database seeding...\n');

  // Find Sarah Chen
  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { username: 'sara-chen' },
        { email: 'editor@ai-stat.ru' },
        { email: 'test@ai-stat.ru' },
      ],
    },
  });

  if (!user) {
    console.error('❌ Error: User "Sarah Chen" not found!');
    console.error('   Please run the seed script first: npx prisma db seed');
    process.exit(1);
  }

  console.log('✅ User found:');
  console.log(`   Name: ${user.name}`);
  console.log(`   Email: ${user.email}`);
  console.log(`   ID: ${user.id}\n`);

  // Check for existing posts
  const existingCount = await prisma.post.count();
  if (existingCount > 0) {
    console.log(`⚠️  Warning: Database already has ${existingCount} post(s).`);
    const readline = await import('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    await new Promise<void>((resolve) => {
      rl.question('   Continue and add more posts? (y/N): ', (answer) => {
        rl.close();
        if (answer.toLowerCase() !== 'y') {
          console.log('\n❌ Seeding cancelled.');
          process.exit(0);
        }
        resolve();
      });
    });
    console.log('');
  }

  let totalViews = 0;
  console.log('📝 Creating posts...\n');

  // Create posts
  for (const [index, postData] of samplePosts.entries()) {
    const views = randomBetween(100, 5000);
    totalViews += views;

    const post = await prisma.post.create({
      data: {
        title: postData.title,
        slug: postData.slug,
        excerpt: postData.excerpt,
        coverImage: postData.coverImage,
        tags: JSON.stringify(postData.tags),
        content: JSON.stringify(generateEditorContent(postData.title, postData.excerpt)),
        readTime: postData.readTime,
        views: views,
        publishedAt: randomDateWithinDays(30),
        authorId: user.id,
      },
    });

    console.log(`   ${index + 1}. ✅ "${post.title}"`);
    console.log(`      Views: ${views.toLocaleString('ru-RU')} | Tags: ${postData.tags.join(', ')}`);
  }

  console.log(`\n🎉 Successfully created ${samplePosts.length} posts!`);
  console.log(`\n📊 Statistics:`);
  console.log(`   Total posts: ${samplePosts.length}`);
  console.log(`   Total views: ${totalViews.toLocaleString('ru-RU')}`);
  console.log(`   Average views: ${Math.round(totalViews / samplePosts.length).toLocaleString('ru-RU')}`);
  console.log(`   Author: ${user.name}`);

  console.log(`\n✨ Your dashboard is now populated with data!`);
  console.log(`   Visit: http://localhost:3000/dashboard`);
}

main()
  .catch((e) => {
    console.error('\n❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
