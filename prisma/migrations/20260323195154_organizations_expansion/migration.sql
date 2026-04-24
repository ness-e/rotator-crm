-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_organizations" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "password" TEXT,
    "taxId" TEXT,
    "countryCode" TEXT NOT NULL DEFAULT 'XX',
    "city" TEXT,
    "address" TEXT,
    "phone" TEXT,
    "isMaster" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "clientType" TEXT NOT NULL DEFAULT 'C',
    "source" TEXT,
    "ejecutivoId" INTEGER,
    "marketTargetId" INTEGER,
    "notes" TEXT,
    "language" TEXT NOT NULL DEFAULT 'en',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "adminContactName" TEXT,
    "adminContactLastName" TEXT,
    "adminContactEmail" TEXT,
    "useContactName" TEXT,
    "useContactLastName" TEXT,
    "useContactEmail" TEXT,
    "businessType" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Nuevo',
    "primerContactoId" INTEGER,
    CONSTRAINT "organizations_marketTargetId_fkey" FOREIGN KEY ("marketTargetId") REFERENCES "market_targets" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "organizations_primerContactoId_fkey" FOREIGN KEY ("primerContactoId") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_organizations" ("address", "city", "clientType", "countryCode", "createdAt", "ejecutivoId", "email", "id", "isActive", "isMaster", "marketTargetId", "name", "notes", "password", "phone", "source", "taxId", "updatedAt") SELECT "address", "city", "clientType", "countryCode", "createdAt", "ejecutivoId", "email", "id", "isActive", "isMaster", "marketTargetId", "name", "notes", "password", "phone", "source", "taxId", "updatedAt" FROM "organizations";
DROP TABLE "organizations";
ALTER TABLE "new_organizations" RENAME TO "organizations";
CREATE UNIQUE INDEX "organizations_email_key" ON "organizations"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
