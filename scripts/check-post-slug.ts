import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkPost() {
  const slug = 'euavya222';
  
  console.log(`Checking post with slug: ${slug}`);
  
  const post = await prisma.post.findUnique({
    where: { slug },
    select: { id: true, slug: true, title: true }
  });
  
  if (post) {
    console.log(`Post found:`, post);
    console.log(`WARNING: Post still exists with old slug "${slug}". Redirect will not work!`);
  } else {
    console.log(`Post not found with slug "${slug}". Redirect should work.`);
  }
  
  // Проверяем новый slug
  const newSlug = 'euavya222ff';
  const newPost = await prisma.post.findUnique({
    where: { slug: newSlug },
    select: { id: true, slug: true, title: true }
  });
  
  if (newPost) {
    console.log(`\nPost found with new slug:`, newPost);
  } else {
    console.log(`\nPost not found with new slug "${newSlug}"`);
  }
  
  await prisma.$disconnect();
}

checkPost();
