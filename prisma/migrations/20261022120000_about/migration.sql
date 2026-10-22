-- CreateEnum
CREATE TYPE "SocialNetwork" AS ENUM ('INSTAGRAM', 'FACEBOOK', 'TIKTOK');

-- AlterEnum
ALTER TYPE "HeroPage" ADD VALUE 'ABOUT';

-- CreateTable
CREATE TABLE "AboutProfile" (
    "id" TEXT NOT NULL DEFAULT 'about',
    "bioEs" TEXT NOT NULL DEFAULT '',
    "bioEn" TEXT,
    "quoteEs" TEXT,
    "quoteEn" TEXT,
    "enManual" BOOLEAN NOT NULL DEFAULT false,
    "photoPublicId" TEXT,
    "photoUrl" TEXT,
    "photoWidth" INTEGER,
    "photoHeight" INTEGER,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AboutProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SocialStat" (
    "id" TEXT NOT NULL,
    "network" "SocialNetwork",
    "value" INTEGER NOT NULL,
    "suffix" TEXT,
    "labelEs" TEXT NOT NULL,
    "labelEn" TEXT,
    "enManual" BOOLEAN NOT NULL DEFAULT false,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SocialStat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Partner" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT,
    "logoPublicId" TEXT NOT NULL,
    "logoUrl" TEXT NOT NULL,
    "logoWidth" INTEGER NOT NULL,
    "logoHeight" INTEGER NOT NULL,
    "descEs" TEXT,
    "descEn" TEXT,
    "enManual" BOOLEAN NOT NULL DEFAULT false,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Partner_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AboutProfile_photoPublicId_key" ON "AboutProfile"("photoPublicId");

-- CreateIndex
CREATE INDEX "SocialStat_position_idx" ON "SocialStat"("position");

-- CreateIndex
CREATE UNIQUE INDEX "Partner_logoPublicId_key" ON "Partner"("logoPublicId");

-- CreateIndex
CREATE INDEX "Partner_active_position_idx" ON "Partner"("active", "position");

