const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const tools = await prisma.software.findMany();
  let updatedCount = 0;
  
  for (const tool of tools) {
    let desc = tool.description || "";
    let updated = false;

    // Common AI intro phrases in Russian
    const intros = [
      "Вот переработанный вариант описания программы",
      "Вот переработанный вариант описания",
      "Вот переработанный текст",
      "Вот SEO-оптимизированный обзор",
      "Конечно, вот",
      "Конечно!",
      "Вот ваш текст",
      "Оптимизированный для пользователей и поисковых систем",
      "Текст стал более живым"
    ];

    for (const intro of intros) {
      if (desc.includes(intro)) {
        // Find the first actual markdown heading (#) and cut everything before it
        const firstHeadingIndex = desc.indexOf('#');
        if (firstHeadingIndex > -1) {
          desc = desc.substring(firstHeadingIndex);
          updated = true;
          break; // processed
        } else {
          // No heading found? Just try to remove the intro sentence if we can
          desc = desc.replace(/Вот переработанный вариант.*?продающим\./i, "").trim();
          updated = true;
          break;
        }
      }
    }

    if (updated) {
      await prisma.software.update({
        where: { id: tool.id },
        data: { description: desc }
      });
      updatedCount++;
    }
  }
  
  console.log(`Cleaned up AI intros in ${updatedCount} records.`);
}

main().finally(() => prisma.$disconnect());
