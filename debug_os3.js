const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const os3 = await prisma.serviceOrder.findUnique({
        where: { id: 3 },
        include: {
            materials: true,
            trees: true
        }
    });

    console.log('Service Order 3:');
    console.log(JSON.stringify(os3, null, 2));

    const totalCost = os3.materials.reduce((sum, mat) => {
        return sum + (Number(mat.quantity) * Number(mat.unit_cost));
    }, 0);

    console.log('\nCalculated Total Cost (quantity * unit_cost):', totalCost);
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
