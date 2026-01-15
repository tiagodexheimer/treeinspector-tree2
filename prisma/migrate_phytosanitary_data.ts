
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const SEVERITY_MAP: Record<string, number> = {
    'Leve': 1,
    'Baixa': 1,
    'Médio': 3,
    'Média': 3,
    'Regular': 3,
    'Alto': 5,
    'Alta': 5,
    'Severa': 5,
    'Grave': 5
};

async function main() {
    console.log('Starting migration of Phytosanitary Data (Optimized)...');

    const total = await prisma.phytosanitaryData.count();
    console.log(`Total records: ${total}`);

    let processed = 0;
    // Reduced batch size to match typical DB connection pool limits (usually 10-50)
    const BATCH_SIZE = 40;

    // Cursor-based pagination
    let cursorId: number | undefined;

    while (processed < total) {
        const records = await prisma.phytosanitaryData.findMany({
            take: BATCH_SIZE,
            skip: cursorId ? 1 : 0,
            cursor: cursorId ? { id: cursorId } : undefined,
            orderBy: { id: 'asc' }
        });

        if (records.length === 0) break;

        const promises = records.map(async (record) => {
            let updates: any = {};
            let needsUpdate = false;

            // 1. Migrate Severity
            if (record.danos_severidade && !record.severity_level) {
                const sev = Object.keys(SEVERITY_MAP).find(k => k.toLowerCase() === record.danos_severidade?.toLowerCase());
                if (sev) {
                    updates.severity_level = SEVERITY_MAP[sev];
                    needsUpdate = true;
                }
            }

            // 2. Migrate Pests
            if (record.pragas && record.pragas.length > 0 && Array.isArray(record.pragas)) {
                // Check if already migrated? (Optimization: if record.pests already has entries check relation count? 
                // For now just assume if pest relation is empty we migrate.
                // Note: This script is idempotent-ish if we check existing relations, but `update` with `connect` creates new links. 
                // Better to check if already linked? Or simpler: Trust `pragas` source.

                // To avoid N+1 reads for every record checking relations, we just upsert.
                // But `connect` might throw if already connected? No, prisma handles implicit m-n okay?
                // Actually, `connect` adds. If already connected it might duplicate in join table?
                // Prisma implicit many-to-many handles uniqueness usually.

                const pestConnects = [];
                for (const pestName of record.pragas) {
                    if (!pestName) continue;
                    // Upsert PestCatalog (We can optimize this by caching pests in memory!)
                    const pestId = await getPestId(pestName);
                    pestConnects.push({ id: pestId });
                }

                if (pestConnects.length > 0) {
                    updates.pests = { connect: pestConnects };
                    needsUpdate = true;
                }
            }

            if (needsUpdate) {
                return prisma.phytosanitaryData.update({
                    where: { id: record.id },
                    data: updates
                });
            }
        });

        await Promise.all(promises);

        processed += records.length;
        cursorId = records[records.length - 1].id;
        process.stdout.write(`\rProcessed: ${processed}/${total}`);
    }

    console.log('\nMigration finished.');
}

// Simple memory cache for Pest IDs to avoid thousands of DB lookups
const pestCache: Record<string, number> = {};

async function getPestId(name: string): Promise<number> {
    if (pestCache[name]) return pestCache[name];

    // Find or create
    let pest = await prisma.pestCatalog.findFirst({
        where: { common_name: name }
    });

    if (!pest) {
        pest = await prisma.pestCatalog.create({
            data: {
                common_name: name,
                type: 'Desconhecido'
            }
        });
    }

    pestCache[name] = pest.id;
    return pest.id;
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
