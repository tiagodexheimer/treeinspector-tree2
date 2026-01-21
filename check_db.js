const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        const count = await prisma.tree.count();
        console.log(`Total trees: ${count}`);

        const trees = await prisma.$queryRaw`
            SELECT id_arvore, ST_AsText(localizacao) as loc 
            FROM "Tree" 
            WHERE localizacao IS NOT NULL 
            LIMIT 10
        `;
        console.log('Sample trees:', JSON.stringify(trees, null, 2));
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
