import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkRedirects() {
  try {
    const redirects = await prisma.redirect.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10
    });
    
    console.log(`Found ${redirects.length} redirects:`);
    redirects.forEach((r, i) => {
      console.log(`${i + 1}. ${r.fromSlug} -> ${r.toSlug} (created: ${r.createdAt})`);
    });
    
    if (redirects.length === 0) {
      console.log('\nNo redirects found in database.');
      console.log('This might mean:');
      console.log('1. No articles have been edited yet');
      console.log('2. The redirect creation logic is not working');
    }
  } catch (error: any) {
    console.error('Error checking redirects:', error.message);
    if (error.message?.includes('redirect')) {
      console.error('\nRedirect model might not be available. Run: npx prisma generate');
    }
  } finally {
    await prisma.$disconnect();
  }
}

checkRedirects();
