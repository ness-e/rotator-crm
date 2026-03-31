-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_license_servers" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "licenseId" INTEGER NOT NULL,
    "serverId" INTEGER NOT NULL,
    "domainId" INTEGER,
    CONSTRAINT "license_servers_licenseId_fkey" FOREIGN KEY ("licenseId") REFERENCES "licenses" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "license_servers_serverId_fkey" FOREIGN KEY ("serverId") REFERENCES "server_nodes" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "license_servers_domainId_fkey" FOREIGN KEY ("domainId") REFERENCES "domains" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_license_servers" ("id", "licenseId", "serverId") SELECT "id", "licenseId", "serverId" FROM "license_servers";
DROP TABLE "license_servers";
ALTER TABLE "new_license_servers" RENAME TO "license_servers";
CREATE UNIQUE INDEX "license_servers_licenseId_serverId_domainId_key" ON "license_servers"("licenseId", "serverId", "domainId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
