import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';
import { auth } from '@/auth';

export async function GET(request: Request) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const yearParam = searchParams.get('year');
        const monthParam = searchParams.get('month');
        const dayParam = searchParams.get('day');

        const year = yearParam ? parseInt(yearParam) : new Date().getFullYear();

        let startDate: Date;
        let endDate: Date;

        if (monthParam) {
            const month = parseInt(monthParam);
            if (dayParam) {
                const day = parseInt(dayParam);
                startDate = new Date(year, month - 1, day, 0, 0, 0);
                endDate = new Date(year, month - 1, day, 23, 59, 59, 999);
            } else {
                startDate = new Date(year, month - 1, 1);
                endDate = new Date(year, month, 0, 23, 59, 59, 999);
            }
        } else {
            startDate = new Date(year, 0, 1);
            endDate = new Date(year, 11, 31, 23, 59, 59, 999);
        }

        // 1. Fetch raw inspections to group uniquely by Tree
        const inspections = await prisma.inspection.findMany({
            where: {
                data_inspecao: {
                    gte: startDate,
                    lte: endDate
                }
            },
            select: {
                createdById: true,
                data_inspecao: true,
                treeId: true
            }
        });

        // 2. Fetch User dict for Name mapping
        const userIds = Array.from(new Set(inspections.map(i => i.createdById).filter(Boolean))) as string[];
        const users = await prisma.user.findMany({
            where: { id: { in: userIds } },
            select: { id: true, name: true, email: true }
        });

        const userMap = users.reduce((acc: Record<string, string>, user: any) => {
            acc[user.id] = user.name || user.email.split('@')[0];
            return acc;
        }, {} as Record<string, string>);

        // 3. Format and clean data to return aggregate results per Day + User
        const dailyUserStats: Record<string, { date: string, inspectorId: string, inspectorName: string, uniqueTrees: Set<number>, count: number }> = {};

        // 4. Monthly aggregation logic
        const monthlyData = Array.from({ length: 12 }, (_, i) => ({
            month: i + 1,
            monthName: new Intl.DateTimeFormat('pt-BR', { month: 'short' }).format(new Date(2000, i, 1)),
            count: 0,
            uniqueTrees: new Set<number>()
        }));

        inspections.forEach((item) => {
            const inspectorId = item.createdById;
            if (!inspectorId || !item.treeId) return; // Skip if no creator or tree

            const inspectorName = userMap[inspectorId] || 'Desconhecido';

            // Format date to YYYY-MM-DD
            const dateStr = item.data_inspecao.toISOString().split('T')[0];
            const monthIdx = item.data_inspecao.getMonth();

            const key = `${dateStr}_${inspectorId}`;

            if (!dailyUserStats[key]) {
                dailyUserStats[key] = {
                    date: dateStr,
                    inspectorId: inspectorId,
                    inspectorName: inspectorName,
                    uniqueTrees: new Set(),
                    count: 0
                };
            }

            dailyUserStats[key].uniqueTrees.add(item.treeId);
            dailyUserStats[key].count = dailyUserStats[key].uniqueTrees.size;

            // Update monthly stats
            monthlyData[monthIdx].uniqueTrees.add(item.treeId);
            monthlyData[monthIdx].count = monthlyData[monthIdx].uniqueTrees.size;
        });

        // Convert the map to an array and sort by Date descending
        const data = Object.values(dailyUserStats).map(({ uniqueTrees, ...rest }) => rest).sort((a, b) => {
            if (a.date === b.date) {
                return b.count - a.count; // Sort by count descending if same day
            }
            return new Date(b.date).getTime() - new Date(a.date).getTime();
        });

        const totalEvaluations = data.reduce((sum, item) => sum + item.count, 0);

        return NextResponse.json({
            data,
            monthlyData: monthlyData.map(({ uniqueTrees, ...rest }) => rest),
            summary: {
                totalEvaluations
            }
        });
    } catch (error) {
        console.error('Error fetching inspection statistics:', error);
        return NextResponse.json(
            { error: 'Erro ao analisar os dados de avaliações' },
            { status: 500 }
        );
    }
}
