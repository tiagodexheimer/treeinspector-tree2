
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
    const tree = await prisma.tree.findFirst({
        where: {
            OR: [
                { numero_etiqueta: '17177' },
                { id_arvore: 17184 }
            ]
        },
        include: {
            photos: true,
            inspections: {
                include: {
                    photos: true
                }
            }
        }
    });

    console.log('Tree:', tree ? tree.id_arvore : 'Not found');
    if (tree) {
        console.log('Tree Photos:', tree.photos);
        console.log('Inspections:', JSON.stringify(tree.inspections, null, 2));
    }
}

check();
