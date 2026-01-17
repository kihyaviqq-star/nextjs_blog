import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createRedirectTable() {
  try {
    console.log('Creating Redirect table...');
    
    // Проверяем, существует ли таблица
    const result = await prisma.$queryRawUnsafe<Array<{ name: string }>>(
      `SELECT name FROM sqlite_master WHERE type='table' AND name='Redirect';`
    );
    
    if (result.length > 0) {
      console.log('Table Redirect already exists.');
      return;
    }
    
    // Создаем таблицу
    await prisma.$executeRawUnsafe(`
      CREATE TABLE "Redirect" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "fromSlug" TEXT NOT NULL,
        "toSlug" TEXT NOT NULL,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    // Создаем уникальный индекс
    await prisma.$executeRawUnsafe(`
      CREATE UNIQUE INDEX "Redirect_fromSlug_key" ON "Redirect"("fromSlug");
    `);
    
    // Создаем обычные индексы
    await prisma.$executeRawUnsafe(`
      CREATE INDEX "Redirect_fromSlug_idx" ON "Redirect"("fromSlug");
    `);
    
    await prisma.$executeRawUnsafe(`
      CREATE INDEX "Redirect_toSlug_idx" ON "Redirect"("toSlug");
    `);
    
    console.log('Table Redirect created successfully!');
  } catch (error: any) {
    if (error.message?.includes('already exists') || error.message?.includes('duplicate')) {
      console.log('Table Redirect already exists.');
    } else {
      console.error('Error creating table:', error);
      throw error;
    }
  } finally {
    await prisma.$disconnect();
  }
}

createRedirectTable();
