import { NextResponse } from 'next/server';
import { prisma } from '../../lib/prisma';
import { Prisma } from '@prisma/client';

// Constants for Temporal Logic
const INFINITY_DATE = null;

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { sync_batch } = body;

        // Expected payload: { sync_batch: [ { tree: ..., inspection: ... } ] }

        if (!Array.isArray(sync_batch)) {
            return NextResponse.json({ error: 'Invalid payload: sync_batch must be an array' }, { status: 400 });
        }

        const results = [];

        // Pre-fetch check for existing Species to avoid FK errors
        // Collect all species IDs from the batch
        const incomingSpeciesIds = new Set<number>();
        sync_batch.forEach((item: any) => {
            if (item.tree && item.tree.speciesId && !isNaN(Number(item.tree.speciesId))) {
                incomingSpeciesIds.add(Number(item.tree.speciesId));
            }
        });

        // Query DB for these IDs
        const existingSpecies = await prisma.species.findMany({
            where: { id_especie: { in: Array.from(incomingSpeciesIds) } },
            select: { id_especie: true }
        });

        const validSpeciesIds = new Set(existingSpecies.map((s: any) => s.id_especie));

        // Ensure ID 1 is considered valid (fallback) - effectively assuming it exists due to seed
        // If not, we could upsert it here, but we rely on seed for now to keep sync fast.

        await prisma.$transaction(async (tx) => {
            for (const item of sync_batch) {
                const { tree, inspection } = item;
                let treeId: number | null = null;

                // 1. Process Tree (Upsert by UUID)
                if (tree) {
                    if (!tree.uuid) {
                        console.warn("Tree sync item missing UUID", tree);
                        // Skip if missing UUID, we cannot reliably sync without it in the new model
                        continue;
                    }

                    // Validate Species ID
                    let targetSpeciesId = (!tree.speciesId || isNaN(Number(tree.speciesId))) ? 1 : Number(tree.speciesId);
                    if (!validSpeciesIds.has(targetSpeciesId)) {
                        console.warn(`Species ID ${targetSpeciesId} not found in DB, falling back to 1`);
                        targetSpeciesId = 1;
                    }

                    // Upsert: Create or Update based on UUID
                    const upsertedTree = await tx.tree.upsert({
                        where: { uuid: tree.uuid },
                        update: {
                            numero_etiqueta: tree.numero_etiqueta,
                            nome_popular: tree.nome_popular,
                            cover_photo: tree.cover_photo,
                            rua: tree.rua,
                            numero: tree.numero,
                            bairro: tree.bairro,
                            lat: tree.lat,
                            lng: tree.lng,
                            speciesId: targetSpeciesId,
                        },
                        create: {
                            uuid: tree.uuid,
                            numero_etiqueta: tree.numero_etiqueta,
                            nome_popular: tree.nome_popular,
                            cover_photo: tree.cover_photo,
                            rua: tree.rua,
                            numero: tree.numero,
                            bairro: tree.bairro,
                            lat: tree.lat,
                            lng: tree.lng,
                            speciesId: targetSpeciesId,
                        }
                    });
                    treeId = upsertedTree.id_arvore;
                }

                // Use inspection's linked tree if we didn't process a tree block but have a way to link?
                // For now, we rely on 'tree' block being present in the sync item as per Android DTO.

                if (!treeId) continue;

                // 2. Process Inspection (linked to treeId)
                if (inspection) {
                    if (inspection.uuid) {
                        const inspectionData = {
                            data_inspecao: new Date(inspection.data_inspecao || new Date()),
                            treeId: treeId, // Link to the resolved tree ID
                            dendrometrics: {
                                create: inspection.dendrometric ? [{
                                    dap1_cm: inspection.dendrometric.dap1_cm,
                                    dap2_cm: inspection.dendrometric.dap2_cm,
                                    dap3_cm: inspection.dendrometric.dap3_cm,
                                    dap4_cm: inspection.dendrometric.dap4_cm,
                                    altura_total_m: inspection.dendrometric.altura_total_m,
                                    altura_copa_m: inspection.dendrometric.altura_copa_m,
                                    valid_from: new Date(),
                                    valid_to: null
                                }] : []
                            },
                            phytosanitary: {
                                create: inspection.phytosanitary ? [{
                                    estado_saude: inspection.phytosanitary.estado_saude,
                                    pragas: inspection.phytosanitary.pragas || [],
                                    danos_tipo: inspection.phytosanitary.danos_tipo,
                                    danos_severidade: inspection.phytosanitary.danos_severidade,
                                    valid_from: new Date(),
                                    valid_to: null
                                }] : []
                            },
                            managementActions: {
                                create: inspection.management ? [{
                                    necessita_manejo: inspection.management.necessita_manejo || false,
                                    manejo_tipo: inspection.management.manejo_tipo,
                                    poda_tipos: inspection.management.poda_tipos || [],
                                    supressao_tipo: inspection.management.supressao_tipo,
                                    justification: inspection.management.justification,
                                    valid_from: new Date(),
                                    valid_to: null
                                }] : []
                            },
                            photos: {
                                create: inspection.photos ? inspection.photos.map((p: any) => ({
                                    uri: p.uri
                                })) : []
                            }
                        };

                        // Upsert Inspection by UUID
                        await tx.inspection.upsert({
                            where: { uuid: inspection.uuid },
                            update: {
                                // Idempotent update: currently we don't overwrite history on sync
                            },
                            create: {
                                uuid: inspection.uuid,
                                ...inspectionData
                            }
                        });
                    }
                }
            }
        }, {
            maxWait: 10000, // Wait max 10s for transaction to start
            timeout: 120000 // Allow 120s for transaction to complete
        });

        return NextResponse.json({
            success: true,
            processed: sync_batch.length,
            errors: []
        });

    } catch (error) {
        console.error('Sync error:', error);

        // Log to file for debugging
        try {
            const fs = require('fs');
            const path = require('path');
            const logPath = path.join(process.cwd(), 'server-error.log');
            const timestamp = new Date().toISOString();
            const errorMessage = error instanceof Error ? error.stack || error.message : JSON.stringify(error);
            fs.appendFileSync(logPath, `[${timestamp}] ${errorMessage}\n\n`);
        } catch (e) { /* ignore */ }

        return NextResponse.json({ error: 'Sync failed', details: error instanceof Error ? error.message : 'Unknown' }, { status: 500 });
    }
}
