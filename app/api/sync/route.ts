import { NextResponse } from 'next/server';
import { prisma } from '../../lib/prisma';
import { revalidatePath } from 'next/cache';
import { Prisma } from '@prisma/client';
import { auth } from '@/auth';

// Constants for Temporal Logic
const INFINITY_DATE = null;

export async function POST(request: Request) {
    try {
        // Authenticate the incoming sync request (Mobile app passes NextAuth cookies via OkHttp)
        const session = await auth();
        const inspectorId = session?.user?.id || null;

        const body = await request.json();
        console.log('Sync payload received:', JSON.stringify(body).substring(0, 500) + '...');
        const { sync_batch } = body;

        // Expected payload: { sync_batch: [ { tree: ..., inspection: ... } ] }

        if (!Array.isArray(sync_batch)) {
            console.error('Invalid sync_batch:', sync_batch);
            return NextResponse.json({ error: 'Invalid payload: sync_batch must be an array' }, { status: 400 });
        }

        console.log(`Processing sync batch with ${sync_batch.length} items`);

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
                console.log(`Processing item: Tree UUID=${tree?.uuid}, Tag=${tree?.numero_etiqueta}, Photo=${tree?.cover_photo}`);
                if (inspection?.photos) {
                    console.log(`  Inspection Photos: ${inspection.photos.map((p: any) => p.uri).join(', ')}`);
                }
                let treeId: number | null = null;

                // 1. Process Tree (Upsert by UUID)
                if (tree) {
                    if (!tree.uuid) {
                        console.warn("Tree sync item missing UUID", tree);
                        // Skip if missing UUID, we cannot reliably sync without it in the new model
                        continue;
                    }

                    // Validate Species ID and fetch canonical names if possible
                    console.log(`[SYNC DEBUG] Tree UUID=${tree.uuid}, Raw speciesId='${tree.speciesId}' (type: ${typeof tree.speciesId}), nome_popular='${tree.nome_popular}'`);
                    // INTELLIGENT LINKING LOGIC
                    let existingTree = null;

                    // 1. Try to find by id_arvore (Remote ID) - MOST RELIABLE
                    if (tree.id_arvore) {
                        existingTree = await tx.tree.findUnique({ where: { id_arvore: Number(tree.id_arvore) } });
                    }

                    // 2. Try to find by UUID (standard sync)
                    if (!existingTree && tree.uuid) {
                        existingTree = await tx.tree.findUnique({ where: { uuid: tree.uuid } });
                    }

                    // 3. If not found, try to find by Tag (fallback for first sync)
                    if (!existingTree && tree.numero_etiqueta) {
                        existingTree = await tx.tree.findFirst({
                            where: { numero_etiqueta: tree.numero_etiqueta },
                            orderBy: { id_arvore: 'asc' } // Always prefer the oldest/canonical tree
                        });
                    }

                    let targetSpeciesId = (!tree.speciesId || isNaN(Number(tree.speciesId))) ? 2 : Number(tree.speciesId); // Default to 2 (NI) if null/invalid
                    let nomePopular = tree.nome_popular;

                    const speciesRecord = await tx.species.findUnique({
                        where: { id_especie: targetSpeciesId },
                        select: { nome_comum: true, nome_cientifico: true }
                    });

                    if (speciesRecord) {
                        // INTELLIGENT NAME PRESERVATION:
                        // 1. If mobile sent a name NOT in the catalog (manual on mobile), use it.
                        // 2. If mobile sent a catalog name (or nothing), only update if web name is catalog-default or null.

                        const mobileName = tree.nome_popular?.trim();
                        const isMobileNameEmpty = !mobileName;
                        const isMobileNameCatalog = mobileName === speciesRecord.nome_comum;

                        if (!isMobileNameEmpty && !isMobileNameCatalog) {
                            // User typed something custom on mobile
                            nomePopular = mobileName;
                        } else if (existingTree && existingTree.nome_popular) {
                            // Mobile sent default or nothing.
                            // We should only overwrite web if web has a default name.
                            // However, we don't easily know the name of the OLD species without fetching it.
                            // For now, let's trust the logic: if mobile sends default, we only update if web had NO name.
                            // If web already has a name, we keep it (preserving manual update).
                            nomePopular = existingTree.nome_popular;
                        } else {
                            // Fallback to species common name
                            nomePopular = speciesRecord.nome_comum;
                        }
                    } else {
                        console.warn(`Species ID ${targetSpeciesId} not found in DB, falling back to 1`);
                        targetSpeciesId = 1;
                        nomePopular = tree.nome_popular || "Espécie desconhecida";
                    }

                    console.log(`Processing Tree: Tag=${tree.numero_etiqueta}, Received Name='${tree.nome_popular}', Resolved Name='${nomePopular}', SpeciesId=${targetSpeciesId}`);

                    if (existingTree) {
                        // UPDATE existing tree
                        const updated = await tx.tree.update({
                            where: { id_arvore: existingTree.id_arvore },
                            data: {
                                // Do NOT update UUID to keep server canonical identity
                                // Preserve the resolved name (which now considers manual updates)
                                nome_popular: nomePopular,
                                cover_photo: (tree.cover_photo && !tree.cover_photo.startsWith('content://')) ? tree.cover_photo : existingTree.cover_photo,
                                speciesId: targetSpeciesId,
                                // Only update address/location if provided and seems valid?
                                // For now, trust the incoming sync as 'latest'
                                rua: tree.rua || existingTree.rua,
                                numero: tree.numero || existingTree.numero,
                                bairro: tree.bairro || existingTree.bairro,
                            }
                        });

                        // Update Location separately if needed
                        if (tree.lat != null && tree.lng != null) {
                            await tx.$executeRaw`
                                UPDATE "Tree" 
                                SET "localizacao" = ST_SetSRID(ST_MakePoint(${parseFloat(tree.lng)}, ${parseFloat(tree.lat)}), 4326)
                                WHERE "id_arvore" = ${updated.id_arvore}
                            `;
                        }
                        treeId = updated.id_arvore;
                        // Revalidate cache for this tree
                        revalidatePath(`/trees/${treeId}`);
                        revalidatePath(`/api/trees/${treeId}`);
                    } else {
                        // CREATE new tree (really new)
                        const created = await tx.tree.create({
                            data: {
                                uuid: tree.uuid,
                                numero_etiqueta: tree.numero_etiqueta,
                                nome_popular: nomePopular,
                                cover_photo: (tree.cover_photo && !tree.cover_photo.startsWith('content://')) ? tree.cover_photo : null,
                                rua: tree.rua,
                                numero: tree.numero,
                                bairro: tree.bairro,
                                speciesId: targetSpeciesId,
                            }
                        });

                        if (tree.lat != null && tree.lng != null) {
                            await tx.$executeRaw`
                                UPDATE "Tree" 
                                SET "localizacao" = ST_SetSRID(ST_MakePoint(${parseFloat(tree.lng)}, ${parseFloat(tree.lat)}), 4326)
                                WHERE "id_arvore" = ${created.id_arvore}
                            `;
                        }
                        treeId = created.id_arvore;
                    }
                }

                // Use inspection's linked tree if we didn't process a tree block but have a way to link?
                // For now, we rely on 'tree' block being present in the sync item as per Android DTO.

                if (!treeId) continue;

                // 2. Process Inspection (linked to treeId)
                if (inspection) {
                    if (inspection.uuid) {
                        const inspectionData: any = {
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
                                    // New fields with safety casting
                                    estado_saude: inspection.phytosanitary.estado_saude,
                                    danos_tipo: inspection.phytosanitary.danos_tipo,
                                    severity_level: inspection.phytosanitary.severity_level ? Number(inspection.phytosanitary.severity_level) : undefined,
                                    risk_probability: inspection.phytosanitary.risk_probability,
                                    target_value: inspection.phytosanitary.target_value ? Number(inspection.phytosanitary.target_value) : undefined,
                                    risk_rating: inspection.phytosanitary.risk_rating ? Number(inspection.phytosanitary.risk_rating) : undefined,

                                    // Pests relation
                                    pests: {
                                        connectOrCreate: (inspection.phytosanitary.pragas || []).map((p: string) => ({
                                            where: { nome_comum: p },
                                            create: { nome_comum: p, tipo: 'Praga' }
                                        }))
                                    },

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
                                    uri: p.uri,
                                    is_cover: p.is_cover || false
                                })) : []
                            },
                            tree_removed: inspection.tree_removed || false
                        };

                        if (inspectorId) {
                            inspectionData.createdById = inspectorId;
                        }

                        // 3. Logic: Update Tree status based on inspection (Ativa vs Removida)
                        const newStatus = inspection.tree_removed ? 'Removida' : 'Ativa';
                        console.log(`[SYNC] Updating Tree ${treeId} status to ${newStatus}`);
                        await tx.tree.update({
                            where: { id_arvore: treeId },
                            data: { status: newStatus }
                        });

                        // Upsert Inspection by UUID
                        await tx.inspection.upsert({
                            where: { uuid: inspection.uuid },
                            update: {
                                data_inspecao: inspectionData.data_inspecao,
                                tree_removed: inspectionData.tree_removed,
                                createdById: inspectionData.createdById, // Update inspector if taking over ownership
                                // Update nested data
                                dendrometrics: inspection.dendrometric ? {
                                    deleteMany: {},
                                    create: inspectionData.dendrometrics.create
                                } : undefined,
                                phytosanitary: inspection.phytosanitary ? {
                                    deleteMany: {},
                                    create: inspectionData.phytosanitary.create
                                } : undefined,
                                managementActions: inspection.management ? {
                                    deleteMany: {},
                                    create: inspectionData.managementActions.create
                                } : undefined,
                                // Update photos if provided
                                photos: inspection.photos ? {
                                    deleteMany: {}, // Simple way for MVP: replace all photos with incoming set
                                    create: inspection.photos.filter((p: any) => p.uri && !p.uri.startsWith('content://')).map((p: any) => ({
                                        uri: p.uri,
                                        is_cover: p.is_cover || false
                                    }))
                                } : undefined
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
