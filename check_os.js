const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const counts = await prisma.serviceOrder.groupBy({
        by: ['status'],
        _count: {
            id: true
        }
    });
    console.log('Counts:', JSON.stringify(counts, null, 2));
    console.log('Sample:', JSON.stringify(all, null, 2));
}

main()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
