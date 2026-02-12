import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const yearStr = searchParams.get('year');
    const monthStr = searchParams.get('month');

    try {
        // Validate year parameter
        const year = yearStr ? parseInt(yearStr, 10) : new Date().getFullYear();
        if (isNaN(year) || year < 2000 || year > 2100) {
            return NextResponse.json(
                { error: 'Parâmetro "year" inválido. Informe um ano entre 2000 e 2100.' },
                { status: 400 }
            );
        }

        // Validate month parameter
        const month = monthStr ? parseInt(monthStr, 10) : null;
        if (month !== null && (isNaN(month) || month < 1 || month > 12)) {
            return NextResponse.json(
                { error: 'Parâmetro "month" inválido. Informe um mês entre 1 e 12.' },
                { status: 400 }
            );
        }

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

            // 1. Material Cost — protect against NaN with fallback to 0
            const materialCost = so.materials.reduce((sum, mat) => {
                const qty = Number(mat.quantity);
                const cost = Number(mat.unit_cost);
                const lineTotal = (!isNaN(qty) && !isNaN(cost)) ? qty * cost : 0;
                return sum + lineTotal;
            }, 0);

            // 2. Labor Cost — protect against negative duration
            let laborCost = 0;
            if (so.start_time && so.executed_at) {
                const durationMs = so.executed_at.getTime() - so.start_time.getTime();
                const durationHours = Math.max(0, durationMs / (1000 * 60 * 60)); // clamp to 0
                laborCost = (so.team_size || 1) * durationHours * laborCostRate;
            }

            // Round to 2 decimal places to avoid floating point artifacts
            monthlyData[m].totalCost += Math.round((materialCost + laborCost) * 100) / 100;
        });

        return NextResponse.json({
            year,
            month,
            data: monthlyData,
            summary: {
                totalTrees: monthlyData.reduce((sum, d) => sum + d.treeCount, 0),
                totalCost: Math.round(monthlyData.reduce((sum, d) => sum + d.totalCost, 0) * 100) / 100
            }
        });

    } catch (error) {
        console.error('Error fetching management history:', error);
        return NextResponse.json(
            { error: 'Erro interno ao buscar histórico de manejo. Tente novamente.' },
            { status: 500 }
        );
    }
}
