-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_SiteConfig" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT DEFAULT 1,
    "rateUsdPerToken" REAL NOT NULL DEFAULT 0.10,
    "bioText" TEXT,
    "customVideoText" TEXT,
    "whitelistEnabled" BOOLEAN NOT NULL DEFAULT false,
    "bodyCount" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_SiteConfig" ("bioText", "customVideoText", "id", "rateUsdPerToken", "updatedAt", "whitelistEnabled") SELECT "bioText", "customVideoText", "id", "rateUsdPerToken", "updatedAt", "whitelistEnabled" FROM "SiteConfig";
DROP TABLE "SiteConfig";
ALTER TABLE "new_SiteConfig" RENAME TO "SiteConfig";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
