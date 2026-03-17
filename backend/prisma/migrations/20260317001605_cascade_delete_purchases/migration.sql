-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Purchase" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" INTEGER NOT NULL,
    "mediaId" TEXT NOT NULL,
    "tokensSpent" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Purchase_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Purchase_mediaId_fkey" FOREIGN KEY ("mediaId") REFERENCES "Media" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Purchase" ("createdAt", "id", "mediaId", "tokensSpent", "userId") SELECT "createdAt", "id", "mediaId", "tokensSpent", "userId" FROM "Purchase";
DROP TABLE "Purchase";
ALTER TABLE "new_Purchase" RENAME TO "Purchase";
CREATE INDEX "Purchase_userId_idx" ON "Purchase"("userId");
CREATE UNIQUE INDEX "Purchase_userId_mediaId_key" ON "Purchase"("userId", "mediaId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
