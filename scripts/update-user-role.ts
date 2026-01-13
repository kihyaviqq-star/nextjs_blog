/**
 * Utility script to update user roles
 * Usage: npx tsx scripts/update-user-role.ts <email> <role>
 * Example: npx tsx scripts/update-user-role.ts editor@ai-stat.ru EDITOR
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length < 2) {
    console.error('❌ Usage: npx tsx scripts/update-user-role.ts <email> <role>');
    console.error('   Available roles: USER, EDITOR, ADMIN');
    console.error('   Example: npx tsx scripts/update-user-role.ts test@example.com EDITOR');
    process.exit(1);
  }

  const [email, role] = args;
  
  // Validate role
  const validRoles = ['USER', 'EDITOR', 'ADMIN'];
  if (!validRoles.includes(role.toUpperCase())) {
    console.error(`❌ Invalid role: ${role}`);
    console.error(`   Valid roles: ${validRoles.join(', ')}`);
    process.exit(1);
  }

  const normalizedRole = role.toUpperCase();

  try {
    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      console.error(`❌ User not found: ${email}`);
      process.exit(1);
    }

    console.log(`\n📝 User found:`);
    console.log(`   ID: ${user.id}`);
    console.log(`   Name: ${user.name || 'N/A'}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Current Role: ${user.role}`);
    console.log(`   New Role: ${normalizedRole}`);

    if (user.role === normalizedRole) {
      console.log(`\n⚠️  User already has role: ${normalizedRole}`);
      return;
    }

    // Update role
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { role: normalizedRole },
    });

    console.log(`\n✅ Role updated successfully!`);
    console.log(`   ${user.email}: ${user.role} → ${updatedUser.role}`);
  } catch (error) {
    console.error('❌ Error updating role:', error);
    process.exit(1);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
