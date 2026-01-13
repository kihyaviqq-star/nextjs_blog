-- CreateTable
CREATE TABLE "SiteSettings" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'default',
    "siteName" TEXT NOT NULL DEFAULT 'Blog',
    "logoUrl" TEXT,
    "faviconUrl" TEXT,
    "metaDescription" TEXT DEFAULT 'Информационный портал о последних новостях и разработках в области искусственного интеллекта',
    "footerText" TEXT DEFAULT 'Сделано с ❤ для всех, кто интересуется ИИ',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
