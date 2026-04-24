/*
  Warnings:

  - You are about to drop the column `hostingType` on the `licenses` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[licenseId,hardwareId,pcName]` on the table `activation_logs` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "activation_logs" ADD COLUMN "hardwareId" TEXT;

-- AlterTable
ALTER TABLE "organizations" ADD COLUMN "notes" TEXT;

-- AlterTable
ALTER TABLE "purchase_intents" ADD COLUMN "licenseTypeCode" TEXT;

-- CreateTable
CREATE TABLE "hosting_plans" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "abbreviation" TEXT NOT NULL,
    "concurrentQuestionnaires" INTEGER NOT NULL DEFAULT 2,
    "isActive" BOOLEAN NOT NULL DEFAULT true
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
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
    "serverNodeId" INTEGER,
    "encryptedActivationKey" TEXT,
    "activatedByUserId" INTEGER,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "licenses_hostingPlanId_fkey" FOREIGN KEY ("hostingPlanId") REFERENCES "hosting_plans" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "licenses_serverNodeId_fkey" FOREIGN KEY ("serverNodeId") REFERENCES "server_nodes" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "licenses_productTemplateId_fkey" FOREIGN KEY ("productTemplateId") REFERENCES "product_templates" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "licenses_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "licenses_activatedByUserId_fkey" FOREIGN KEY ("activatedByUserId") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_licenses" ("autoRenew", "concurrentQuestionnaires", "createdAt", "expirationDate", "friendlyName", "id", "lastPaymentDate", "limitAdmins", "limitAnalysts", "limitCaptureSupervisors", "limitCases", "limitClassifiers", "limitClients", "limitDataEntries", "limitKioskSupervisors", "limitMobileUsers", "limitParticipants", "limitPhoneUsers", "limitQuestions", "machineId", "organizationId", "paypalSubId", "productTemplateId", "purchaseDate", "serialKey", "serverNodeId", "status", "updatedAt") SELECT "autoRenew", "concurrentQuestionnaires", "createdAt", "expirationDate", "friendlyName", "id", "lastPaymentDate", "limitAdmins", "limitAnalysts", "limitCaptureSupervisors", "limitCases", "limitClassifiers", "limitClients", "limitDataEntries", "limitKioskSupervisors", "limitMobileUsers", "limitParticipants", "limitPhoneUsers", "limitQuestions", "machineId", "organizationId", "paypalSubId", "productTemplateId", "purchaseDate", "serialKey", "serverNodeId", "status", "updatedAt" FROM "licenses";
DROP TABLE "licenses";
ALTER TABLE "new_licenses" RENAME TO "licenses";
CREATE UNIQUE INDEX "licenses_serialKey_key" ON "licenses"("serialKey");
CREATE TABLE "new_product_templates" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "abbreviation" TEXT,
    "versionId" INTEGER,
    "defaultQuestions" INTEGER NOT NULL DEFAULT 0,
    "defaultCases" INTEGER NOT NULL DEFAULT 0,
    "defaultAdmins" INTEGER NOT NULL DEFAULT 1,
    "basePrice" DECIMAL NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "defaultMobileUsers" INTEGER NOT NULL DEFAULT 0,
    "defaultPhoneUsers" INTEGER NOT NULL DEFAULT 0,
    "defaultDataEntries" INTEGER NOT NULL DEFAULT 0,
    "defaultAnalysts" INTEGER NOT NULL DEFAULT 0,
    "defaultClients" INTEGER NOT NULL DEFAULT 0,
    "defaultClassifiers" INTEGER NOT NULL DEFAULT 0,
    "defaultCaptureSupervisors" INTEGER NOT NULL DEFAULT 0,
    "defaultKioskSupervisors" INTEGER NOT NULL DEFAULT 0,
    "defaultParticipants" INTEGER NOT NULL DEFAULT 0,
    "defaultHostingPlanId" INTEGER,
    "defaultServerType" INTEGER NOT NULL DEFAULT 0,
    "concurrentQuestionnaires" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "product_templates_defaultHostingPlanId_fkey" FOREIGN KEY ("defaultHostingPlanId") REFERENCES "hosting_plans" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_product_templates" ("basePrice", "category", "code", "concurrentQuestionnaires", "currency", "defaultAdmins", "defaultAnalysts", "defaultCaptureSupervisors", "defaultCases", "defaultClassifiers", "defaultClients", "defaultDataEntries", "defaultKioskSupervisors", "defaultMobileUsers", "defaultParticipants", "defaultPhoneUsers", "defaultQuestions", "id", "name") SELECT "basePrice", "category", "code", "concurrentQuestionnaires", "currency", "defaultAdmins", "defaultAnalysts", "defaultCaptureSupervisors", "defaultCases", "defaultClassifiers", "defaultClients", "defaultDataEntries", "defaultKioskSupervisors", "defaultMobileUsers", "defaultParticipants", "defaultPhoneUsers", "defaultQuestions", "id", "name" FROM "product_templates";
DROP TABLE "product_templates";
ALTER TABLE "new_product_templates" RENAME TO "product_templates";
CREATE UNIQUE INDEX "product_templates_code_key" ON "product_templates"("code");
CREATE UNIQUE INDEX "product_templates_abbreviation_key" ON "product_templates"("abbreviation");
CREATE UNIQUE INDEX "product_templates_versionId_key" ON "product_templates"("versionId");
CREATE TABLE "new_users" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "position" TEXT,
    "phone" TEXT,
    "country" TEXT,
    "city" TEXT,
    "organizationId" INTEGER,
    "role" TEXT NOT NULL DEFAULT 'CLIENTE',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastLogin" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "users_role_fkey" FOREIGN KEY ("role") REFERENCES "roles" ("name") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "users_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_users" ("city", "country", "createdAt", "email", "firstName", "lastName", "id", "isActive", "lastLogin", "organizationId", "password", "phone", "position", "role", "updatedAt") SELECT "city", "country", "createdAt", "email", "firstName", "lastName", "id", "isActive", "lastLogin", "organizationId", "password", "phone", "position", "role", "updatedAt" FROM "users";
DROP TABLE "users";
ALTER TABLE "new_users" RENAME TO "users";
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "hosting_plans_abbreviation_key" ON "hosting_plans"("abbreviation");

-- CreateIndex
CREATE UNIQUE INDEX "activation_logs_licenseId_hardwareId_pcName_key" ON "activation_logs"("licenseId", "hardwareId", "pcName");
