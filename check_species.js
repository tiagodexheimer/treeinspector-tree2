const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const species = await prisma.species.findMany({
        take: 50,
        select: { id_especie: true, nome_comum: true }
    });
    species.forEach(s => console.log(`${s.id_especie}: ${s.nome_comum}`));
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
