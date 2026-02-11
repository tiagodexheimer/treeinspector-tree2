-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "unaccent";

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'GESTOR', 'INSPETOR', 'OPERACIONAL');

-- CreateEnum
CREATE TYPE "ServicePriority" AS ENUM ('Baixa', 'Moderada', 'Alta', 'Emergencial');

-- CreateEnum
CREATE TYPE "PhotoCategory" AS ENUM ('Antes', 'Durante', 'Depois');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "RiskProbability" ADD VALUE 'MUITO_PROVAVEL';
ALTER TYPE "RiskProbability" ADD VALUE 'PROVAVEL';
ALTER TYPE "RiskProbability" ADD VALUE 'POSSIVEL';
ALTER TYPE "RiskProbability" ADD VALUE 'IMPROVAVEL';
ALTER TYPE "RiskProbability" ADD VALUE 'IMINENTE';
ALTER TYPE "RiskProbability" ADD VALUE 'IMPROVAVEL_X';

-- AlterTable
ALTER TABLE "Inspection" ADD COLUMN     "createdById" TEXT,
ADD COLUMN     "tree_removed" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "ServiceOrder" ADD COLUMN     "adjustment_notes" TEXT,
ADD COLUMN     "assignedToId" TEXT,
ADD COLUMN     "cancel_reason" TEXT,
ADD COLUMN     "checklist" JSONB,
ADD COLUMN     "createdById" TEXT,
ADD COLUMN     "priority" "ServicePriority" NOT NULL DEFAULT 'Moderada',
ADD COLUMN     "start_time" TIMESTAMP(3),
ADD COLUMN     "team_size" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "ServiceOrderPhoto" ADD COLUMN     "category" "PhotoCategory" NOT NULL DEFAULT 'Depois';

-- AlterTable
ALTER TABLE "Tree" ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'Ativa';

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'OPERACIONAL',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceOrderMaterial" (
    "id" SERIAL NOT NULL,
    "serviceOrderId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "quantity" DECIMAL(65,30) NOT NULL,
    "unit" TEXT,
    "unit_cost" DECIMAL(65,30) NOT NULL DEFAULT 0,

    CONSTRAINT "ServiceOrderMaterial_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MaterialMaster" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "unit_cost" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "auto_load" BOOLEAN NOT NULL DEFAULT false,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MaterialMaster_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "MaterialMaster_name_key" ON "MaterialMaster"("name");

-- AddForeignKey
ALTER TABLE "Inspection" ADD CONSTRAINT "Inspection_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceOrder" ADD CONSTRAINT "ServiceOrder_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceOrder" ADD CONSTRAINT "ServiceOrder_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceOrderMaterial" ADD CONSTRAINT "ServiceOrderMaterial_serviceOrderId_fkey" FOREIGN KEY ("serviceOrderId") REFERENCES "ServiceOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
