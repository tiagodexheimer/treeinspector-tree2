const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('--- Checking Indexes ---');
    const indexes = await prisma.$queryRaw`
    SELECT
        tablename,
        indexname,
        indexdef
    FROM
        pg_indexes
    WHERE
        schemaname = 'public'
    ORDER BY
        tablename,
        indexname;
  `;
    console.table(indexes);

    console.log('\n--- Checking ServiceOrder 12 Stats ---');
    const os = await prisma.serviceOrder.findUnique({ where: { id: 12 } });
    if (os) {
        const trees = await prisma.$queryRaw`SELECT COUNT(*) FROM "_ServiceOrderToTree" WHERE "A" = 12`;
        const photos = await prisma.serviceOrderPhoto.count({ where: { serviceOrderId: 12 } });
        const materials = await prisma.serviceOrderMaterial.count({ where: { serviceOrderId: 12 } });
        console.log({
            osId: 12,
            treeCount: Number(trees[0].count),
            photoCount: photos,
            materialCount: materials
        });
    } else {
        console.log('OS 12 not found');
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
