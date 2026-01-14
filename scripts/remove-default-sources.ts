/**
 * Remove isDefault flag from all RSS sources
 * 
 * Usage: npx tsx scripts/remove-default-sources.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Removing isDefault flag from all sources...');

  try {
    const result = await prisma.rSSSource.updateMany({
      where: {
        isDefault: true
      },
      data: {
        isDefault: false
      }
    });

    console.log(`✓ Updated ${result.count} sources`);
    console.log('Done!');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main()
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
