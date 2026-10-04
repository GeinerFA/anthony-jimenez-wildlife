-- CreateEnum
CREATE TYPE "TourCategory" AS ENUM ('TOUR', 'DAY_TOUR', 'GIRA');

-- AlterTable: los tours que ya existen quedan en la categoría general (TOUR).
ALTER TABLE "Tour" ADD COLUMN "category" "TourCategory" NOT NULL DEFAULT 'TOUR';

-- CreateIndex
CREATE INDEX "Tour_category_status_position_idx" ON "Tour"("category", "status", "position");
