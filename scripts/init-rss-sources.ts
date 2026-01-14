/**
 * Initialize default RSS sources in the database
 * 
 * Usage: npx tsx scripts/init-rss-sources.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const DEFAULT_SOURCES = [
  { id: 'winaero', name: 'winaero.com', url: 'https://winaero.com/feed/' },
  { id: 'microsoft', name: 'Microsoft Blog', url: 'https://blogs.windows.com/feed/' },
  { id: 'azure', name: 'Azure Blog', url: 'https://azure.microsoft.com/en-us/blog/feed/' },
  { id: 'wylsa', name: 'Wylsa.com', url: 'https://wylsa.com/feed/' }
];

async function main() {
  console.log('Initializing default RSS sources...');

  for (const source of DEFAULT_SOURCES) {
    try {
      await prisma.rSSSource.upsert({
        where: { id: source.id },
        update: {
          name: source.name,
          url: source.url,
          isDefault: false
        },
        create: {
          id: source.id,
          name: source.name,
          url: source.url,
          enabled: true,
          isDefault: false
        }
      });
      console.log(`✓ ${source.name} initialized`);
    } catch (error) {
      console.error(`✗ Error initializing ${source.name}:`, error);
    }
  }

  console.log('Done!');
}

main()
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
