
import * as xlsx from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import proj4 from 'proj4';
import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

// Define UTM Zone 22S projection (Esteio, RS) and WGS84
const utmProjection = "+proj=utm +zone=22 +south +ellps=WGS84 +datum=WGS84 +units=m +no_defs";
const wgs84Projection = "+proj=longlat +ellps=WGS84 +datum=WGS84 +no_defs";

const directoryPath = path.join(process.cwd(), 'modelo');
const BATCH_SIZE = 100; // Process 100 trees per transaction for speed

function getFirstFile() {
    try {
        const files = fs.readdirSync(directoryPath);
        return files.find(file => file.endsWith('.xlsx')) || null;
    } catch (e) {
        console.error("Could not read directory:", e);
        return null;
    }
}

// Helper to get case-insensitive/trimmed key
const getKey = (row: any, keyName: string) => Object.keys(row).find(k => k.trim().toLowerCase() === keyName.toLowerCase());

interface ParsedRow {
    nomeCientifico: string;
    nomeComum: string;
    familia: string | null;
    dap1: number;
    dap2: number;
    dap3: number;
    dap4: number;
    altura: number;
    rua: string | undefined;
    numero: string | undefined;
    bairro: string | undefined;
    lat: number | null;
    lng: number | null;
    estadoSaude: string;
    etiqueta: string | undefined;
    necessitaManejo: boolean;
    manejoTipo: string | null;
    pragas: string[];
    dataVistoria: Date;
}

function parseRow(row: any): ParsedRow {
    const nomeCientificoKey = getKey(row, 'nome científico') || getKey(row, 'nome cientifico');
    const nomeComumKey = getKey(row, 'nome popular');
    const familiaKey = getKey(row, 'família') || getKey(row, 'familia');

    // DAP Keys
    const dap1Key = getKey(row, 'dap1') || getKey(row, 'dap 1') || getKey(row, 'dap');
    const dap2Key = getKey(row, 'dap2') || getKey(row, 'dap 2');
    const dap3Key = getKey(row, 'dap3') || getKey(row, 'dap 3');
    const dap4Key = getKey(row, 'dap4') || getKey(row, 'dap 4');

    // Fallback if only CAP exists
    const capKey = getKey(row, 'cap');

    const alturaKey = getKey(row, 'altura') || getKey(row, 'H (m)') || getKey(row, 'h');
    const ruaKey = getKey(row, 'rua');
    const numKey = getKey(row, 'n') || getKey(row, 'nº') || getKey(row, 'numero');
    const bairroKey = getKey(row, 'bairro');
    const utmEKey = Object.keys(row).find(k => k.includes('UTM E'));
    const utmSKey = Object.keys(row).find(k => k.includes('UTM S'));
    const estadoKey = getKey(row, 'estado fitossanitário') || getKey(row, 'estado fitossanitario') || getKey(row, 'estado geral');
    const manejoKey = getKey(row, 'tipo de manejo');
    const pragaKey = getKey(row, 'tipo de praga');
    const dataKey = getKey(row, 'data') || getKey(row, 'data da vistoria') || getKey(row, 'vistoria');

    const nomeCientifico = (nomeCientificoKey ? row[nomeCientificoKey] : 'Desconhecida')?.trim() || 'Desconhecida';
    const nomeComum = (nomeComumKey ? row[nomeComumKey] : 'Desconhecida')?.trim() || 'Desconhecida';
    const familia = (familiaKey ? row[familiaKey] : null)?.trim();

    let dap1 = dap1Key ? Number(row[dap1Key]) : 0;
    const dap2 = dap2Key ? Number(row[dap2Key]) : 0;
    const dap3 = dap3Key ? Number(row[dap3Key]) : 0;
    const dap4 = dap4Key ? Number(row[dap4Key]) : 0;

    // If no DAP1 but CAP exists, calculate it
    if (dap1 === 0 && capKey) {
        const cap = Number(row[capKey]);
        if (cap > 0) {
            dap1 = cap / Math.PI;
        }
    }

    const altura = alturaKey ? Number(row[alturaKey]) : 0;
    const rua = ruaKey ? row[ruaKey]?.toString().trim() : undefined;
    const numero = numKey ? row[numKey]?.toString().trim() : undefined;
    const bairro = bairroKey ? row[bairroKey]?.toString().trim() : undefined;
    const utmE = utmEKey ? row[utmEKey] : undefined;
    const utmS = utmSKey ? row[utmSKey] : undefined;
    const estadoSaude = estadoKey ? row[estadoKey] : 'Regular';
    const etiqueta = row['Código'] ? String(row['Código']) : (row['ID'] ? String(row['ID']) : undefined);

    // Date parsing
    let dataVistoria = new Date();
    if (dataKey) {
        const rawDate = row[dataKey];
        if (typeof rawDate === 'number') {
            // Excel serial date
            dataVistoria = new Date((rawDate - 25569) * 86400 * 1000);
        } else if (rawDate) {
            const parsed = new Date(rawDate);
            if (!isNaN(parsed.getTime())) dataVistoria = parsed;
        }
    }

    // Management inference
    const manejoTipo = manejoKey ? row[manejoKey] : null;
    const necessitaManejo = !!manejoTipo && manejoTipo.toLowerCase() !== 'não' && manejoTipo.toLowerCase() !== 'nenhum';
    const pragas = parsePests(pragaKey ? row[pragaKey] : null);

    let lat: number | null = null;
    let lng: number | null = null;

    if (utmE && utmS) {
        try {
            const coords = proj4(utmProjection, wgs84Projection, [Number(utmE), Number(utmS)]);
            lng = coords[0];
            lat = coords[1];
        } catch (e) { /* ignore */ }
    }

    return { nomeCientifico, nomeComum, familia, dap1, dap2, dap3, dap4, altura, rua, numero, bairro, lat, lng, estadoSaude, etiqueta, necessitaManejo, manejoTipo, pragas, dataVistoria };
}

/**
 * Parse pest data from raw text, handling multiple pests separated by "e", "/", or ","
 * Normalizes pest names and filters out invalid entries
 */
// Parse pest names (using the improved logic)
function parsePests(rawText: string | null | undefined): string[] {
    if (!rawText || typeof rawText !== 'string') return [];

    // Normalize: lowercase, trim, remove extra spaces
    const normalized = rawText.trim().toLowerCase().replace(/\s+/g, ' ');

    const pestMapping: Record<string, string> = {
        'erva-de-passarinho': 'Erva-de-passarinho',
        'erva de passarinho': 'Erva-de-passarinho',
        'erva passarinho': 'Erva-de-passarinho',
        'formigas': 'Formigas',
        'formiga': 'Formigas',
        'fungo': 'Fungo',
        'fungos': 'Fungo',
        'cupim': 'Cupim',
        'cupinzeiro': 'Cupim',
        'broca': 'Broca',
        'mata-pau': 'Mata-pau',
        'mata pau': 'Mata-pau',
        'schefflera': 'Schefflera',
        'ficus': 'Ficus',
        'pulgão': 'Pulgão',
        'pulgao': 'Pulgão',
        'insetos': 'Insetos',
        'inseto': 'Insetos',
        'berruga foliar': 'Berruga foliar'
    };

    const invalidTerms = [
        'não', 'nao', 'nenhum', 'nenhuma', 'sem',
        'tronco oco', 'oco', 'árvore', 'arvore', 'rebrotando',
        'por toda', 'presença de', 'folhas queimadas', 'queimadas',
        'cortes causados', 'amarração', 'arranhões', 'fio',
        'na base', 'base'
    ];

    // Check if it's a single pest first (no delimiters)
    // Important: check this BEFORE splitting to handle "erva-de-passarinho" correctly
    if (!normalized.includes(' e ') && !normalized.includes('/') && !normalized.includes(',')) {
        const mapped = pestMapping[normalized];
        if (mapped) return [mapped];
    }

    // Separar por delimitadores: " e ", "/", ","
    const parts = normalized
        .split(/\s+e\s+|\s*\/\s*|,\s*/)
        .map(p => p.trim())
        .filter(p => p.length > 0);

    const validPests = new Set<string>();

    for (const part of parts) {
        if (part.length < 3) continue;

        const containsInvalid = invalidTerms.some(term =>
            part.includes(term) || part === term
        );
        if (containsInvalid) continue;

        if (part.length > 30) continue;

        const mapped = pestMapping[part];
        if (mapped) {
            validPests.add(mapped);
        }
    }

    return Array.from(validPests);
}

async function main() {
    const filename = getFirstFile();
    if (!filename) {
        console.log("No .xlsx file found.");
        return;
    }
    console.log(`Importing from: ${filename}`);
    const startTime = Date.now();

    const workbook = xlsx.readFile(path.join(directoryPath, filename));
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const data: any[] = xlsx.utils.sheet_to_json(sheet);

    if (data.length === 0) {
        console.log("No data found in file.");
        return;
    }

    console.log(`Found ${data.length} rows. Parsing...`);
    const parsedRows = data.map(parseRow);

    // 1. Pre-process Species: bulk upsert
    console.log("Pre-processing species...");
    const speciesMap = new Map<string, number>();
    const uniqueSpecies = [...new Map(parsedRows.map(r => [r.nomeCientifico, r])).values()];

    for (const sp of uniqueSpecies) {
        const species = await prisma.species.upsert({
            where: { nome_cientifico: sp.nomeCientifico },
            update: { family: sp.familia },
            create: { nome_cientifico: sp.nomeCientifico, nome_comum: sp.nomeComum, family: sp.familia }
        });
        speciesMap.set(sp.nomeCientifico, species.id_especie);
    }
    console.log(`  Cached ${speciesMap.size} species.`);

    // 2. Pre-process Pests: bulk upsert
    console.log("Pre-processing pests...");
    const pestMap = new Map<string, number>();
    // Collect all unique pest names from all rows (flat array)
    const uniquePests = new Set<string>();
    parsedRows.forEach(row => row.pragas.forEach((p: string) => uniquePests.add(p)));

    for (const pestName of uniquePests) {
        const pest = await prisma.pestCatalog.upsert({
            where: { nome_comum: pestName },
            update: {},
            create: { nome_comum: pestName, tipo: 'Praga' }
        });
        pestMap.set(pestName, pest.id); // Use 'id' from schema
    }
    console.log(`  Cached ${pestMap.size} pest types.`);

    // Resolve default species ID once (from seed or mapping)
    const defaultSpeciesInstance = await prisma.species.findUnique({ where: { nome_cientifico: 'Unknown' } });
    const defaultSpeciesId = speciesMap.get('Unknown') || defaultSpeciesInstance?.id_especie || 1;

    // 3. Process in batches with LAYERED BULK INSERT
    const totalBatches = Math.ceil(parsedRows.length / BATCH_SIZE);
    let importedCount = 0;

    for (let i = 0; i < parsedRows.length; i += BATCH_SIZE) {
        const batch = parsedRows.slice(i, i + BATCH_SIZE);
        const batchNum = Math.floor(i / BATCH_SIZE) + 1;

        try {
            await prisma.$transaction(async (tx) => {
                // --- LAYER 1: TREES ---
                const treeData = batch.map(row => {
                    const speciesId = speciesMap.get(row.nomeCientifico) || defaultSpeciesId;
                    return {
                        uuid: crypto.randomUUID(), // Temp UUID for mapping
                        speciesId,
                        rua: row.rua,
                        numero: row.numero ? String(row.numero) : null,
                        bairro: row.bairro,
                        endereco: `${row.rua || ''}, ${row.numero || ''}, ${row.bairro || ''}`.replace(/^, /, '').replace(/, $/, ''),
                        numero_etiqueta: row.etiqueta
                    };
                });

                await tx.tree.createMany({ data: treeData });

                // Fetch back Trees to get IDs
                const createdTrees = await tx.tree.findMany({
                    where: { uuid: { in: treeData.map(t => t.uuid) } },
                    select: { id_arvore: true, uuid: true }
                });

                const treeIdMap = new Map<string, number>();
                createdTrees.forEach(t => {
                    if (t.uuid) treeIdMap.set(t.uuid, t.id_arvore);
                });

                // --- LAYER 2: LOCATIONS (PostGIS) ---
                // Prepare values for bulk update
                const locationValues = batch
                    .map((row, idx) => {
                        const uuid = treeData[idx].uuid;
                        const id = treeIdMap.get(uuid);
                        if (id && row.lat && row.lng) {
                            return `(${id}, ${row.lat}, ${row.lng})`;
                        }
                        return null;
                    })
                    .filter(val => val !== null);

                if (locationValues.length > 0) {
                    await tx.$executeRawUnsafe(`
                        UPDATE "Tree" SET "localizacao" = ST_SetSRID(ST_MakePoint(v.lng, v.lat), 4326)
                        FROM (VALUES ${locationValues.join(',')}) AS v(id, lat, lng)
                        WHERE "Tree"."id_arvore" = v.id
                    `);
                }

                // --- LAYER 3: INSPECTIONS ---
                const inspectionData = batch.map((row, idx) => {
                    const treeUuid = treeData[idx].uuid;
                    const treeId = treeIdMap.get(treeUuid);
                    if (!treeId) throw new Error(`Tree ID not found for UUID ${treeUuid}`);

                    return {
                        uuid: crypto.randomUUID(),
                        treeId: treeId,
                        data_inspecao: row.dataVistoria
                    };
                });

                await tx.inspection.createMany({ data: inspectionData });

                const createdInspections = await tx.inspection.findMany({
                    where: { uuid: { in: inspectionData.map(i => i.uuid) } },
                    select: { id_inspecao: true, uuid: true }
                });

                const inspIdMap = new Map<string, number>();
                createdInspections.forEach(i => {
                    if (i.uuid) inspIdMap.set(i.uuid, i.id_inspecao);
                });

                // --- LAYER 4: DETAILS (Dendro, Phyto, Management) ---
                const dendroData: any[] = [];
                const phytoData: any[] = [];
                const mgmtData: any[] = [];
                const phytoUuidToPestsMap = new Map<string, number[]>(); // Map Phyto UUID -> Pest IDs

                batch.forEach((row, idx) => {
                    const inspUuid = inspectionData[idx].uuid;
                    const inspId = inspIdMap.get(inspUuid);
                    if (!inspId) return;

                    // Dendro
                    dendroData.push({
                        inspectionId: inspId,
                        dap1_cm: row.dap1,
                        dap2_cm: row.dap2 > 0 ? row.dap2 : undefined,
                        dap3_cm: row.dap3 > 0 ? row.dap3 : undefined,
                        dap4_cm: row.dap4 > 0 ? row.dap4 : undefined,
                        altura_total_m: row.altura,
                        altura_copa_m: 0,
                        valid_from: row.dataVistoria
                    });

                    // Management
                    let supressao_tipo = undefined;
                    if (row.manejoTipo) {
                        const m = row.manejoTipo.toLowerCase();
                        if (m.includes('remo') || m.includes('subst')) supressao_tipo = row.manejoTipo;
                    }

                    mgmtData.push({
                        inspectionId: inspId,
                        necessita_manejo: row.necessitaManejo,
                        manejo_tipo: row.manejoTipo,
                        supressao_tipo: supressao_tipo,
                        valid_from: row.dataVistoria
                    });

                    // Phyto (NEED UUID TO LINK PESTS LATER)
                    const phytoUuid = crypto.randomUUID(); // We can't use createMany because we need IDs back for Pests? 
                    // Actually we can use createMany, but we need to fetch them back.
                    // We can use inspectionId as the key to fetch them back if 1:1.

                    phytoData.push({
                        inspectionId: inspId,
                        estado_saude: row.estadoSaude || 'Regular',
                        severity_level: row.estadoSaude?.includes('Bom') ? 0 : 2,
                        valid_from: row.dataVistoria
                    });

                    // Prepare pests
                    const pestIds = row.pragas
                        .map((p: string) => pestMap.get(p))
                        .filter((id: number | undefined) => id !== undefined) as number[];

                    if (pestIds.length > 0) {
                        // Store relation: InspectionID -> PestIDs. 
                        // After inserting Phyto, will fetch Phyto IDs by InspectionID and insert relations.
                        // We use a Map<InspectionID, PestIDs>
                        // But wait, allow me to just use an array since inspectionIds are unique here
                    }
                });

                await tx.dendrometricData.createMany({ data: dendroData });
                await tx.managementAction.createMany({ data: mgmtData });
                await tx.phytosanitaryData.createMany({ data: phytoData });

                // --- LAYER 5: PEST RELATIONS ---
                // We need Phyto IDs to link pests.
                // Fetch created PhytosanitaryData by inspectionIds
                const createdPhyto = await tx.phytosanitaryData.findMany({
                    where: { inspectionId: { in: Array.from(inspIdMap.values()) } },
                    select: { id: true, inspectionId: true }
                });

                const pestRelations: string[] = [];

                // Build relation VALUES
                const inspIdToPhytoId = new Map<number, number>();
                createdPhyto.forEach(p => inspIdToPhytoId.set(p.inspectionId, p.id));

                batch.forEach((row, idx) => {
                    const inspUuid = inspectionData[idx].uuid;
                    const inspId = inspIdMap.get(inspUuid);
                    if (!inspId) return;

                    const phytoId = inspIdToPhytoId.get(inspId);
                    if (!phytoId) return;

                    const pestIds = row.pragas
                        .map((p: string) => pestMap.get(p))
                        .filter((id: number | undefined) => id !== undefined) as number[];

                    pestIds.forEach(pestId => {
                        // Prisma implicit m-n table: "_PestCatalogToPhytosanitaryData" ("A", "B") where A = PestCatalog, B = Phyto
                        pestRelations.push(`(${pestId}, ${phytoId})`);
                    });
                });

                if (pestRelations.length > 0) {
                    await tx.$executeRawUnsafe(`
                        INSERT INTO "_PestCatalogToPhytosanitaryData" ("A", "B")
                        VALUES ${pestRelations.join(',')}
                        ON CONFLICT DO NOTHING
                    `);
                }

                importedCount += batch.length;

            }, { timeout: 600000 }); // 10 min timeout

            console.log(`  Batch ${batchNum}/${totalBatches} complete (${importedCount}/${parsedRows.length} rows).`);

        } catch (error) {
            console.error(`Error in batch ${batchNum}:`, error);
        }
    }

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`\n✅ Import complete! ${importedCount} trees imported in ${elapsed}s.`);
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });

