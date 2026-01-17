-- AlterTable
ALTER TABLE "User" ADD COLUMN "publicEmail" TEXT;
ALTER TABLE "User" ADD COLUMN "showEmail" BOOLEAN NOT NULL DEFAULT false;
