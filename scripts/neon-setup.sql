-- =============================================================================
-- Natural Land CR: creación de la base de datos en Neon (pegar en el SQL Editor)
--
-- Equivale a `npm run db:setup`. Ejecutar UNA sola vez, sobre una base vacía.
-- Todo corre en una transacción: si algo falla, no queda nada a medias.
--
-- Antes de ejecutar: revisar los correos de administradores en la sección 3.
-- =============================================================================

BEGIN;

-- -----------------------------------------------------------------------------
-- 1. Tablas: copia exacta de prisma/migrations/20260929033721_init/migration.sql
-- -----------------------------------------------------------------------------

-- CreateEnum
CREATE TYPE "TourStatus" AS ENUM ('DRAFT', 'PUBLISHED');

-- CreateEnum
CREATE TYPE "Difficulty" AS ENUM ('EASY', 'MODERATE', 'CHALLENGING');

-- CreateEnum
CREATE TYPE "Locale" AS ENUM ('es', 'en');

-- CreateEnum
CREATE TYPE "TranslationSource" AS ENUM ('ORIGINAL', 'MACHINE', 'MANUAL');

-- CreateEnum
CREATE TYPE "MediaType" AS ENUM ('IMAGE', 'VIDEO');

-- CreateTable
CREATE TABLE "Tour" (
    "id" TEXT NOT NULL,
    "status" "TourStatus" NOT NULL DEFAULT 'DRAFT',
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "position" INTEGER NOT NULL DEFAULT 0,
    "durationMinutes" INTEGER,
    "difficulty" "Difficulty",
    "location" TEXT,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tour_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TourTranslation" (
    "id" TEXT NOT NULL,
    "tourId" TEXT NOT NULL,
    "locale" "Locale" NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "itinerary" TEXT,
    "includes" TEXT[],
    "excludes" TEXT[],
    "whatToBring" TEXT[],
    "meetingPoint" TEXT,
    "seoTitle" TEXT,
    "seoDescription" TEXT,
    "source" "TranslationSource" NOT NULL,
    "sourceHash" TEXT,
    "translatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TourTranslation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Media" (
    "id" TEXT NOT NULL,
    "tourId" TEXT NOT NULL,
    "type" "MediaType" NOT NULL,
    "publicId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "format" TEXT NOT NULL,
    "width" INTEGER NOT NULL,
    "height" INTEGER NOT NULL,
    "bytes" INTEGER NOT NULL,
    "durationSec" DOUBLE PRECISION,
    "altEs" TEXT,
    "altEn" TEXT,
    "position" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Media_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminUser" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdminUser_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Tour_status_featured_position_idx" ON "Tour"("status", "featured", "position");

-- CreateIndex
CREATE UNIQUE INDEX "TourTranslation_tourId_locale_key" ON "TourTranslation"("tourId", "locale");

-- CreateIndex
CREATE UNIQUE INDEX "TourTranslation_locale_slug_key" ON "TourTranslation"("locale", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "Media_publicId_key" ON "Media"("publicId");

-- CreateIndex
CREATE INDEX "Media_tourId_position_idx" ON "Media"("tourId", "position");

-- CreateIndex
CREATE UNIQUE INDEX "AdminUser_email_key" ON "AdminUser"("email");

-- AddForeignKey
ALTER TABLE "TourTranslation" ADD CONSTRAINT "TourTranslation_tourId_fkey" FOREIGN KEY ("tourId") REFERENCES "Tour"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Media" ADD CONSTRAINT "Media_tourId_fkey" FOREIGN KEY ("tourId") REFERENCES "Tour"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- -----------------------------------------------------------------------------
-- 2. Registro de migraciones de Prisma
--    Marca la migración inicial como aplicada, para que en el futuro
--    `npm run db:deploy` aplique solo las migraciones nuevas y no intente
--    crear estas tablas otra vez. El checksum es el sha256 de migration.sql.
-- -----------------------------------------------------------------------------

CREATE TABLE "_prisma_migrations" (
    "id"                  VARCHAR(36) PRIMARY KEY NOT NULL,
    "checksum"            VARCHAR(64) NOT NULL,
    "finished_at"         TIMESTAMPTZ,
    "migration_name"      VARCHAR(255) NOT NULL,
    "logs"                TEXT,
    "rolled_back_at"      TIMESTAMPTZ,
    "started_at"          TIMESTAMPTZ NOT NULL DEFAULT now(),
    "applied_steps_count" INTEGER NOT NULL DEFAULT 0
);

INSERT INTO "_prisma_migrations" ("id", "checksum", "finished_at", "migration_name", "applied_steps_count")
VALUES (
    gen_random_uuid()::text,
    '798228a62434464746bf6ba61aac1aefbe004f005bb1ab21b268f97cc95c6d3c',
    now(),
    '20260929033721_init',
    1
);

-- -----------------------------------------------------------------------------
-- 3. Administradores del panel (lista blanca para el login con Google)
--    Un correo por fila; siempre en minúsculas y completo (con @).
-- -----------------------------------------------------------------------------

INSERT INTO "AdminUser" ("id", "email", "updatedAt")
VALUES
    (gen_random_uuid()::text, lower('geinerfa@gmail.com'), CURRENT_TIMESTAMP)
    -- , (gen_random_uuid()::text, lower('otro@correo.com'), CURRENT_TIMESTAMP)
ON CONFLICT ("email") DO UPDATE SET "active" = true, "updatedAt" = CURRENT_TIMESTAMP;

COMMIT;

-- -----------------------------------------------------------------------------
-- 4. Verificación (debe mostrar 5 tablas, 1 migración y tus administradores)
-- -----------------------------------------------------------------------------

SELECT
    (SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public') AS tablas,
    (SELECT count(*) FROM "_prisma_migrations" WHERE finished_at IS NOT NULL)      AS migraciones,
    (SELECT string_agg(email, ', ') FROM "AdminUser" WHERE active)                AS administradores;
