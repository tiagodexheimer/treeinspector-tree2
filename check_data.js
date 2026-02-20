const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const treeCount = await prisma.tree.count();
    const speciesCount = await prisma.species.count();
    const soCount = await prisma.serviceOrder.count();
    console.log(`Trees: ${treeCount}`);
    console.log(`Species: ${speciesCount}`);
    console.log(`Service Orders: ${soCount}`);
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
