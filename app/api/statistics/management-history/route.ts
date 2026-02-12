import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const yearStr = searchParams.get('year');
    const monthStr = searchParams.get('month');

    try {
        const year = yearStr ? parseInt(yearStr) : new Date().getFullYear();
        const month = monthStr ? parseInt(monthStr) : null;

        // Fetch labor cost rate from settings
        const laborCostSetting = await prisma.systemSettings.findUnique({
            where: { key: 'labor_cost' }
        });
        const laborCostRate = laborCostSetting ? parseFloat(laborCostSetting.value) : 0;

        // Base filter for completed or pending review service orders
        const whereClause: any = {
            status: { in: ['Concluída', 'Aguardando Revisão'] },
            executed_at: {
                not: null,
            }
        };

        if (month !== null) {
            const startDate = new Date(year, month - 1, 1);
            const endDate = new Date(year, month, 0, 23, 59, 59, 999);
            whereClause.executed_at = {
                gte: startDate,
                lte: endDate
            };
        } else {
            const startDate = new Date(year, 0, 1);
            const endDate = new Date(year, 11, 31, 23, 59, 59, 999);
            whereClause.executed_at = {
                gte: startDate,
                lte: endDate
            };
        }

        const serviceOrders = await prisma.serviceOrder.findMany({
            where: whereClause,
            include: {
                trees: {
                    select: {
                        id_arvore: true
                    }
                },
                materials: {
                    select: {
                        quantity: true,
                        unit_cost: true
                    }
                }
            }
        });

        // Initialize monthly data
        const monthlyData = Array.from({ length: 12 }, (_, i) => ({
            month: i + 1,
            monthName: new Intl.DateTimeFormat('pt-BR', { month: 'short' }).format(new Date(2000, i, 1)),
            treeCount: 0,
            totalCost: 0
        }));

        serviceOrders.forEach(so => {
            const date = so.executed_at!;
            const m = date.getMonth(); // 0-indexed

            monthlyData[m].treeCount += so.trees.length;

            // 1. Material Cost
            const materialCost = so.materials.reduce((sum, mat) => {
                return sum + (Number(mat.quantity) * Number(mat.unit_cost));
            }, 0);

            // 2. Labor Cost
            let laborCost = 0;
            if (so.start_time && so.executed_at) {
                const durationMs = so.executed_at.getTime() - so.start_time.getTime();
                const durationHours = durationMs / (1000 * 60 * 60);
                laborCost = (so.team_size || 1) * durationHours * laborCostRate;
            }

            monthlyData[m].totalCost += (materialCost + laborCost);
        });

        // Return the full historical series for the year.
        return NextResponse.json({
            year,
            month,
            data: monthlyData,
            summary: {
                totalTrees: monthlyData.reduce((sum, d) => sum + d.treeCount, 0),
                totalCost: monthlyData.reduce((sum, d) => sum + d.totalCost, 0)
            }
        });

    } catch (error) {
        console.error('Error fetching management history:', error);
        return NextResponse.json({ error: 'Failed to fetch management history' }, { status: 500 });
    }
}
