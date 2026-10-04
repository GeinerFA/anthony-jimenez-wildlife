-- AlterTable
ALTER TABLE "Tour" ADD COLUMN     "priceFrom" INTEGER;

-- AlterTable
ALTER TABLE "TourTranslation" ADD COLUMN     "prices" TEXT[] DEFAULT ARRAY[]::TEXT[];

