const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('--- Checking Tree Cover Photos ---');
    const trees = await prisma.tree.findMany({
        take: 5,
        orderBy: { id_arvore: 'desc' },
        select: { id_arvore: true, numero_etiqueta: true, cover_photo: true }
    });
    console.table(trees);

    console.log('\n--- Checking Successful Uploads (Trees) ---');
    const uploadedTrees = await prisma.tree.findMany({
        where: { cover_photo: { contains: '/uploads/' } },
        select: { id_arvore: true, numero_etiqueta: true, cover_photo: true }
    });
    console.table(uploadedTrees);

    console.log('\n--- Checking Successful Uploads (Inspections) ---');
    const uploadedPhotos = await prisma.inspectionPhoto.findMany({
        where: { uri: { contains: '/uploads/' } },
        select: { id_foto: true, uri: true }
    });
    console.table(uploadedPhotos);
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
