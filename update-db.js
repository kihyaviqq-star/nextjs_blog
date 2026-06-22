const { PrismaClient } = require('@prisma/client');

async function main() {
  const prisma = new PrismaClient();
  
  await prisma.siteSettings.update({
    where: { id: 'default' },
    data: {
      logoUrl: '/logo.png',
      faviconUrl: '/logo.png'
    }
  });
  
  console.log('Site logo and favicon updated successfully!');
  await prisma.$disconnect();
}

main().catch(console.error);
