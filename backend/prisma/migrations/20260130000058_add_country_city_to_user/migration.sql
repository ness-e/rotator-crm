/*
  Warnings:

  - You are about to drop the `activaciones` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `licencias_en_activacion` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `licencias_version` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `maestro_activadores` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `maestro_clientes` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `maestro_hosting` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `maestro_licencias` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "activaciones";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "licencias_en_activacion";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "licencias_version";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "maestro_activadores";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "maestro_clientes";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "maestro_hosting";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "maestro_licencias";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "organizations" (
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
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "organizations_marketTargetId_fkey" FOREIGN KEY ("marketTargetId") REFERENCES "market_targets" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "users" (
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
    "role" TEXT NOT NULL DEFAULT 'MEMBER',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastLogin" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "users_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "users_role_fkey" FOREIGN KEY ("role") REFERENCES "roles" ("name") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "product_templates" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
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
    "concurrentQuestionnaires" INTEGER NOT NULL DEFAULT 0
);

-- CreateTable
CREATE TABLE "server_nodes" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "ipAddress" TEXT,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "provider" TEXT,
    "costMonthly" DECIMAL DEFAULT 0,
    "costAnnual" DECIMAL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "billingCycle" TEXT NOT NULL DEFAULT 'MONTHLY',
    "nextPaymentDate" DATETIME,
    "size" TEXT,
    "capacity" INTEGER DEFAULT 100
);

-- CreateTable
CREATE TABLE "licenses" (
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
    "hostingType" TEXT NOT NULL DEFAULT 'CLOUD_ROTATOR',
    "serverNodeId" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "licenses_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "licenses_productTemplateId_fkey" FOREIGN KEY ("productTemplateId") REFERENCES "product_templates" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "licenses_serverNodeId_fkey" FOREIGN KEY ("serverNodeId") REFERENCES "server_nodes" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "activation_logs" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "licenseId" INTEGER NOT NULL,
    "pcName" TEXT,
    "ipAddress" TEXT,
    "keyUsed" TEXT,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "activation_logs_licenseId_fkey" FOREIGN KEY ("licenseId") REFERENCES "licenses" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER,
    "action" TEXT NOT NULL DEFAULT 'UNKNOWN',
    "entity" TEXT NOT NULL DEFAULT 'UNKNOWN',
    "entityId" TEXT,
    "details" TEXT,
    "ip" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "purchase_intents" (
    "token" TEXT NOT NULL PRIMARY KEY,
    "paypalOrderId" TEXT,
    "paypalSubId" TEXT,
    "payerEmail" TEXT NOT NULL,
    "payerName" TEXT,
    "productCode" TEXT NOT NULL,
    "amountPaid" DECIMAL,
    "status" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "prospects" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "company" TEXT NOT NULL,
    "contactName" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "status" TEXT NOT NULL DEFAULT 'NUEVO',
    "stage" TEXT,
    "interestLevel" INTEGER NOT NULL DEFAULT 50,
    "nextFollowUp" DATETIME,
    "country" TEXT,
    "countryCode" TEXT,
    "notes" TEXT,
    "source" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "prospects_stage_fkey" FOREIGN KEY ("stage") REFERENCES "pipeline_stages" ("value") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "system_settings" (
    "key" TEXT NOT NULL PRIMARY KEY,
    "value" TEXT NOT NULL,
    "description" TEXT,
    "group" TEXT NOT NULL DEFAULT 'GENERAL',
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'info',
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "metadata" TEXT,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "roles" (
    "name" TEXT NOT NULL PRIMARY KEY,
    "description" TEXT,
    "permissions" TEXT NOT NULL,
    "isSystem" BOOLEAN NOT NULL DEFAULT false
);

-- CreateTable
CREATE TABLE "domains" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "domainName" TEXT NOT NULL,
    "isPropio" BOOLEAN NOT NULL DEFAULT false,
    "serverId" INTEGER,
    "expiresAt" DATETIME,
    "observations" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "domains_serverId_fkey" FOREIGN KEY ("serverId") REFERENCES "server_nodes" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "email_templates" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "variables" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "pipeline_stages" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "label" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "color" TEXT,
    "orderIndex" INTEGER NOT NULL DEFAULT 0
);

-- CreateTable
CREATE TABLE "market_targets" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "abbreviation" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "migration_clients" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "empresa" TEXT,
    "contacto" TEXT,
    "correo" TEXT,
    "servidor" TEXT,
    "observations" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "follow_ups" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER,
    "prospectId" INTEGER,
    "tipo" TEXT NOT NULL,
    "fecha" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "canal" TEXT,
    "resultado" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "follow_ups_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "follow_ups_prospectId_fkey" FOREIGN KEY ("prospectId") REFERENCES "prospects" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "organizations_email_key" ON "organizations"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "product_templates_code_key" ON "product_templates"("code");

-- CreateIndex
CREATE UNIQUE INDEX "licenses_serialKey_key" ON "licenses"("serialKey");

-- CreateIndex
CREATE UNIQUE INDEX "domains_domainName_key" ON "domains"("domainName");

-- CreateIndex
CREATE UNIQUE INDEX "email_templates_code_key" ON "email_templates"("code");

-- CreateIndex
CREATE UNIQUE INDEX "pipeline_stages_value_key" ON "pipeline_stages"("value");

-- CreateIndex
CREATE UNIQUE INDEX "market_targets_abbreviation_key" ON "market_targets"("abbreviation");
