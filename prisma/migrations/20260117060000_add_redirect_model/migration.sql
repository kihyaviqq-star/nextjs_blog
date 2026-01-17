-- CreateTable
CREATE TABLE "Redirect" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "fromSlug" TEXT NOT NULL,
    "toSlug" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "Redirect_fromSlug_key" ON "Redirect"("fromSlug");

-- CreateIndex
CREATE INDEX "Redirect_fromSlug_idx" ON "Redirect"("fromSlug");

-- CreateIndex
CREATE INDEX "Redirect_toSlug_idx" ON "Redirect"("toSlug");
