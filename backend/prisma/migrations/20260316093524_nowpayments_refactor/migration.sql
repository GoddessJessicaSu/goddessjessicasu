-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;

-- Rebuild User (drop btcAddress, ethAddress, tronAddress)
CREATE TABLE "new_User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "email" TEXT NOT NULL,
    "isAdmin" BOOLEAN NOT NULL DEFAULT false,
    "tokenBalance" REAL NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_User" ("id", "email", "isAdmin", "tokenBalance", "createdAt") SELECT "id", "email", "isAdmin", "tokenBalance", "createdAt" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- Rebuild SiteConfig (drop rateBtcPerToken, rateEthPerToken)
CREATE TABLE "new_SiteConfig" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT DEFAULT 1,
    "rateUsdPerToken" REAL NOT NULL DEFAULT 0.10,
    "bioText" TEXT,
    "customVideoText" TEXT,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_SiteConfig" ("id", "rateUsdPerToken", "bioText", "customVideoText", "updatedAt") SELECT "id", "rateUsdPerToken", "bioText", "customVideoText", "updatedAt" FROM "SiteConfig";
DROP TABLE "SiteConfig";
ALTER TABLE "new_SiteConfig" RENAME TO "SiteConfig";

-- Add nowpaymentsId to Transaction
ALTER TABLE "Transaction" ADD COLUMN "nowpaymentsId" TEXT;
CREATE UNIQUE INDEX "Transaction_nowpaymentsId_key" ON "Transaction"("nowpaymentsId");

PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
