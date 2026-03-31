/*
  Warnings:

  - You are about to drop the column `codigo_licencia` on the `licencias_en_activacion` table. All the data in the column will be lost.
  - You are about to drop the column `correo_paypal` on the `licencias_en_activacion` table. All the data in the column will be lost.
  - You are about to drop the column `serverNodeId` on the `licenses` table. All the data in the column will be lost.
  - You are about to drop the column `provider` on the `server_nodes` table. All the data in the column will be lost.
  - Added the required column `email` to the `licencias_en_activacion` table without a default value. This is not possible if the table is not empty.
  - Added the required column `token` to the `licencias_en_activacion` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "users" ADD COLUMN "profilePicture" TEXT;

-- CreateTable
CREATE TABLE "providers" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "website" TEXT,
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true
);

-- CreateTable
CREATE TABLE "provider_plans" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "specs" TEXT,
    "providerId" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "provider_plans_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "providers" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "license_servers" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "licenseId" INTEGER NOT NULL,
    "serverId" INTEGER NOT NULL,
    CONSTRAINT "license_servers_licenseId_fkey" FOREIGN KEY ("licenseId") REFERENCES "licenses" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "license_servers_serverId_fkey" FOREIGN KEY ("serverId") REFERENCES "server_nodes" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_licencias_en_activacion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "productTemplateId" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_licencias_en_activacion" ("createdAt", "id", "updatedAt") SELECT "createdAt", "id", "updatedAt" FROM "licencias_en_activacion";
DROP TABLE "licencias_en_activacion";
ALTER TABLE "new_licencias_en_activacion" RENAME TO "licencias_en_activacion";
CREATE UNIQUE INDEX "licencias_en_activacion_token_key" ON "licencias_en_activacion"("token");
CREATE TABLE "new_licenses" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "serialKey" TEXT NOT NULL,
    "friendlyName" TEXT,
    "organizationId" INTEGER NOT NULL,
    "productTemplateId" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "purchaseDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expirationDate" DATETIME,
    "autoRenew" BOOLEAN NOT NULL DEFAULT false,
    "paypalSubId" TEXT,
    "lastPaymentDate" DATETIME,
    "limitQuestions" INTEGER NOT NULL,
    "limitCases" INTEGER NOT NULL,
    "limitAdmins" INTEGER NOT NULL,
    "limitMobileUsers" INTEGER NOT NULL DEFAULT 0,
    "limitPhoneUsers" INTEGER NOT NULL DEFAULT 0,
    "limitDataEntries" INTEGER NOT NULL DEFAULT 0,
    "limitAnalysts" INTEGER NOT NULL DEFAULT 0,
    "limitClients" INTEGER NOT NULL DEFAULT 0,
    "limitClassifiers" INTEGER NOT NULL DEFAULT 0,
    "limitCaptureSupervisors" INTEGER NOT NULL DEFAULT 0,
    "limitKioskSupervisors" INTEGER NOT NULL DEFAULT 0,
    "limitParticipants" INTEGER NOT NULL DEFAULT 0,
    "concurrentQuestionnaires" INTEGER NOT NULL DEFAULT 0,
    "machineId" TEXT,
    "hostingPlanId" INTEGER,
    "encryptedActivationKey" TEXT,
    "activatedByUserId" INTEGER,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "ownedByUserId" INTEGER,
    CONSTRAINT "licenses_hostingPlanId_fkey" FOREIGN KEY ("hostingPlanId") REFERENCES "hosting_plans" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "licenses_productTemplateId_fkey" FOREIGN KEY ("productTemplateId") REFERENCES "product_templates" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "licenses_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "licenses_activatedByUserId_fkey" FOREIGN KEY ("activatedByUserId") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "licenses_ownedByUserId_fkey" FOREIGN KEY ("ownedByUserId") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_licenses" ("activatedByUserId", "autoRenew", "concurrentQuestionnaires", "createdAt", "encryptedActivationKey", "expirationDate", "friendlyName", "hostingPlanId", "id", "lastPaymentDate", "limitAdmins", "limitAnalysts", "limitCaptureSupervisors", "limitCases", "limitClassifiers", "limitClients", "limitDataEntries", "limitKioskSupervisors", "limitMobileUsers", "limitParticipants", "limitPhoneUsers", "limitQuestions", "machineId", "notes", "organizationId", "paypalSubId", "productTemplateId", "purchaseDate", "serialKey", "status", "updatedAt") SELECT "activatedByUserId", "autoRenew", "concurrentQuestionnaires", "createdAt", "encryptedActivationKey", "expirationDate", "friendlyName", "hostingPlanId", "id", "lastPaymentDate", "limitAdmins", "limitAnalysts", "limitCaptureSupervisors", "limitCases", "limitClassifiers", "limitClients", "limitDataEntries", "limitKioskSupervisors", "limitMobileUsers", "limitParticipants", "limitPhoneUsers", "limitQuestions", "machineId", "notes", "organizationId", "paypalSubId", "productTemplateId", "purchaseDate", "serialKey", "status", "updatedAt" FROM "licenses";
DROP TABLE "licenses";
ALTER TABLE "new_licenses" RENAME TO "licenses";
CREATE UNIQUE INDEX "licenses_serialKey_key" ON "licenses"("serialKey");
CREATE UNIQUE INDEX "licenses_ownedByUserId_key" ON "licenses"("ownedByUserId");
CREATE TABLE "new_server_nodes" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "ipAddress" TEXT,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "providerId" INTEGER,
    "providerPlanId" INTEGER,
    "organizationId" INTEGER,
    "costMonthly" DECIMAL DEFAULT 0,
    "costAnnual" DECIMAL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "billingCycle" TEXT NOT NULL DEFAULT 'MONTHLY',
    "nextPaymentDate" DATETIME,
    "size" TEXT,
    "capacity" INTEGER DEFAULT 100,
    CONSTRAINT "server_nodes_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "providers" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "server_nodes_providerPlanId_fkey" FOREIGN KEY ("providerPlanId") REFERENCES "provider_plans" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "server_nodes_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_server_nodes" ("billingCycle", "capacity", "costAnnual", "costMonthly", "currency", "id", "ipAddress", "name", "nextPaymentDate", "size", "status", "type") SELECT "billingCycle", "capacity", "costAnnual", "costMonthly", "currency", "id", "ipAddress", "name", "nextPaymentDate", "size", "status", "type" FROM "server_nodes";
DROP TABLE "server_nodes";
ALTER TABLE "new_server_nodes" RENAME TO "server_nodes";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "providers_name_key" ON "providers"("name");

-- CreateIndex
CREATE UNIQUE INDEX "license_servers_licenseId_serverId_key" ON "license_servers"("licenseId", "serverId");
