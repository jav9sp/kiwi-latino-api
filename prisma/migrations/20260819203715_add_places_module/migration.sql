-- CreateEnum
CREATE TYPE "PlaceCategory" AS ENUM ('ALOJAMIENTO', 'RESTORAN', 'CAFE', 'LUGAR_TURISTICO', 'TIENDA', 'EVENTO', 'OTRO');

-- AlterEnum
ALTER TYPE "PostModule" ADD VALUE 'PLACES';

-- AlterTable
ALTER TABLE "posts" ADD COLUMN     "category" "PlaceCategory";

-- CreateIndex
CREATE INDEX "posts_module_category_idx" ON "posts"("module", "category");
