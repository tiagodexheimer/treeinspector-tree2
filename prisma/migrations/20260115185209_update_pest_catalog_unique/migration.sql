-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "postgis";

-- CreateEnum
CREATE TYPE "RiskProbability" AS ENUM ('Baixa', 'Moderada', 'Alta', 'Extrema');

-- CreateTable
CREATE TABLE "Species" (
    "id_especie" SERIAL NOT NULL,
    "nome_comum" TEXT NOT NULL,
    "nome_cientifico" TEXT NOT NULL,
    "family" TEXT,
    "native_status" TEXT,
    "gbif_id" BIGINT,
    "plantnet_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Species_pkey" PRIMARY KEY ("id_especie")
);

-- CreateTable
CREATE TABLE "Tree" (
    "id_arvore" SERIAL NOT NULL,
    "uuid" TEXT,
    "numero_etiqueta" TEXT,
    "nome_popular" TEXT,
    "cover_photo" TEXT,
    "localizacao" geometry(Point, 4326),
    "rua" TEXT,
    "numero" TEXT,
    "bairro" TEXT,
    "endereco" TEXT,
    "speciesId" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tree_pkey" PRIMARY KEY ("id_arvore")
);

-- CreateTable
CREATE TABLE "Inspection" (
    "id_inspecao" SERIAL NOT NULL,
    "uuid" TEXT,
    "data_inspecao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "treeId" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Inspection_pkey" PRIMARY KEY ("id_inspecao")
);

-- CreateTable
CREATE TABLE "DendrometricData" (
    "id" SERIAL NOT NULL,
    "inspectionId" INTEGER NOT NULL,
    "dap1_cm" DECIMAL(65,30),
    "dap2_cm" DECIMAL(65,30),
    "dap3_cm" DECIMAL(65,30),
    "dap4_cm" DECIMAL(65,30),
    "altura_total_m" DECIMAL(65,30),
    "altura_copa_m" DECIMAL(65,30),
    "valid_from" TIMESTAMP(3) NOT NULL,
    "valid_to" TIMESTAMP(3),

    CONSTRAINT "DendrometricData_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PestCatalog" (
    "id" SERIAL NOT NULL,
    "nome_comum" TEXT NOT NULL,
    "nome_cientifico" TEXT,
    "tipo" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PestCatalog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PhytosanitaryData" (
    "id" SERIAL NOT NULL,
    "inspectionId" INTEGER NOT NULL,
    "estado_saude" TEXT,
    "severity_level" INTEGER,
    "risk_probability" "RiskProbability",
    "target_value" INTEGER,
    "risk_rating" INTEGER,
    "danos_tipo" TEXT,
    "valid_from" TIMESTAMP(3) NOT NULL,
    "valid_to" TIMESTAMP(3),

    CONSTRAINT "PhytosanitaryData_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ManagementAction" (
    "id" SERIAL NOT NULL,
    "inspectionId" INTEGER NOT NULL,
    "necessita_manejo" BOOLEAN NOT NULL DEFAULT false,
    "manejo_tipo" TEXT,
    "poda_tipos" TEXT[],
    "supressao_tipo" TEXT,
    "justification" TEXT,
    "valid_from" TIMESTAMP(3) NOT NULL,
    "valid_to" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ManagementAction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceOrder" (
    "id" SERIAL NOT NULL,
    "status" TEXT NOT NULL,
    "assigned_to" TEXT,
    "observations" TEXT,
    "description" TEXT,
    "serviceType" TEXT,
    "serviceSubtypes" TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "executed_at" TIMESTAMP(3),

    CONSTRAINT "ServiceOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceOrderPhoto" (
    "id" SERIAL NOT NULL,
    "serviceOrderId" INTEGER NOT NULL,
    "uri" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ServiceOrderPhoto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PhotoMetadata" (
    "id" SERIAL NOT NULL,
    "blob_url" TEXT NOT NULL,
    "blob_key" TEXT,
    "file_name" TEXT NOT NULL,
    "file_size" INTEGER,
    "mime_type" TEXT,
    "tree_id" INTEGER,
    "captured_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "uploaded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "capture_lat" DOUBLE PRECISION,
    "capture_lng" DOUBLE PRECISION,

    CONSTRAINT "PhotoMetadata_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InspectionPhoto" (
    "id_foto" SERIAL NOT NULL,
    "inspectionId" INTEGER NOT NULL,
    "uri" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InspectionPhoto_pkey" PRIMARY KEY ("id_foto")
);

-- CreateTable
CREATE TABLE "_PestCatalogToPhytosanitaryData" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL
);

-- CreateTable
CREATE TABLE "_ManagementActionToServiceOrder" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL
);

-- CreateTable
CREATE TABLE "_ServiceOrderToTree" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Species_nome_cientifico_key" ON "Species"("nome_cientifico");

-- CreateIndex
CREATE UNIQUE INDEX "Tree_uuid_key" ON "Tree"("uuid");

-- CreateIndex
CREATE UNIQUE INDEX "Inspection_uuid_key" ON "Inspection"("uuid");

-- CreateIndex
CREATE INDEX "Inspection_treeId_idx" ON "Inspection"("treeId");

-- CreateIndex
CREATE INDEX "Inspection_data_inspecao_idx" ON "Inspection"("data_inspecao");

-- CreateIndex
CREATE INDEX "DendrometricData_inspectionId_idx" ON "DendrometricData"("inspectionId");

-- CreateIndex
CREATE UNIQUE INDEX "PestCatalog_nome_comum_key" ON "PestCatalog"("nome_comum");

-- CreateIndex
CREATE INDEX "PhytosanitaryData_inspectionId_idx" ON "PhytosanitaryData"("inspectionId");

-- CreateIndex
CREATE INDEX "ManagementAction_inspectionId_idx" ON "ManagementAction"("inspectionId");

-- CreateIndex
CREATE INDEX "ServiceOrder_status_idx" ON "ServiceOrder"("status");

-- CreateIndex
CREATE INDEX "ServiceOrder_assigned_to_idx" ON "ServiceOrder"("assigned_to");

-- CreateIndex
CREATE INDEX "PhotoMetadata_tree_id_idx" ON "PhotoMetadata"("tree_id");

-- CreateIndex
CREATE UNIQUE INDEX "_PestCatalogToPhytosanitaryData_AB_unique" ON "_PestCatalogToPhytosanitaryData"("A", "B");

-- CreateIndex
CREATE INDEX "_PestCatalogToPhytosanitaryData_B_index" ON "_PestCatalogToPhytosanitaryData"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_ManagementActionToServiceOrder_AB_unique" ON "_ManagementActionToServiceOrder"("A", "B");

-- CreateIndex
CREATE INDEX "_ManagementActionToServiceOrder_B_index" ON "_ManagementActionToServiceOrder"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_ServiceOrderToTree_AB_unique" ON "_ServiceOrderToTree"("A", "B");

-- CreateIndex
CREATE INDEX "_ServiceOrderToTree_B_index" ON "_ServiceOrderToTree"("B");

-- AddForeignKey
ALTER TABLE "Tree" ADD CONSTRAINT "Tree_speciesId_fkey" FOREIGN KEY ("speciesId") REFERENCES "Species"("id_especie") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Inspection" ADD CONSTRAINT "Inspection_treeId_fkey" FOREIGN KEY ("treeId") REFERENCES "Tree"("id_arvore") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DendrometricData" ADD CONSTRAINT "DendrometricData_inspectionId_fkey" FOREIGN KEY ("inspectionId") REFERENCES "Inspection"("id_inspecao") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PhytosanitaryData" ADD CONSTRAINT "PhytosanitaryData_inspectionId_fkey" FOREIGN KEY ("inspectionId") REFERENCES "Inspection"("id_inspecao") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ManagementAction" ADD CONSTRAINT "ManagementAction_inspectionId_fkey" FOREIGN KEY ("inspectionId") REFERENCES "Inspection"("id_inspecao") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceOrderPhoto" ADD CONSTRAINT "ServiceOrderPhoto_serviceOrderId_fkey" FOREIGN KEY ("serviceOrderId") REFERENCES "ServiceOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PhotoMetadata" ADD CONSTRAINT "PhotoMetadata_tree_id_fkey" FOREIGN KEY ("tree_id") REFERENCES "Tree"("id_arvore") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InspectionPhoto" ADD CONSTRAINT "InspectionPhoto_inspectionId_fkey" FOREIGN KEY ("inspectionId") REFERENCES "Inspection"("id_inspecao") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PestCatalogToPhytosanitaryData" ADD CONSTRAINT "_PestCatalogToPhytosanitaryData_A_fkey" FOREIGN KEY ("A") REFERENCES "PestCatalog"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PestCatalogToPhytosanitaryData" ADD CONSTRAINT "_PestCatalogToPhytosanitaryData_B_fkey" FOREIGN KEY ("B") REFERENCES "PhytosanitaryData"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ManagementActionToServiceOrder" ADD CONSTRAINT "_ManagementActionToServiceOrder_A_fkey" FOREIGN KEY ("A") REFERENCES "ManagementAction"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ManagementActionToServiceOrder" ADD CONSTRAINT "_ManagementActionToServiceOrder_B_fkey" FOREIGN KEY ("B") REFERENCES "ServiceOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ServiceOrderToTree" ADD CONSTRAINT "_ServiceOrderToTree_A_fkey" FOREIGN KEY ("A") REFERENCES "ServiceOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ServiceOrderToTree" ADD CONSTRAINT "_ServiceOrderToTree_B_fkey" FOREIGN KEY ("B") REFERENCES "Tree"("id_arvore") ON DELETE CASCADE ON UPDATE CASCADE;
