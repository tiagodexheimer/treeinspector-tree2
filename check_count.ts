
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const trees = await prisma.tree.count();
    const species = await prisma.species.count();
    const inspections = await prisma.inspection.count();
    console.log(`Trees: ${trees}, Species: ${species}, Inspections: ${inspections}`);
}

main()
    .then(async () => { await prisma.$disconnect() })
    .catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1); })
