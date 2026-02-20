
import { PrismaClient, Prisma } from '@prisma/client';
import XLSX from 'xlsx';
import path from 'path';
import proj4 from 'proj4';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

// Define Projections
// SIRGAS 2000 / UTM zone 22S (EPSG:31982) roughly same as WGS84 for conversion purposes usually
// +south for southern hemisphere
proj4.defs("EPSG:31982", "+proj=utm +zone=22 +south +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs");

// Rewriting loop to handle non-unique etiquette safely
async function main() {
    const filePath = path.join(process.cwd(), 'modelo', 'Diagnóstico flora com coordenadas.xlsx');
    console.log(`Reading file: ${filePath}`);
    const workbook = XLSX.readFile(filePath);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const data: any[] = XLSX.utils.sheet_to_json(sheet);

    console.log(`Total rows to process: ${data.length}`);

    // Sync Sequences
    try {
        await prisma.$executeRawUnsafe(`SELECT setval(pg_get_serial_sequence('"Species"', 'id_especie'), coalesce(max(id_especie), 0) + 1, false) FROM "Species";`);
        await prisma.$executeRawUnsafe(`SELECT setval(pg_get_serial_sequence('"Tree"', 'id_arvore'), coalesce(max(id_arvore), 0) + 1, false) FROM "Tree";`);
        await prisma.$executeRawUnsafe(`SELECT setval(pg_get_serial_sequence('"Inspection"', 'id_inspecao'), coalesce(max(id_inspecao), 0) + 1, false) FROM "Inspection";`);
        console.log('Sequences synced.');
    } catch (e) {
        console.warn('Failed to sync sequences (might be first run or permissions)', e);
    }
    // Species Mapping (Same as above)
    const uniqueSpeciesNames = new Set<string>();
    data.forEach(row => { if (row['NOME CIENTÍFICO']) uniqueSpeciesNames.add(row['NOME CIENTÍFICO'].trim()); });

    console.log(`Found ${uniqueSpeciesNames.size} unique species.`);

    // Optimized Species Loading
    const existingSpecies = await prisma.species.findMany({});
    const speciesMap = new Map<string, number>();
    existingSpecies.forEach(s => speciesMap.set(s.nome_cientifico, s.id_especie));

    for (const name of uniqueSpeciesNames) {
        if (!speciesMap.has(name)) {
            const row = data.find(r => r['NOME CIENTÍFICO']?.trim() === name);
            const commonName = row['NOME POPULAR'] || 'Desconhecida';
            const s = await prisma.species.create({
                data: {
                    nome_cientifico: name,
                    nome_comum: commonName
                }
            });
            speciesMap.set(name, s.id_especie);
        }
    }

    // Process Trees in Batches (Parallelized)
    const BATCH_SIZE = 20; // Reduced from 50 to avoid pool exhaustion
    console.log(`Starting Tree Processing loop... Batch Size: ${BATCH_SIZE}`);

    let processed = 0;

    // Helper function to process a single row safely
    const processRow = async (row: any) => {
        try {
            // Parse ID / Etiqueta
            const keys = Object.keys(row);
            const idKey = keys.find(k => {
                const clean = k.trim().toUpperCase();
                return clean === 'CÓDIGO' || clean === 'CODIGO' || clean === 'ID';
            });

            const etiqueta = idKey && row[idKey] ? String(row[idKey]) : null;
            if (!etiqueta) return;

            // Parse Coords
            let latStr = '';
            let lngStr = '';
            const xKey = keys.find(k => k.trim() === 'UTM E inicial') || 'UTM E inicial';
            const yKey = keys.find(k => k.trim() === 'UTM S inicial') || 'UTM S inicial';

            if (row[xKey] && row[yKey]) {
                try {
                    const coords = proj4("EPSG:31982", "EPSG:4326", [Number(row[xKey]), Number(row[yKey])]);
                    lngStr = coords[0].toFixed(8);
                    latStr = coords[1].toFixed(8);
                } catch (e) { }
            }

            // Resolve Species
            const sciKey = keys.find(k => k.trim() === 'NOME CIENTÍFICO') || 'NOME CIENTÍFICO';
            const speciesName = row[sciKey]?.trim();
            const speciesId = speciesMap.get(speciesName) || 1;

            // Use Upsert for atomic create/update if possible, but we need dynamic logic for inspections
            // Doing findFirst + create/update is fine if concurrency is managed, but upsert is safer.
            // However, Prisma upsert requires a unique constraint on the where clause.
            // Assuming numero_etiqueta is unique or we want to find by it.
            // If unique constraint exists on numero_etiqueta:

            const treeData = {
                numero_etiqueta: etiqueta,
                speciesId,
                rua: row['Rua'] ? String(row['Rua']) : null,
                numero: row['n'] ? String(row['n']) : null,
                bairro: row['Bairro'] ? String(row['Bairro']) : null,
            };

            const lat = latStr ? parseFloat(latStr) : null;
            const lng = lngStr ? parseFloat(lngStr) : null;

            // Using transaction for the single tree operation ensures consistency
            await prisma.$transaction(async (tx) => {
                let tree = await tx.tree.findFirst({
                    where: { numero_etiqueta: etiqueta }
                });

                if (!tree) {
                    tree = await tx.tree.create({
                        data: {
                            uuid: uuidv4(),
                            ...treeData
                        }
                    });
                } else {
                    tree = await tx.tree.update({
                        where: { id_arvore: tree.id_arvore },
                        data: treeData
                    });
                }

                if (lat !== null && lng !== null) {
                    await tx.$executeRawUnsafe(
                        `UPDATE "Tree" SET localizacao = ST_SetSRID(ST_MakePoint($1, $2), 4326) WHERE id_arvore = $3`,
                        lng, lat, tree.id_arvore
                    );
                }

                // Check existing inspections
                const existingInspection = await tx.inspection.findFirst({
                    where: { treeId: tree.id_arvore }
                });

                if (existingInspection) return; // Skip if already imported

                // Prepare Inspection Data
                const dateKey = keys.find(k => k.trim() === 'Data');
                let dataInspecao = new Date();
                if (dateKey && row[dateKey]) {
                    const dVal = row[dateKey];
                    if (typeof dVal === 'number') {
                        dataInspecao = new Date(Math.round((dVal - 25569) * 86400 * 1000));
                    } else if (typeof dVal === 'string') {
                        const parsed = new Date(dVal);
                        if (!isNaN(parsed.getTime())) dataInspecao = parsed;
                    }
                }

                const dap1 = row['DAP1'];
                const dap2 = row['DAP2'];
                const dap3 = row['DAP3'];
                const h = row['H (m)'];

                const saudeRaw = row['Estado fitossanitário']?.toLowerCase() || '';
                let saude = 'Regular';
                if (saudeRaw.includes('bom') || saudeRaw.includes('boa')) saude = 'Bom';
                else if (saudeRaw.includes('ruim') || saudeRaw.includes('péssimo')) saude = 'Ruim';
                else if (saudeRaw.includes('mort') || saudeRaw.includes('desv')) saude = 'Desvitalizada';

                const pragas = row['Tipo de praga'] && row['Tipo de praga'] !== 'não' ? [row['Tipo de praga']] : [];
                const manejoRaw = row['Tipo de manejo'];
                const necessitaManejo = !!manejoRaw && String(manejoRaw).toLowerCase() !== 'não';

                let manejoTipo = null;
                let supressaoTipo = null;
                let podaTipos: string[] = [];
                let justification = row['Obs'] ? String(row['Obs']) : null;

                if (necessitaManejo) {
                    const mLower = String(manejoRaw).toLowerCase();
                    if (mLower.includes('supress') || mLower.includes('remo') || mLower.includes('substitui')) {
                        manejoTipo = 'Supressão';
                        if (mLower.includes('remo')) supressaoTipo = 'Remoção';
                        else if (mLower.includes('substitui')) supressaoTipo = 'Substituição';
                        else supressaoTipo = 'Supressão';
                    } else {
                        manejoTipo = 'Poda';
                        podaTipos.push(manejoRaw);
                    }
                }

                const safeDecimal = (val: any) => {
                    if (val === null || val === undefined || val === '') return null;
                    const num = Number(val);
                    if (isNaN(num)) return null;
                    return new Prisma.Decimal(num);
                };

                const safeDecimalZero = (val: any) => {
                    if (val === null || val === undefined || val === '') return new Prisma.Decimal(0);
                    const num = Number(val);
                    if (isNaN(num)) return new Prisma.Decimal(0);
                    return new Prisma.Decimal(num);
                }

                await tx.inspection.create({
                    data: {
                        uuid: uuidv4(),
                        data_inspecao: dataInspecao,
                        treeId: tree.id_arvore,
                        dendrometrics: {
                            create: [{
                                dap1_cm: safeDecimal(dap1),
                                dap2_cm: safeDecimal(dap2),
                                dap3_cm: safeDecimal(dap3),
                                altura_total_m: safeDecimalZero(h),
                                altura_copa_m: new Prisma.Decimal(0),
                                valid_from: dataInspecao
                            }]
                        },
                        phytosanitary: {
                            create: [{
                                severity_level: saude === 'Bom' ? 0 : 2,
                                estado_saude: saude, // Don't forget this one!
                                pests: {
                                    connectOrCreate: pragas.map(p => ({
                                        where: { nome_comum: p },
                                        create: { nome_comum: p, tipo: 'Praga' }
                                    }))
                                },
                                valid_from: dataInspecao
                            }]
                        },
                        managementActions: {
                            create: [{
                                necessita_manejo: necessitaManejo,
                                manejo_tipo: manejoTipo,
                                supressao_tipo: supressaoTipo,
                                poda_tipos: podaTipos,
                                justification: justification,
                                valid_from: dataInspecao
                            }]
                        }
                    }
                });
            }, {
                maxWait: 5000, // Wait for connection
                timeout: 10000 // Transaction execution time
            });
        } catch (e) {
            console.error(`Error processing row:`, e);
            // Don't crash the whole batch, just log
        }
    };

    // Parallel Batch Execution
    for (let i = 0; i < data.length; i += BATCH_SIZE) {
        const batch = data.slice(i, i + BATCH_SIZE);

        // Run BATCH_SIZE promises in parallel
        await Promise.all(batch.map(row => processRow(row)));

        processed += batch.length;
        if (processed % 100 === 0) console.log(`Processed ${processed} / ${data.length}`);
    }
    console.log('Import Complete');
}


main()
    .then(async () => { await prisma.$disconnect() })
    .catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1); })
