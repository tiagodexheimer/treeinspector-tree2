import { NextResponse } from 'next/server';
import { prisma } from '../../lib/prisma';
import { Prisma } from '@prisma/client';

// Constants for Temporal Logic
const INFINITY_DATE = null; // Prisma uses null for "undefined" end date in this schema context? 
// Schema says valid_to DateTime? so null is correct for "current".

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { sync_batch } = body;

        // Expected payload structure:
        // sync_batch: [
        //   {
        //      mobile_id: string, // UUID from mobile for idempotency
        //      tree: { ... }, // Optional if updating existing tree
        //      inspection: {
        //          data_inspecao: string,
        //          dendrometric: { ... },
        //          phytosanitary: { ... },
        //          management: { ... },
        //          photos: [ ... ]
        //      }
        //   }
        // ]

        if (!Array.isArray(sync_batch)) {
            return NextResponse.json({ error: 'Invalid payload: sync_batch must be an array' }, { status: 400 });
        }

        const results = [];

        // Transactional processing to ensure integrity
        // We process each item. For a real bulk sync, specific transaction isolation might be needed,
        // but $transaction per item or global depends on volume. Let's do per-item for now to allow partial successes or global?
        // Let's do a global transaction for the whole batch to ensure "all or nothing" sync or robust error handling.
        // Actually, for sync, if one fails, we might want others to succeed, but usually batches are atomic.

        // However, Prisma $transaction doesn't support complex logic easily inside without interactive transactions (preview feature depending on version).
        // Standard interactive transaction:

        await prisma.$transaction(async (tx) => {
            for (const item of sync_batch) {
                const { tree, inspection } = item;

                let treeId = tree?.id_arvore; // If syncing updates to existing tree

                // 1. Upsert Tree
                if (tree) {
                    // If we have an ID, update. If not (or if it's a mobile temp ID), create.
                    // Ideally mobile sends 'numero_etiqueta' or 'id_arvore' if known.
                    // For now, let's assume if id_arvore is present, it's known.

                    if (treeId) {
                        await tx.tree.update({
                            where: { id_arvore: treeId },
                            data: {
                                numero_etiqueta: tree.numero_etiqueta,
                                rua: tree.rua,
                                numero: tree.numero,
                                bairro: tree.bairro,
                                endereco: tree.endereco,
                                lat: tree.lat,
                                lng: tree.lng,
                                // species updates?
                            }
                        });
                    } else {
                        // Create new tree
                        const newTree = await tx.tree.create({
                            data: {
                                numero_etiqueta: tree.numero_etiqueta,
                                rua: tree.rua,
                                numero: tree.numero,
                                bairro: tree.bairro,
                                lat: tree.lat,
                                lng: tree.lng,
                                speciesId: Number(tree.speciesId),
                                // handle species if needed
                            }
                        });
                        treeId = newTree.id_arvore;
                    }
                }

                if (!treeId) {
                    // If no tree info provided and no treeId, we can't attach inspection.
                    // But maybe validation happens before.
                    continue;
                }

                // 2. Create Inspection
                if (inspection) {
                    const newInspection = await tx.inspection.create({
                        data: {
                            treeId: treeId,
                            data_inspecao: new Date(inspection.data_inspecao || new Date()),
                        }
                    });

                    // 3. Handle Temporal Data (Dendrometric)
                    if (inspection.dendrometric) {
                        // Close previous valid record
                        // Find currently valid record for this tree
                        // Note: DendrometricData is linked to Inspection, but we need to know which one was "current" for this tree.
                        // This implies querying ALL inspections for this tree and finding the open dendrometric data.
                        // Or we can query DendrometricData directly if we linked it to Tree? 
                        // Schema: DendrometricData -> Inspection -> Tree.

                        // We need to find the specific DendrometricData for this TREE where valid_to is NULL.

                        // Wait, schema check:
                        // DendrometricData relates to Inspection. Inspection relates to Tree.
                        // So we find other inspections for this tree.

                        const lastDendro = await tx.dendrometricData.findFirst({
                            where: {
                                inspection: { treeId: treeId },
                                valid_to: null
                            }
                        });

                        if (lastDendro) {
                            await tx.dendrometricData.update({
                                where: { id: lastDendro.id },
                                data: { valid_to: new Date() } // Close with current timestamp
                            });
                        }

                        // Insert new
                        await tx.dendrometricData.create({
                            data: {
                                inspectionId: newInspection.id_inspecao,
                                dap_cm: inspection.dendrometric.dap_cm,
                                cap_cm: inspection.dendrometric.cap_cm,
                                altura_total_m: inspection.dendrometric.altura_total_m,
                                altura_copa_m: inspection.dendrometric.altura_copa_m,
                                valid_from: new Date(),
                                valid_to: null // Current
                            }
                        });
                    }

                    // 4. Handle Temporal Data (Phytosanitary)
                    if (inspection.phytosanitary) {
                        const lastPhyto = await tx.phytosanitaryData.findFirst({
                            where: {
                                inspection: { treeId: treeId },
                                valid_to: null
                            }
                        });

                        if (lastPhyto) {
                            await tx.phytosanitaryData.update({
                                where: { id: lastPhyto.id },
                                data: { valid_to: new Date() }
                            });
                        }

                        await tx.phytosanitaryData.create({
                            data: {
                                inspectionId: newInspection.id_inspecao,
                                estado_saude: inspection.phytosanitary.estado_saude,
                                epiphytes: inspection.phytosanitary.epiphytes,
                                problemas: inspection.phytosanitary.problemas, // JSON
                                valid_from: new Date(),
                                valid_to: null
                            }
                        });
                    }

                    // 5. Handle Management
                    if (inspection.management) {
                        // Same temporal logic if management is tracking status "active"? 
                        // ManagementAction usually generates an OS. 
                        // But if we track "Proposed Action" validity (until it's done or superseded), we can use temporal.

                        const lastMgmt = await tx.managementAction.findFirst({
                            where: {
                                inspection: { treeId: treeId },
                                valid_to: null
                            }
                        });

                        if (lastMgmt) {
                            await tx.managementAction.update({
                                where: { id: lastMgmt.id },
                                data: { valid_to: new Date() }
                            });
                        }

                        await tx.managementAction.create({
                            data: {
                                inspectionId: newInspection.id_inspecao,
                                action_type: inspection.management.action_type,
                                poda_type: inspection.management.poda_type,
                                justification: inspection.management.justification,
                                valid_from: new Date(),
                                valid_to: null
                            }
                        });
                    }

                    // 6. Handle Photos (Metadata) (HU14 prep)
                    if (inspection.photos && Array.isArray(inspection.photos)) {
                        for (const photo of inspection.photos) {
                            // Create metadata record. Capture URL will be generated later or handled by client?
                            // PROJETO.MD: "API retorna ... uma lista de URLs de upload pré-assinados"
                            // So we create the record with a placeholder or empty url, generate the presigned url, and return it.

                            // For this MVP step, let's just create the record. 
                            // We'll need Vercel Blob SDK for the URL generation.

                            await tx.photoMetadata.create({
                                data: {
                                    tree_id: treeId,
                                    file_name: photo.file_name,
                                    blob_url: 'pending_upload', // Placeholder
                                    captured_at: new Date(photo.captured_at || new Date()),
                                }
                            });
                        }
                    }
                }
            }
        });

        // Refine response to include Upload URLs (Future Step)
        return NextResponse.json({ status: 'synced', timestamp: new Date() });

    } catch (error) {
        console.error('Sync error:', error);
        return NextResponse.json({ error: 'Sync failed' }, { status: 500 });
    }
}
