
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
const BATCH_SIZE = 5; // Very small batch to be safe

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

    // Management inference
    const manejoTipo = manejoKey ? row[manejoKey] : null;
    const necessitaManejo = !!manejoTipo && manejoTipo.toLowerCase() !== 'não' && manejoTipo.toLowerCase() !== 'nenhum';
    const pragas = pragaKey && row[pragaKey] ? [row[pragaKey]] : [];

    let lat: number | null = null;
    let lng: number | null = null;

    if (utmE && utmS) {
        try {
            const coords = proj4(utmProjection, wgs84Projection, [Number(utmE), Number(utmS)]);
            lng = coords[0];
            lat = coords[1];
        } catch (e) { /* ignore */ }
    }

    return { nomeCientifico, nomeComum, familia, dap1, dap2, dap3, dap4, altura, rua, numero, bairro, lat, lng, estadoSaude, etiqueta, necessitaManejo, manejoTipo, pragas };
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

                // Detect suppression info for better semantics
                let supressao_tipo = undefined;
                if (row.manejoTipo) {
                    const m = row.manejoTipo.toLowerCase();
                    if (m.includes('remo') || m.includes('subst')) {
                        supressao_tipo = row.manejoTipo;
                    }
                }

                // Create Inspection with nested data
                await tx.inspection.create({
                    data: {
                        treeId: tree.id_arvore,
                        dendrometrics: {
                            create: {
                                dap1_cm: row.dap1,
                                dap2_cm: row.dap2 > 0 ? row.dap2 : undefined,
                                dap3_cm: row.dap3 > 0 ? row.dap3 : undefined,
                                dap4_cm: row.dap4 > 0 ? row.dap4 : undefined,
                                altura_total_m: row.altura,
                                altura_copa_m: 0,
                                valid_from: new Date()
                            }
                        },
                        phytosanitary: {
                            create: {
                                estado_saude: row.estadoSaude || 'Regular',
                                severity_level: row.estadoSaude?.includes('Bom') ? 0 : 2, // Basic default
                                pests: {
                                    connectOrCreate: row.pragas.map(p => ({
                                        where: { nome_comum: p },
                                        create: { nome_comum: p, tipo: 'Praga' }
                                    }))
                                },
                                valid_from: new Date()
                            }
                        },
                        managementActions: {
                            create: {
                                necessita_manejo: row.necessitaManejo,
                                manejo_tipo: row.manejoTipo,
                                supressao_tipo: supressao_tipo,
                                valid_from: new Date()
                            }
                        }
                    }
                });
                importedCount++;
            }
        }, { timeout: 600000 }); // 10 min timeout per batch

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

