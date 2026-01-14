
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Cleaning database...');

    // Delete in order to respect foreign keys
    try {
        await prisma.photoMetadata.deleteMany({});
        await prisma.serviceOrderPhoto.deleteMany({});
        await prisma.inspectionPhoto.deleteMany({});

        // Break many-to-many before deleting
        // Not strictly necessary if using cascade delete in schema, but good practice

        await prisma.managementAction.deleteMany({});
        await prisma.phytosanitaryData.deleteMany({});
        await prisma.dendrometricData.deleteMany({});
        await prisma.inspection.deleteMany({});

        // Delete ServiceOrders (might have trees linked)
        // Prisma Schema for ServiceOrder<->Tree is explicit many-to-many usually handled by join table.
        // Prisma handles the join table deletion normally, but let's be safe.
        await prisma.serviceOrder.deleteMany({});

        await prisma.tree.deleteMany({});

        // Optional: Species usually don't need to be deleted
        // await prisma.species.deleteMany({});

        console.log('✅ Database cleaned successfully!');
    } catch (error) {
        console.error('Error cleaning database:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
