-- CreateTable
CREATE TABLE "maestro_activadores" (
    "id_activador" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nombre_activador" TEXT,
    "abreviatura" TEXT
);

-- CreateTable
CREATE TABLE "licencias_version" (
    "id_version" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "version_nombre" TEXT,
    "version_letra" TEXT,
    "n_preguntas" INTEGER,
    "n_casos" INTEGER,
    "n_admins" INTEGER,
    "n_moviles" INTEGER,
    "n_telefonicos" INTEGER,
    "n_digitadores" INTEGER,
    "n_analistas" INTEGER,
    "n_clientes" INTEGER,
    "n_clasificadores" INTEGER,
    "n_supervisores_captura" INTEGER,
    "n_supervisores_kiosco" INTEGER,
    "n_participantes" INTEGER,
    "hosting" INTEGER,
    "servidor" INTEGER,
    "cuestionarios_concurrentes" INTEGER
);

-- CreateTable
CREATE TABLE "licencias_en_activacion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "codigo_licencia" TEXT NOT NULL,
    "correo_paypal" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "activaciones" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "id_licencia" INTEGER NOT NULL,
    "clave_amarilla" TEXT NOT NULL,
    "pc_nombre" TEXT NOT NULL,
    "fecha_hora" TEXT NOT NULL,
    CONSTRAINT "activaciones_id_licencia_fkey" FOREIGN KEY ("id_licencia") REFERENCES "maestro_licencias" ("id_licencia") ON DELETE RESTRICT ON UPDATE CASCADE
);
