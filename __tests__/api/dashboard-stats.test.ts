jest.mock('@/app/lib/prisma');
import { GET } from '@/app/api/stats/dashboard/route';
import { prisma } from '@/app/lib/prisma';

const prismaMock = prisma as any;

describe('Dashboard Statistics API (/api/stats/dashboard)', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('GET', () => {
        it('should return aggregated counts for dashboard', async () => {
            prismaMock.species.count.mockResolvedValueOnce(150);
            prismaMock.pestCatalog.count.mockResolvedValueOnce(20);
            prismaMock.tree.count.mockResolvedValueOnce(5000);

            const req = new Request('http://localhost:3000/api/stats/dashboard');
            const response = await GET(req);
            const json = await response.json();

            expect(response.status).toBe(200);
            expect(json).toEqual({
                species: 150,
                pests: 20,
                trees: 5000
            });
            expect(prismaMock.species.count).toHaveBeenCalledTimes(1);
            expect(prismaMock.pestCatalog.count).toHaveBeenCalledTimes(1);
            expect(prismaMock.tree.count).toHaveBeenCalledTimes(1);
        });

        it('should return 500 if database fetch fails', async () => {
            prismaMock.species.count.mockRejectedValueOnce(new Error('DB connection failed'));

            const req = new Request('http://localhost:3000/api/stats/dashboard');
            const response = await GET(req);
            const json = await response.json();

            expect(response.status).toBe(500);
            expect(json.error).toBe('Failed to fetch stats');
        });
    });
});
