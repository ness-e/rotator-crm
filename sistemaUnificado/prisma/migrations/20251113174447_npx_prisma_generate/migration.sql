-- CreateTable
CREATE TABLE "maestro_clientes" (
    "id_cliente" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nombre_cliente" TEXT,
    "apellido_cliente" TEXT,
    "pais_cliente" TEXT,
    "ciudad_cliente" TEXT,
    "organizacion_cliente" TEXT,
    "direccion_cliente" TEXT,
    "correo_cliente" TEXT,
    "telefono_cliente" TEXT,
    "skype_cliente" TEXT,
    "password_cliente" TEXT,
    "fecha_registro" TEXT,
    "tipo_usuario" TEXT
);

-- CreateTable
CREATE TABLE "maestro_licencias" (
    "id_licencia" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "id_cliente" INTEGER NOT NULL,
    "licencia_serial" TEXT,
    "licencia_expira" TEXT,
    "licencia_tipo" TEXT,
    "licencia_activador" TEXT,
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
    "cuestionarios_concurrentes" INTEGER,
    "clave_activacion_encriptada" TEXT,
    CONSTRAINT "maestro_licencias_id_cliente_fkey" FOREIGN KEY ("id_cliente") REFERENCES "maestro_clientes" ("id_cliente") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "maestro_hosting" (
    "id_hosting" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "version_hosting" TEXT,
    "letras_hosting" TEXT,
    "cuestionarios_c" INTEGER
);

-- CreateIndex
CREATE UNIQUE INDEX "maestro_licencias_id_cliente_key" ON "maestro_licencias"("id_cliente");
