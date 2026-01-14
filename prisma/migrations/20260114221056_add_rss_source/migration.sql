-- CreateTable
CREATE TABLE "RSSSource" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE INDEX "RSSSource_enabled_idx" ON "RSSSource"("enabled");

-- CreateIndex
CREATE UNIQUE INDEX "RSSSource_url_key" ON "RSSSource"("url");
