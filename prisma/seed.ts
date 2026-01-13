import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Хешируем пароли
  const editorPassword = await bcrypt.hash('editor123', 10);
  const userPassword = await bcrypt.hash('user123', 10);

  // Создаем главного редактора (администратора)
  const editor = await prisma.user.upsert({
    where: { email: 'editor@ai-stat.ru' },
    update: {},
    create: {
      email: 'editor@ai-stat.ru',
      password: editorPassword,
      name: 'Сара Чен',
      role: 'ADMIN',
      bio: 'Эксперт по AI-технологиям с фокусом на больших языковых моделях (LLM) и их практическом применении. Основатель AI-Stat.ru — русскоязычный ресурс для сравнения и анализа нейросетей.',
      avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sara',
      linkedin: 'https://linkedin.com/in/sarachen',
      twitter: 'https://twitter.com/sarachen',
      github: 'https://github.com/sarachen',
      website: 'https://ai-stat.ru',
      emailVerified: new Date(),
    },
  });

  // Создаем обычного пользователя
  const user = await prisma.user.upsert({
    where: { email: 'user@ai-stat.ru' },
    update: {},
    create: {
      email: 'user@ai-stat.ru',
      password: userPassword,
      name: 'Иван Петров',
      role: 'USER',
      bio: 'Энтузиаст AI и технологий',
      avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ivan',
    },
  });

  console.log('✅ Пользователи созданы:');
  console.log(`📧 Админ: ${editor.email} (пароль: editor123)`);
  console.log(`📧 Пользователь: ${user.email} (пароль: user123)`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
