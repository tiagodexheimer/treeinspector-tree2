jest.mock('@/app/lib/prisma');
import { GET, POST } from '@/app/api/materials/route';
import { prisma } from '@/app/lib/prisma';

const prismaMock = prisma as any;

jest.mock('@/auth', () => ({
    auth: jest.fn(),
}));
import { auth } from '@/auth';

describe('Materials API (/api/materials)', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('GET', () => {
        it('should return all materials', async () => {
            const mockMaterials = [{ id: 1, name: 'Adubo', unit: 'kg', active: true, auto_load: false }];
            prismaMock.materialMaster.findMany.mockResolvedValueOnce(mockMaterials);

            const req = new Request('http://localhost:3000/api/materials');
            const response = await GET(req);
            const json = await response.json();

            expect(response.status).toBe(200);
            expect(json).toEqual(mockMaterials);
            expect(prismaMock.materialMaster.findMany).toHaveBeenCalledWith({
                where: {},
                orderBy: { name: 'asc' }
            });
        });

        it('should return filtered materials (active and autoLoad)', async () => {
            prismaMock.materialMaster.findMany.mockResolvedValueOnce([]);

            const req = new Request('http://localhost:3000/api/materials?active=true&autoLoad=true');
            await GET(req);

            expect(prismaMock.materialMaster.findMany).toHaveBeenCalledWith({
                where: { active: true, auto_load: true },
                orderBy: { name: 'asc' }
            });
        });
    });

    describe('POST', () => {
        it('should return 401 if unauthenticated', async () => {
            (auth as jest.Mock).mockResolvedValueOnce(null);
            const req = new Request('http://localhost:3000/api/materials', { method: 'POST', body: JSON.stringify({}) });
            const response = await POST(req);
            expect(response.status).toBe(401);
        });

        it('should return 403 if unauthorized', async () => {
            (auth as jest.Mock).mockResolvedValueOnce({ user: { role: 'INSPETOR' } }); // Inspectors can't create materials
            const req = new Request('http://localhost:3000/api/materials', { method: 'POST', body: JSON.stringify({}) });
            const response = await POST(req);
            expect(response.status).toBe(403);
        });

        it('should create material successfully (ADMIN)', async () => {
            (auth as jest.Mock).mockResolvedValueOnce({ user: { role: 'ADMIN' } });
            const mockMaterial = { id: 1, name: 'Calcário', unit: 'saco 50kg' };
            prismaMock.materialMaster.create.mockResolvedValueOnce(mockMaterial);

            const req = new Request('http://localhost:3000/api/materials', {
                method: 'POST',
                body: JSON.stringify({ name: 'Calcário', unit: 'saco 50kg' })
            });
            const response = await POST(req);
            const json = await response.json();

            expect(response.status).toBe(201);
            expect(json).toEqual(mockMaterial);
            expect(prismaMock.materialMaster.create).toHaveBeenCalledWith({
                data: {
                    name: 'Calcário',
                    unit: 'saco 50kg',
                    unit_cost: 0,
                    auto_load: false,
                    active: true
                }
            });
        });
    });
});
