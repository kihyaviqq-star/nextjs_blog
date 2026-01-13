import { PrismaClient } from '@prisma/client';
import { generateUsernameSlug } from '../lib/constants';

const prisma = new PrismaClient();

/**
 * Generate username from email
 * Example: editor@ai-stat.ru → editor
 */
function generateUsernameFromEmail(email: string): string {
  const localPart = email.split('@')[0];
  return generateUsernameSlug(localPart);
}

/**
 * Generate username from name
 * Example: "Сара Чен" → "sara-chen"
 */
function generateUsernameFromName(name: string): string {
  // Transliterate Cyrillic to Latin (basic)
  const translitMap: Record<string, string> = {
    'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'yo',
    'ж': 'zh', 'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm',
    'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u',
    'ф': 'f', 'х': 'h', 'ц': 'ts', 'ч': 'ch', 'ш': 'sh', 'щ': 'sch',
    'ъ': '', 'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya'
  };

  let transliterated = name.toLowerCase();
  for (const [cyrillic, latin] of Object.entries(translitMap)) {
    transliterated = transliterated.replace(new RegExp(cyrillic, 'g'), latin);
  }

  return generateUsernameSlug(transliterated);
}

/**
 * Ensure username is unique by adding numbers if needed
 */
async function ensureUniqueUsername(baseUsername: string, excludeUserId?: string): Promise<string> {
  let username = baseUsername.toLowerCase(); // Always lowercase
  let counter = 1;

  while (true) {
    const existing = await prisma.user.findUnique({
      where: { username },
      select: { id: true }
    });

    if (!existing || existing.id === excludeUserId) {
      return username;
    }

    username = `${baseUsername.toLowerCase()}${counter}`;
    counter++;
  }
}

async function main() {
  console.log('🔍 Searching for users without usernames...\n');

  // Find all users without username
  const usersWithoutUsername = await prisma.user.findMany({
    where: {
      OR: [
        { username: null },
        { username: '' }
      ]
    },
    select: {
      id: true,
      name: true,
      email: true,
      username: true,
    }
  });

  if (usersWithoutUsername.length === 0) {
    console.log('✅ All users already have usernames!');
    return;
  }

  console.log(`Found ${usersWithoutUsername.length} user(s) without username:\n`);

  for (const user of usersWithoutUsername) {
    console.log(`Processing: ${user.name || user.email}`);

    // Generate base username
    let baseUsername: string;
    
    if (user.name && user.name.trim()) {
      // Prefer name-based username
      baseUsername = generateUsernameFromName(user.name);
      console.log(`  → Generated from name: ${baseUsername}`);
    } else {
      // Fallback to email
      baseUsername = generateUsernameFromEmail(user.email);
      console.log(`  → Generated from email: ${baseUsername}`);
    }

    // Ensure uniqueness
    const uniqueUsername = await ensureUniqueUsername(baseUsername, user.id);
    
    if (uniqueUsername !== baseUsername) {
      console.log(`  → Made unique: ${uniqueUsername}`);
    }

    // Update user (always lowercase for SQLite compatibility)
    await prisma.user.update({
      where: { id: user.id },
      data: { username: uniqueUsername.toLowerCase() }
    });

    console.log(`  ✅ Updated to: ${uniqueUsername}\n`);
  }

  console.log(`\n✅ Successfully updated ${usersWithoutUsername.length} user(s)!`);
  console.log('\nUsername mappings:');
  
  // Show all users with their usernames
  const allUsers = await prisma.user.findMany({
    select: {
      name: true,
      email: true,
      username: true,
    }
  });

  console.table(allUsers);
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
