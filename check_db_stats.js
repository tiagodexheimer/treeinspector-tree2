
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const osCount = await prisma.serviceOrder.count();
    const treeCount = await prisma.tree.count();
    const activeOSCount = await prisma.serviceOrder.count({
        where: { status: { notIn: ['Concluída', 'Cancelada'] } }
    });

    console.log('--- Database Stats ---');
    console.log('Total Service Orders:', osCount);
    console.log('Active Service Orders:', activeOSCount);
    console.log('Total Trees:', treeCount);
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
