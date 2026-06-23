const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const tool = await prisma.software.findFirst({ where: { name: 'Professional Camera' } });
  console.log("Platforms:", tool.platforms);
}

main().finally(() => prisma.$disconnect());
