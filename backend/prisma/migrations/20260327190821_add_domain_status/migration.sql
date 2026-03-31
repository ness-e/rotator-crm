-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_domains" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "domainName" TEXT NOT NULL,
    "isPropio" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'active',
    "serverId" INTEGER,
    "expiresAt" DATETIME,
    "observations" TEXT,
    "appName" TEXT,
    "ftpAddress" TEXT,
    "ftpUser" TEXT,
    "ftpPassword" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "domains_serverId_fkey" FOREIGN KEY ("serverId") REFERENCES "server_nodes" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_domains" ("appName", "createdAt", "domainName", "expiresAt", "ftpAddress", "ftpPassword", "ftpUser", "id", "isPropio", "observations", "serverId", "updatedAt") SELECT "appName", "createdAt", "domainName", "expiresAt", "ftpAddress", "ftpPassword", "ftpUser", "id", "isPropio", "observations", "serverId", "updatedAt" FROM "domains";
DROP TABLE "domains";
ALTER TABLE "new_domains" RENAME TO "domains";
CREATE UNIQUE INDEX "domains_domainName_key" ON "domains"("domainName");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
