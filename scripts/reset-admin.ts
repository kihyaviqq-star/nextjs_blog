import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash('admin123', 10);
  
  const admin = await prisma.user.upsert({
    where: { email: 'admin@ai-stat.ru' },
    update: {
      password: password,
      role: 'ADMIN',
    },
    create: {
      email: 'admin@ai-stat.ru',
      password: password,
      name: 'Главный Администратор',
      role: 'ADMIN',
      bio: 'Системный администратор',
    }
  });

  console.log('✅ Учетная запись администратора успешно создана/обновлена!');
  console.log(`📧 Email: ${admin.email}`);
  console.log(`🔑 Пароль: admin123`);
}

main()
  .then(async () => await prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
