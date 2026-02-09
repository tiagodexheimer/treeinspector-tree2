const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const tables = ['ServiceOrder', 'Tree', 'Species', 'ManagementAction', 'ServiceOrderPhoto', 'ServiceOrderMaterial', '_ServiceOrderToTree'];

    for (const table of tables) {
        const count = await prisma.$queryRawUnsafe(`SELECT COUNT(*) FROM "${table}"`);
        console.log(`${table}: ${count[0].count} rows`);
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
