
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const targetTables = ['_ServiceOrderToTree', '_ManagementActionToServiceOrder'];

    for (const name of targetTables) {
        console.log(`--- Structure for ${name} ---`);
        try {
            const columns = await prisma.$queryRawUnsafe(`
                SELECT column_name, data_type 
                FROM information_schema.columns 
                WHERE table_name = '${name}'
                ORDER BY column_name
            `);
            console.log(JSON.stringify(columns, null, 2));

            // Also check a sample record if exists
            const sample = await prisma.$queryRawUnsafe(`SELECT * FROM "${name}" LIMIT 1`);
            console.log(`Sample for ${name}:`, JSON.stringify(sample, null, 2));
        } catch (e) {
            console.log(`Error checking ${name}: ${e.message}`);
        }
    }
}

main().catch(console.error).finally(() => prisma.$disconnect());
