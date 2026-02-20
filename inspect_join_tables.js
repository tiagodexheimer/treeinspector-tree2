
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const tables = await prisma.$queryRaw`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name LIKE '\_%';
    `;
    console.log('--- Join Tables ---');
    console.log(JSON.stringify(tables, null, 2));

    for (const t of tables) {
        const name = t.table_name;
        const columns = await prisma.$queryRawUnsafe(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = '${name}'
        `);
        console.log(`--- Columns for ${name} ---`);
        console.log(JSON.stringify(columns, null, 2));
    }
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
