import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id: idString } = await params;
    const id = parseInt(idString);
    const body = await request.json();
    const { description, photos, materials, duration, customStartTime, teamSize } = body;
    // photos: [{ uri: string, category: 'Antes' | 'Durante' | 'Depois' }]
    // materials: [{ name: string, quantity: number, unit: string, unit_cost?: number }]

    try {
        const os = await prisma.serviceOrder.findUnique({
            where: { id },
            include: { managementActions: true }
        });

        if (!os) {
            return NextResponse.json({ error: 'Service Order not found' }, { status: 404 });
        }

        // Fetch all active materials to get their default costs
        const masterMaterials = await prisma.materialMaster.findMany({
            where: { active: true }
        });

        // Create a map for quick lookup
        const costMap = new Map(masterMaterials.map(m => [m.name, m.unit_cost]));

        // Logic for timestamps
        let finalExecutedAt = new Date();
        let finalStartTime: Date | undefined = undefined;

        if (customStartTime) {
            finalStartTime = new Date(customStartTime);
            if (duration && (duration.hours > 0 || duration.minutes > 0)) {
                // If start + duration provided, calculated end time
                const totalMinutes = (duration.hours * 60) + duration.minutes;
                finalExecutedAt = new Date(finalStartTime.getTime() + totalMinutes * 60000);
            }
        } else if (duration && (duration.hours > 0 || duration.minutes > 0)) {
            // Only duration provided: Back-calculate start from NOW
            const totalMinutes = (duration.hours * 60) + duration.minutes;
            finalStartTime = new Date(finalExecutedAt.getTime() - totalMinutes * 60000);
        }

        const updatedOS = await prisma.serviceOrder.update({
            where: { id },
            data: {
                status: 'Aguardando Revisão',
                executed_at: finalExecutedAt,
                team_size: teamSize ? parseInt(teamSize) : undefined,
                ...(finalStartTime ? { start_time: finalStartTime } : {}),
                description: description,
                photos: photos && Array.isArray(photos) ? {
                    create: photos.map((photo: any) => ({
                        uri: photo.uri,
                        category: photo.category || 'Depois'
                    }))
                } : undefined,
                materials: materials && Array.isArray(materials) ? {
                    create: materials.map((mat: any) => ({
                        name: mat.name,
                        quantity: mat.quantity,
                        unit: mat.unit,
                        unit_cost: mat.unit_cost !== undefined ? mat.unit_cost : (costMap.get(mat.name) || 0)
                    }))
                } : undefined
            },
            include: {
                photos: true
            }
        });

        // Closing associated management actions is now handled by the Gestor approval (PATCH)

        return NextResponse.json(updatedOS);
    } catch (error) {
        console.error('Error finalizing OS:', error);
        return NextResponse.json({ error: 'Failed to finalize service order' }, { status: 500 });
    }
}
