
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const trees = await prisma.tree.findMany({
        where: { numero_etiqueta: '76' },
        orderBy: { id_arvore: 'asc' }
    });

    console.log(JSON.stringify(trees, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
