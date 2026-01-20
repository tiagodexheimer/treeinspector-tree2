const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const uuid = 'bcb3967a-cc0b-4daa-9c49-ec225311429d';
    const tree = await prisma.tree.findUnique({
        where: { uuid: uuid },
        include: {
            inspections: {
                orderBy: { data_inspecao: 'desc' },
                take: 1
            }
        }
    });

    // We can't easily see geography/geometry via findUnique directly in JSON,
    // let's use a raw query to check if localizacao is set.
    const rawTree = await prisma.$queryRaw`
        SELECT ST_AsText(localizacao) as loc_text, ST_Y(localizacao::geometry) as lat, ST_X(localizacao::geometry) as lng
        FROM "Tree" WHERE uuid = ${uuid}
    `;

    if (tree) {
        console.log('Tree found:', {
            id: tree.id_arvore,
            uuid: tree.uuid,
            etiqueta: tree.numero_etiqueta,
            nome: tree.nome_popular,
            inspections_count: tree.inspections.length,
            loc: rawTree[0]?.loc_text || 'NULL',
            coords: rawTree[0] ? { lat: rawTree[0].lat, lng: rawTree[0].lng } : 'N/A'
        });
        if (tree.inspections.length > 0) {
            console.log('Latest Inspection:', {
                id: tree.inspections[0].id_inspecao,
                uuid: tree.inspections[0].uuid,
                data: tree.inspections[0].data_inspecao
            });
        }
    } else {
        console.log('Tree NOT found with UUID:', uuid);
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
