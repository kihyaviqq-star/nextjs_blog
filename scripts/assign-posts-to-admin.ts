/**
 * Database Maintenance Script
 * Assigns all existing posts to the Admin user (Sarah Chen)
 * 
 * Usage: npx tsx scripts/assign-posts-to-admin.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔄 Starting post assignment...\n');

  // Try to find Sarah Chen by different identifiers
  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { username: 'sara-chen' },
        { email: 'editor@ai-stat.ru' },
        { email: 'test@ai-stat.ru' },
        { email: 'admin@ai-stat.ru' },
      ],
    },
  });

  if (!user) {
    console.error('❌ Error: Admin user not found!');
    console.error('   Tried usernames: sara-chen');
    console.error('   Tried emails: editor@ai-stat.ru, test@ai-stat.ru, admin@ai-stat.ru');
    process.exit(1);
  }

  console.log('✅ Admin user found:');
  console.log(`   ID: ${user.id}`);
  console.log(`   Name: ${user.name}`);
  console.log(`   Email: ${user.email}`);
  console.log(`   Username: ${user.username || 'N/A'}`);
  console.log(`   Role: ${user.role}\n`);

  // Count posts before update
  const postsBefore = await prisma.post.count();
  console.log(`📊 Total posts in database: ${postsBefore}`);

  // Count posts already assigned to this user
  const alreadyAssigned = await prisma.post.count({
    where: { authorId: user.id },
  });
  console.log(`   Already assigned to ${user.name}: ${alreadyAssigned}`);
  console.log(`   Need to assign: ${postsBefore - alreadyAssigned}\n`);

  if (postsBefore === 0) {
    console.log('⚠️  No posts found in database. Nothing to assign.');
    return;
  }

  if (alreadyAssigned === postsBefore) {
    console.log('✅ All posts are already assigned to this user!');
    return;
  }

  // Update all posts to assign them to this user
  const result = await prisma.post.updateMany({
    where: {}, // Match ALL posts
    data: {
      authorId: user.id,
    },
  });

  console.log(`\n✅ Successfully assigned ${result.count} post(s) to ${user.name}!`);
  
  // Verify the update
  const postsAfter = await prisma.post.count({
    where: { authorId: user.id },
  });
  
  console.log(`\n📊 Final stats:`);
  console.log(`   Total posts: ${postsBefore}`);
  console.log(`   Assigned to ${user.name}: ${postsAfter}`);
  console.log(`\n🎉 Done! Dashboard should now show ${postsAfter} articles.`);
}

main()
  .catch((e) => {
    console.error('\n❌ Error during post assignment:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
