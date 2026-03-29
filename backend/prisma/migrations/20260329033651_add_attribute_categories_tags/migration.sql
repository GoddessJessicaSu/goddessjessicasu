-- AlterTable
ALTER TABLE "Media" ADD COLUMN "lengthMinutes" REAL;

-- CreateTable
CREATE TABLE "AttributeCategory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "AttributeTag" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AttributeTag_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "AttributeCategory" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MediaTag" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "mediaId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,
    CONSTRAINT "MediaTag_mediaId_fkey" FOREIGN KEY ("mediaId") REFERENCES "Media" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "MediaTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "AttributeTag" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "AttributeCategory_name_key" ON "AttributeCategory"("name");

-- CreateIndex
CREATE INDEX "AttributeTag_categoryId_idx" ON "AttributeTag"("categoryId");

-- CreateIndex
CREATE UNIQUE INDEX "AttributeTag_categoryId_name_key" ON "AttributeTag"("categoryId", "name");

-- CreateIndex
CREATE INDEX "MediaTag_mediaId_idx" ON "MediaTag"("mediaId");

-- CreateIndex
CREATE INDEX "MediaTag_tagId_idx" ON "MediaTag"("tagId");

-- CreateIndex
CREATE UNIQUE INDEX "MediaTag_mediaId_tagId_key" ON "MediaTag"("mediaId", "tagId");
