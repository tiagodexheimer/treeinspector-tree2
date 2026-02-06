import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const treeId = 1115;

    console.log(`--- Checking Tree ${treeId} ---`);
    const tree = await prisma.tree.findUnique({
        where: { id_arvore: treeId },
        include: { serviceOrders: true }
    });

    if (!tree) {
        console.log("Tree not found");
        return;
    }

    console.log("Tree Status:", (tree as any).status);
    console.log("Tree Data:", JSON.stringify(tree, null, 2));

    console.log("\n--- Associated Service Orders ---");
    for (const os of tree.serviceOrders) {
        console.log(`OS ID: ${os.id}`);
        console.log(`  Type: ${os.serviceType}`);
        console.log(`  Subtypes: ${os.serviceSubtypes}`);
        console.log(`  Status: ${os.status}`);
        console.log(`  Raw:`, JSON.stringify(os, null, 2));
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
