const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const tree = await prisma.tree.findUnique({
        where: { uuid: 'test-uuid-2' },
        include: { inspections: { include: { phytosanitary: true, photos: true } } }
    });
    console.log(JSON.stringify(tree, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
