
import * as xlsx from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';
import proj4 from 'proj4';
import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

// Define UTM Zone 22S projection (Esteio, RS) and WGS84
const utmProjection = "+proj=utm +zone=22 +south +ellps=WGS84 +datum=WGS84 +units=m +no_defs";
const wgs84Projection = "+proj=longlat +ellps=WGS84 +datum=WGS84 +no_defs";

const directoryPath = path.join(process.cwd(), 'modelo');
const BATCH_SIZE = 100; // Number of trees per batch

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
    dap: number;
    altura: number;
    rua: string | undefined;
    numero: string | undefined;
    bairro: string | undefined;
    lat: number | null;
    lng: number | null;
    estadoSaude: string;
    etiqueta: string | undefined;
}

function parseRow(row: any): ParsedRow {
    const nomeCientificoKey = getKey(row, 'nome científico') || getKey(row, 'nome cientifico');
    const nomeComumKey = getKey(row, 'nome popular');
    const familiaKey = getKey(row, 'família') || getKey(row, 'familia');
    const capKey = getKey(row, 'cap');
    const alturaKey = getKey(row, 'altura');
    const ruaKey = getKey(row, 'rua');
    const numKey = getKey(row, 'n') || getKey(row, 'nº') || getKey(row, 'numero');
    const bairroKey = getKey(row, 'bairro');
    const utmEKey = Object.keys(row).find(k => k.includes('UTM E'));
    const utmSKey = Object.keys(row).find(k => k.includes('UTM S'));
    const estadoKey = getKey(row, 'estado geral');

    const nomeCientifico = (nomeCientificoKey ? row[nomeCientificoKey] : 'Desconhecida')?.trim() || 'Desconhecida';
    const nomeComum = (nomeComumKey ? row[nomeComumKey] : 'Desconhecida')?.trim() || 'Desconhecida';
    const familia = (familiaKey ? row[familiaKey] : null)?.trim();
    const cap = capKey ? Number(row[capKey]) : 0;
    const dap = cap > 0 ? cap / Math.PI : 0;
    const altura = alturaKey ? Number(row[alturaKey]) : 0;
    const rua = ruaKey ? row[ruaKey]?.toString().trim() : undefined;
    const numero = numKey ? row[numKey]?.toString().trim() : undefined;
    const bairro = bairroKey ? row[bairroKey]?.toString().trim() : undefined;
    const utmE = utmEKey ? row[utmEKey] : undefined;
    const utmS = utmSKey ? row[utmSKey] : undefined;
    const estadoSaude = estadoKey ? row[estadoKey] : 'Regular';
    const etiqueta = row['ID'] ? String(row['ID']) : undefined;

    let lat: number | null = null;
    let lng: number | null = null;

    if (utmE && utmS) {
        try {
            const coords = proj4(utmProjection, wgs84Projection, [Number(utmE), Number(utmS)]);
            lng = coords[0];
            lat = coords[1];
        } catch (e) { /* ignore */ }
    }

    return { nomeCientifico, nomeComum, familia, dap, altura, rua, numero, bairro, lat, lng, estadoSaude, etiqueta };
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

    // 2. Process in batches
    const totalBatches = Math.ceil(parsedRows.length / BATCH_SIZE);
    let importedCount = 0;

    for (let i = 0; i < parsedRows.length; i += BATCH_SIZE) {
        const batch = parsedRows.slice(i, i + BATCH_SIZE);
        const batchNum = Math.floor(i / BATCH_SIZE) + 1;

        await prisma.$transaction(async (tx) => {
            for (const row of batch) {
                const speciesId = speciesMap.get(row.nomeCientifico) || 1;

                // Create Tree
                const tree = await tx.tree.create({
                    data: {
                        speciesId,
                        rua: row.rua,
                        numero: row.numero ? String(row.numero) : null,
                        bairro: row.bairro,
                        endereco: `${row.rua || ''}, ${row.numero || ''}, ${row.bairro || ''}`.replace(/^, /, '').replace(/, $/, ''),
                        numero_etiqueta: row.etiqueta
                    }
                });

                // Update location with PostGIS
                if (row.lat && row.lng) {
                    await tx.$executeRaw`
                        UPDATE "Tree" SET "localizacao" = ST_SetSRID(ST_MakePoint(${row.lng}, ${row.lat}), 4326) WHERE "id_arvore" = ${tree.id_arvore}
                    `;
                }

                // Create Inspection with nested data
                await tx.inspection.create({
                    data: {
                        treeId: tree.id_arvore,
                        dendrometrics: { create: { dap1_cm: row.dap, altura_total_m: row.altura, altura_copa_m: 0, valid_from: new Date() } },
                        phytosanitary: { create: { estado_saude: row.estadoSaude || 'Regular', valid_from: new Date() } }
                    }
                });
                importedCount++;
            }
        }, { timeout: 120000 }); // 2 min timeout per batch

        console.log(`  Batch ${batchNum}/${totalBatches} complete (${importedCount}/${parsedRows.length} rows).`);
    }

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`\n✅ Import complete! ${importedCount} trees imported in ${elapsed}s.`);
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });

