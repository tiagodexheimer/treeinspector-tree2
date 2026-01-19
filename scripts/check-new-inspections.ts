
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const lastInspections = await prisma.inspection.findMany({
        orderBy: { id_inspecao: 'desc' },
        take: 7,
        include: {
            tree: {
                select: {
                    id_arvore: true,
                    numero_etiqueta: true,
                    uuid: true
                }
            }
        }
    });

    console.log(JSON.stringify(lastInspections, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
