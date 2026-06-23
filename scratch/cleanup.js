const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const tools = await prisma.software.findMany();
  let updatedCount = 0;
  for (const tool of tools) {
    if (tool.platforms && tool.platforms.length > 100) {
      await prisma.software.update({
        where: { id: tool.id },
        data: { platforms: 'Windows, Android, macOS, iOS' }
      });
      updatedCount++;
    }
  }
  console.log(`Updated ${updatedCount} tools with broken platforms field.`);
}

main().finally(() => prisma.$disconnect());
