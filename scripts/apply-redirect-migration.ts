import { PrismaClient } from '@prisma/client';
import { readFileSync } from 'fs';
import { join } from 'path';

const prisma = new PrismaClient();

async function applyMigration() {
  try {
    console.log('Applying Redirect model migration...');
    
    const migrationPath = join(process.cwd(), 'prisma', 'migrations', '20260117060000_add_redirect_model', 'migration.sql');
    const sql = readFileSync(migrationPath, 'utf-8');
    
    // Выполняем SQL команды по отдельности
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));
    
    for (const statement of statements) {
      if (statement.length > 0) {
        await prisma.$executeRawUnsafe(statement);
        console.log('Executed:', statement.substring(0, 50) + '...');
      }
    }
    
    console.log('Migration applied successfully!');
    console.log('Now run: npx prisma generate');
  } catch (error: any) {
    if (error.message?.includes('already exists') || error.message?.includes('duplicate')) {
      console.log('Table Redirect already exists. Skipping migration.');
    } else {
      console.error('Error applying migration:', error);
      throw error;
    }
  } finally {
    await prisma.$disconnect();
  }
}

applyMigration();
