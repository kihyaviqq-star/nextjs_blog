import { PrismaClient } from '@prisma/client';
import { resolveRedirect } from '../lib/redirects';

const prisma = new PrismaClient();

async function testRedirect() {
  const testSlug = 'euavya222';
  
  console.log(`Testing redirect for slug: ${testSlug}`);
  
  // Проверяем напрямую в БД
  const redirect = await prisma.redirect.findUnique({
    where: { fromSlug: testSlug }
  });
  
  if (redirect) {
    console.log(`Direct DB check: Found redirect ${testSlug} -> ${redirect.toSlug}`);
  } else {
    console.log(`Direct DB check: No redirect found for ${testSlug}`);
  }
  
  // Проверяем через функцию
  const result = await resolveRedirect(testSlug);
  console.log(`resolveRedirect result:`, result);
  
  await prisma.$disconnect();
}

testRedirect();
