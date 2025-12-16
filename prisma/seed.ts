import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    const species = await prisma.species.upsert({
        where: { id_especie: 1 },
        update: {},
        create: {
            id_especie: 1,
            nome_cientifico: 'Unknown',
            nome_comum: 'Desconhecida',
        },
    })
    console.log({ species })
}

main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    })
