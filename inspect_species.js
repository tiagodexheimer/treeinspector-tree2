const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const ipe = await prisma.species.findMany({
        where: {
            OR: [
                { nome_comum: { contains: 'Ipê', mode: 'insensitive' } },
                { nome_cientifico: { contains: 'Handroanthus', mode: 'insensitive' } },
                { nome_comum: { contains: 'Syagrus', mode: 'insensitive' } },
                { id_especie: 1 }
            ]
        }
    });
    console.log('Relevant Species:');
    ipe.forEach(s => console.log(`${s.id_especie}: ${s.nome_comum} - ${s.nome_cientifico}`));
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
