const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const result = await prisma.software.deleteMany({
    where: {
      isAi: false
    }
  });
  console.log(`Удалено тестовых программ: ${result.count}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
