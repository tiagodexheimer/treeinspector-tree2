-- CreateEnum
CREATE TYPE "TreeSize" AS ENUM ('Pequeno', 'Medio', 'Grande');

-- AlterTable
ALTER TABLE "Species" ADD COLUMN     "description" TEXT,
ADD COLUMN     "growth_rate" TEXT,
ADD COLUMN     "max_height_m" DECIMAL(65,30),
ADD COLUMN     "porte" "TreeSize";
