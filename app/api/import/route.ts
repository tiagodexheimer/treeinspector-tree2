import { NextResponse } from 'next/server';
import * as xlsx from 'xlsx';
import proj4 from 'proj4';
import { prisma } from '../../lib/prisma';

// Increase timeout for large imports (5 minutes max on Vercel free tier)
export const maxDuration = 300;

// Batch size for processing
const BATCH_SIZE = 100;

// Define UTM Zone 22S projection (Esteio, RS) and WGS84
const utmProjection = "+proj=utm +zone=22 +south +ellps=WGS84 +datum=WGS84 +units=m +no_defs";
const wgs84Projection = "+proj=longlat +ellps=WGS84 +datum=WGS84 +no_defs";

const getKey = (row: any, keyName: string) => Object.keys(row).find(k => k.trim().toLowerCase() === keyName.toLowerCase());

// Parse pest names (using the improved function from import script)
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
    if (!normalized.includes(' e ') && !normalized.includes('/') && !normalized.includes(',')) {
        // Single pest - check if it matches exactly
        const mapped = pestMapping[normalized];
        if (mapped) {
            return [mapped];
        }
    }

    // Separar por delimitadores: " e ", "/", ","
    const parts = normalized
        .split(/\s+e\s+|\s*\/\s*|,\s*/)
        .map(p => p.trim())
        .filter(p => p.length > 0);

    const validPests = new Set<string>();

    for (const part of parts) {
        // Ignorar partes muito curtas
        if (part.length < 3) {
            continue;
        }

        // Ignorar se contém termos inválidos
        const containsInvalid = invalidTerms.some(term =>
            part.includes(term) || part === term
        );
        if (containsInvalid) {
            continue;
        }

        // Ignorar descrições muito longas (provavelmente observações, não pragas)
        if (part.length > 30) {
            continue;
        }

        // Tentar mapear para nome padrão
        const mapped = pestMapping[part];
        if (mapped) {
            validPests.add(mapped);
        }
    }

    const result = Array.from(validPests);
    return result;
}

export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
        }

        // Read Excel file
        const buffer = Buffer.from(await file.arrayBuffer());
        const workbook = xlsx.read(buffer);
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const data: any[] = xlsx.utils.sheet_to_json(sheet);

        if (data.length === 0) {
            return NextResponse.json({ error: 'No data found in file' }, { status: 400 });
        }

        // Create a streaming response
        const encoder = new TextEncoder();
        const stream = new ReadableStream({
            async start(controller) {
                // Helper to send progress update
                const sendProgress = (progress: any) => {
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify(progress)}\n\n`));
                };

                try {
                    // Parse and import data in batches
                    let imported = 0;
                    const errors: string[] = [];
                    const totalRows = data.length;

                    // Prepare species map
                    const speciesMap = new Map<string, number>();

                    // Send initial progress
                    sendProgress({
                        type: 'start',
                        total: totalRows,
                        message: `Iniciando importação de ${totalRows} árvores...`
                    });

                    // Process in batches
                    for (let batchStart = 0; batchStart < totalRows; batchStart += BATCH_SIZE) {
                        const batchEnd = Math.min(batchStart + BATCH_SIZE, totalRows);
                        const batch = data.slice(batchStart, batchEnd);
                        const batchNumber = Math.floor(batchStart / BATCH_SIZE) + 1;
                        const totalBatches = Math.ceil(totalRows / BATCH_SIZE);

                        for (const row of batch) {
                            try {
                                // Extract fields
                                const nomeCientificoKey = getKey(row, 'nome científico') || getKey(row, 'nome cientifico');
                                const nomeComumKey = getKey(row, 'nome popular');
                                const familiaKey = getKey(row, 'família') || getKey(row, 'familia');

                                const nomeCientifico = (nomeCientificoKey ? row[nomeCientificoKey] : 'Desconhecida')?.trim() || 'Desconhecida';
                                const nomeComum = (nomeComumKey ? row[nomeComumKey] : 'Desconhecida')?.trim() || 'Desconhecida';
                                const familia = (familiaKey ? row[familiaKey] : null)?.trim();

                                // Get or create species
                                let speciesId = speciesMap.get(nomeCientifico);
                                if (!speciesId) {
                                    const species = await prisma.species.upsert({
                                        where: { nome_cientifico: nomeCientifico },
                                        update: { family: familia },
                                        create: { nome_cientifico: nomeCientifico, nome_comum: nomeComum, family: familia }
                                    });
                                    speciesId = species.id_especie;
                                    speciesMap.set(nomeCientifico, speciesId);
                                }

                                // Dendrometric data
                                const dap1Key = getKey(row, 'dap1') || getKey(row, 'dap 1') || getKey(row, 'dap');
                                const dap1 = dap1Key ? Number(row[dap1Key]) : 0;
                                const alturaKey = getKey(row, 'altura') || getKey(row, 'H (m)') || getKey(row, 'h');
                                const altura = alturaKey ? Number(row[alturaKey]) : 0;

                                // Address
                                const ruaKey = getKey(row, 'rua');
                                const numKey = getKey(row, 'n') || getKey(row, 'nº') || getKey(row, 'numero');
                                const bairroKey = getKey(row, 'bairro');
                                const rua = ruaKey ? row[ruaKey]?.toString().trim() : undefined;
                                const numero = numKey ? row[numKey]?.toString().trim() : undefined;
                                const bairro = bairroKey ? row[bairroKey]?.toString().trim() : undefined;

                                // Coordinates
                                const utmEKey = Object.keys(row).find(k => k.includes('UTM E'));
                                const utmSKey = Object.keys(row).find(k => k.includes('UTM S'));
                                const utmE = utmEKey ? row[utmEKey] : undefined;
                                const utmS = utmSKey ? row[utmSKey] : undefined;

                                let lat: number | null = null;
                                let lng: number | null = null;

                                if (utmE && utmS) {
                                    try {
                                        const coords = proj4(utmProjection, wgs84Projection, [Number(utmE), Number(utmS)]);
                                        lng = coords[0];
                                        lat = coords[1];
                                    } catch (e) { /* ignore */ }
                                }

                                // Health status
                                const estadoKey = getKey(row, 'estado fitossanitário') || getKey(row, 'estado fitossanitario') || getKey(row, 'estado geral');
                                const estadoSaude = estadoKey ? row[estadoKey] : 'Regular';

                                // Pests
                                const pragaKey = getKey(row, 'tipo de praga');
                                const pragaRawValue = pragaKey ? row[pragaKey] : null;
                                const pragas = parsePests(pragaRawValue);

                                // Management
                                const manejoKey = getKey(row, 'tipo de manejo');
                                const manejoTipo = manejoKey ? row[manejoKey] : null;
                                const necessitaManejo = !!manejoTipo && manejoTipo.toLowerCase() !== 'não' && manejoTipo.toLowerCase() !== 'nenhum';

                                // Create tree
                                const tree = await prisma.tree.create({
                                    data: {
                                        speciesId,
                                        rua,
                                        numero: numero ? String(numero) : null,
                                        bairro,
                                        endereco: `${rua || ''}, ${numero || ''}, ${bairro || ''}`.replace(/^, /, '').replace(/, $/, ''),
                                        numero_etiqueta: row['Código'] ? String(row['Código']) : (row['ID'] ? String(row['ID']) : undefined)
                                    }
                                });

                                // Update location with PostGIS
                                if (lat && lng) {
                                    await prisma.$executeRaw`
                                        UPDATE "Tree" SET "localizacao" = ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326) WHERE "id_arvore" = ${tree.id_arvore}
                                    `;
                                }

                                // Create inspection with nested data
                                await prisma.inspection.create({
                                    data: {
                                        treeId: tree.id_arvore,
                                        dendrometrics: {
                                            create: {
                                                dap1_cm: dap1,
                                                altura_total_m: altura,
                                                altura_copa_m: 0,
                                                valid_from: new Date()
                                            }
                                        },
                                        phytosanitary: {
                                            create: {
                                                estado_saude: estadoSaude || 'Regular',
                                                severity_level: estadoSaude?.includes('Bom') ? 0 : 2,
                                                pests: {
                                                    connectOrCreate: pragas.map(p => ({
                                                        where: { nome_comum: p },
                                                        create: { nome_comum: p, tipo: 'Praga' }
                                                    }))
                                                },
                                                valid_from: new Date()
                                            }
                                        },
                                        managementActions: {
                                            create: {
                                                necessita_manejo: necessitaManejo,
                                                manejo_tipo: manejoTipo,
                                                valid_from: new Date()
                                            }
                                        }
                                    }
                                });

                                imported++;

                            } catch (error: any) {
                                console.error('Error importing row:', error);
                                errors.push(`Row ${batchStart + batch.indexOf(row) + 1}: ${error.message}`);
                            }
                        }

                        // Send progress after each batch
                        const progress = Math.floor((batchEnd / totalRows) * 100);
                        sendProgress({
                            type: 'progress',
                            batch: batchNumber,
                            totalBatches,
                            imported,
                            total: totalRows,
                            progress,
                            errors: errors.length,
                            message: `Lote ${batchNumber}/${totalBatches} processado - ${imported} árvores importadas`
                        });
                    }

                    // Send completion
                    sendProgress({
                        type: 'complete',
                        imported,
                        total: totalRows,
                        errors: errors.slice(0, 10),
                        message: `Importação concluída! ${imported} de ${totalRows} árvores importadas.`
                    });

                } catch (error: any) {
                    console.error('Import error:', error);
                    sendProgress({
                        type: 'error',
                        message: error.message || 'Erro ao processar arquivo'
                    });
                } finally {
                    controller.close();
                }
            }
        });

        return new Response(stream, {
            headers: {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
            },
        });

    } catch (error: any) {
        console.error('Import error:', error);
        return NextResponse.json({ error: error.message || 'Failed to process file' }, { status: 500 });
    }
}
