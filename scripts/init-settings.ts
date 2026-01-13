import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Initializing site settings...");

  // Create or update default settings
  const settings = await prisma.siteSettings.upsert({
    where: { id: "default" },
    update: {},
    create: {
      id: "default",
      siteName: "Blog",
      metaDescription: "Информационный портал о последних новостях и разработках в области искусственного интеллекта",
      footerText: "Сделано с ❤ для всех, кто интересуется ИИ",
    },
  });

  console.log("Site settings initialized:", settings);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
