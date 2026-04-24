-- CreateTable
CREATE TABLE "licencias_en_activacion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "codigo_licencia" TEXT NOT NULL,
    "correo_paypal" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
