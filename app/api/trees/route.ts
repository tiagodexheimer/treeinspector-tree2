import { NextResponse } from 'next/server';
import { prisma } from '../../lib/prisma';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const bairro = searchParams.get('bairro');
        const endereco = searchParams.get('endereco');
        const q = searchParams.get('q');

        // Pagination params - only active if 'page' is present
        const pageParam = searchParams.get('page');
        const limitParam = searchParams.get('limit');

        // Build base where clause
        const where: any = {
            ...(q && {
                OR: [
                    { numero_etiqueta: { contains: q, mode: 'insensitive' } },
                    { rua: { contains: q, mode: 'insensitive' } },
                    { endereco: { contains: q, mode: 'insensitive' } }
                ]
            }),
            ...(bairro && { bairro: { contains: bairro, mode: 'insensitive' } }),
            ...(endereco && {
                OR: [
                    { endereco: { contains: endereco, mode: 'insensitive' } },
                    { rua: { contains: endereco, mode: 'insensitive' } }
                ]
            }),
        };

        // If pagination is requested
        if (pageParam || limitParam) {
            const page = parseInt(pageParam || '1');
            const limit = parseInt(limitParam || '20');
            const skip = (page - 1) * limit;

            const total = await prisma.tree.count({ where });

            const trees = await prisma.tree.findMany({
                where,
                orderBy: { id_arvore: 'desc' },
                skip,
                take: limit,
                include: {
                    species: true,
                    inspections: {
                        orderBy: { data_inspecao: 'desc' },
                        take: 1,
                        include: {
                            phytosanitary: {
                                orderBy: { valid_from: 'desc' },
                                take: 1
                            }
                        }
                    }
                }
            });

            return NextResponse.json({
                data: trees,
                pagination: {
                    total,
                    pages: Math.ceil(total / limit),
                    currentPage: page,
                    limit
                }
            });
        }

        // Default: Return ALL trees (Backward compatibility for Map)
        // Check for Geo-Spatial Search (Nearby)
        const latParam = searchParams.get('lat');
        const lngParam = searchParams.get('lng');
        const radiusParam = searchParams.get('radius');

        if (latParam && lngParam && radiusParam) {
            const lat = parseFloat(latParam);
            const lng = parseFloat(lngParam);
            const radius = parseFloat(radiusParam); // in meters

            // Earth Radius approx 6371km. 
            // 1 degree lat ~= 111km = 111000m
            const latDelta = radius / 111000;
            const lngDelta = radius / (111000 * Math.cos(lat * (Math.PI / 180)));

            const minLat = lat - latDelta;
            const maxLat = lat + latDelta;
            const minLng = lng - lngDelta;
            const maxLng = lng + lngDelta;

            const trees = await prisma.tree.findMany({
                where: {
                    ...where,
                    lat: { gte: minLat, lte: maxLat },
                    lng: { gte: minLng, lte: maxLng }
                },
                select: {
                    id_arvore: true,
                    // uuid: true, // Assuming UUID is not on schema yet based on previous files, using id_arvore primarily
                    lat: true,
                    lng: true,
                    numero_etiqueta: true,
                    rua: true,
                    numero: true,
                    bairro: true,
                    speciesId: true,
                    species: {
                        select: {
                            nome_comum: true,
                            nome_cientifico: true
                        }
                    },
                    photos: {
                        take: 1,
                        select: {
                            blob_url: true // In a real app we'd send a URL, here we send what we have. 
                            // If blob_url is actually a URL string, great. If base64, it's heavy but lazy loaded by client request.
                        }
                    }
                },
                // take: 500 // Removed to ensure we calculate distance for ALL trees in the box before slicing.
                // Assuming density isn't massive (e.g. < 5000 trees in 500m radius).
                // If performance becomes an issue, we can optimize with PostGIS or raw query.
            });

            // Calculate distance and sort
            const treesWithDist = trees.map(t => {
                if (!t.lat || !t.lng) return { ...t, distance: Infinity };

                // Haversine
                const R = 6371e3; // metres
                const φ1 = lat * Math.PI / 180;
                const φ2 = t.lat * Math.PI / 180;
                const Δφ = (t.lat - lat) * Math.PI / 180;
                const Δλ = (t.lng - lng) * Math.PI / 180;
                const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
                    Math.cos(φ1) * Math.cos(φ2) *
                    Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
                const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
                const d = R * c; // in metres

                return { ...t, distance: d };
            });

            treesWithDist.sort((a, b) => a.distance - b.distance);

            // Return Top 50 of the closest
            const mobileTrees = treesWithDist.slice(0, 50).map(t => ({
                id: t.id_arvore,
                etiqueta: t.numero_etiqueta,
                species_common: t.species?.nome_comum,
                species_scientific: t.species?.nome_cientifico,
                address: `${t.rua || ''}, ${t.numero || ''} - ${t.bairro || ''}`,
                lat: t.lat,
                lng: t.lng,
                distance: t.distance // Return distance
            }));

            return NextResponse.json(mobileTrees);
        }

        // Default: Return ALL trees (Optimized for Map)
        const trees = await prisma.tree.findMany({
            where,
            orderBy: { id_arvore: 'desc' },
            select: {
                id_arvore: true,
                lat: true,
                lng: true,
                numero_etiqueta: true,
                species: {
                    select: {
                        nome_comum: true
                    }
                },
                inspections: {
                    orderBy: { data_inspecao: 'desc' },
                    take: 1,
                    select: {
                        phytosanitary: {
                            orderBy: { valid_from: 'desc' },
                            take: 1,
                            select: {
                                estado_saude: true
                            }
                        }
                    }
                }
            }
        });

        return NextResponse.json(trees);
    } catch (error) {
        console.error('Error fetching trees:', error);
        return NextResponse.json({ error: 'Failed to fetch trees' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { speciesId, numero_etiqueta, rua, numero, bairro, endereco, lat, lng, photo_uri } = body;

        const newTree = await prisma.tree.create({
            data: {
                speciesId: Number(speciesId),
                numero_etiqueta,
                rua,
                numero,
                bairro,
                endereco,
                lat,
                lng,
                photos: photo_uri ? {
                    create: {
                        blob_url: photo_uri,
                        file_name: 'tree_photo.jpg' // Default name as we don't have one
                    }
                } : undefined
            },
            include: {
                species: true
            }
        });

        return NextResponse.json(newTree, { status: 201 });
    } catch (error) {
        console.error('Error creating tree:', error);
        return NextResponse.json({ error: 'Failed to create tree' }, { status: 500 });
    }
}
