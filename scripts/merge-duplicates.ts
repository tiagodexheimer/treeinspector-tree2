
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    // 1. Find all trees with tags that appear more than once
    const duplicates = await prisma.$queryRaw`
    SELECT numero_etiqueta, COUNT(*) as count 
    FROM "Tree" 
    WHERE numero_etiqueta IS NOT NULL AND numero_etiqueta != ''
    GROUP BY numero_etiqueta 
    HAVING COUNT(*) > 1
  ` as any[];

    console.log(`Found ${duplicates.length} tags with duplicates.`);

    for (const dup of duplicates) {
        const tag = dup.numero_etiqueta;
        const allTrees = await prisma.tree.findMany({
            where: { numero_etiqueta: tag },
            orderBy: { id_arvore: 'asc' }
        });

        const canonical = allTrees[0];
        const duplicatesToDelete = allTrees.slice(1);

        console.log(`Tag ${tag}: Keeping ID ${canonical.id_arvore}, merging ${duplicatesToDelete.length} duplicates.`);

        for (const d of duplicatesToDelete) {
            // Move Inspections
            await prisma.inspection.updateMany({
                where: { treeId: d.id_arvore },
                data: { treeId: canonical.id_arvore }
            });

            // Delete duplicate tree
            await prisma.tree.delete({ where: { id_arvore: d.id_arvore } });
        }
    }
}

main().catch(console.error).finally(() => prisma.$disconnect());
