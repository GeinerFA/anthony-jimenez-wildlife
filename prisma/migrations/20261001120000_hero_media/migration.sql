-- CreateEnum
CREATE TYPE "HeroPage" AS ENUM ('HOME', 'TOURS', 'CONTACT');

-- CreateTable
CREATE TABLE "HeroMedia" (
    "page" "HeroPage" NOT NULL,
    "type" "MediaType" NOT NULL,
    "publicId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "format" TEXT NOT NULL,
    "width" INTEGER NOT NULL,
    "height" INTEGER NOT NULL,
    "bytes" INTEGER NOT NULL,
    "durationSec" DOUBLE PRECISION,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HeroMedia_pkey" PRIMARY KEY ("page")
);

-- CreateIndex
CREATE UNIQUE INDEX "HeroMedia_publicId_key" ON "HeroMedia"("publicId");

