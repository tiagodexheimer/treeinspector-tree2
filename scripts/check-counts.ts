
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const treeCount = await prisma.tree.count();
    const inspectionCount = await prisma.inspection.count();
    const phytoCount = await prisma.phytosanitaryData.count();

    console.log(`Trees: ${treeCount}`);
    console.log(`Inspections: ${inspectionCount}`);
    console.log(`Phyto: ${phytoCount}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
