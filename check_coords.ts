
import { prisma } from './app/lib/prisma';

async function main() {
    const trees = await prisma.tree.findMany({
        take: 5,
        select: { lat: true, lng: true, rua: true, bairro: true }
    });
    console.log("Sample Trees coordinates:");
    console.log(trees);
}

main().catch(console.error).finally(() => prisma.$disconnect());
