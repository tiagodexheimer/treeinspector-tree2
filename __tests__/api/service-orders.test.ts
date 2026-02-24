jest.mock('@/app/lib/prisma');
import { GET, POST } from '@/app/api/service-orders/route';
import { prisma } from '@/app/lib/prisma';

const prismaMock = prisma as any;

jest.mock('@/auth', () => ({
    auth: jest.fn(),
}));
import { auth } from '@/auth';

describe('Service Orders API (/api/service-orders)', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('GET', () => {
        it('should return service orders for an admin (no roles restricted)', async () => {
            (auth as jest.Mock).mockResolvedValueOnce({ user: { role: 'ADMIN', id: 'user-1' } });

            const mockSO = [{ id: 1, status: 'Planejada', created_at: new Date() }];
            prismaMock.serviceOrder.findMany.mockResolvedValueOnce(mockSO);

            // Expected queries
            prismaMock.$queryRaw.mockResolvedValueOnce([{ id_arvore: 1, lat: 0, lng: 0, osId: 1 }]) // trees
                .mockResolvedValueOnce([{ id: 10, osId: 1 }]); // management actions

            const req = new Request('http://localhost:3000/api/service-orders');
            const response = await GET(req);
            const json = await response.json();

            expect(response.status).toBe(200);
            expect(json).toHaveLength(1);
            expect(json[0].id).toBe(1);
            expect(json[0].trees).toHaveLength(1);
            expect(json[0].managementActions).toHaveLength(1);

            expect(prismaMock.serviceOrder.findMany).toHaveBeenCalledWith(expect.objectContaining({
                where: {} // no role restrictions
            }));
        });

        it('should return only assigned service orders for OPERACIONAL role', async () => {
            (auth as jest.Mock).mockResolvedValueOnce({ user: { role: 'OPERACIONAL', id: 'user-op' } });

            prismaMock.serviceOrder.findMany.mockResolvedValueOnce([]); // empty return is fine for testing where clause

            const req = new Request('http://localhost:3000/api/service-orders');
            const response = await GET(req);

            expect(response.status).toBe(200);

            expect(prismaMock.serviceOrder.findMany).toHaveBeenCalledWith(expect.objectContaining({
                where: {
                    OR: [
                        { assignedToId: 'user-op' },
                        { assignedToId: null }
                    ]
                }
            }));
        });

        it('should filter by active status', async () => {
            (auth as jest.Mock).mockResolvedValueOnce({ user: { role: 'ADMIN' } });
            prismaMock.serviceOrder.findMany.mockResolvedValueOnce([]);

            const req = new Request('http://localhost:3000/api/service-orders?status=active');
            await GET(req);

            expect(prismaMock.serviceOrder.findMany).toHaveBeenCalledWith(expect.objectContaining({
                where: {
                    status: { notIn: ['Concluída', 'Cancelada'] }
                }
            }));
        });
    });

    describe('POST', () => {
        it('should return 401 if unauthenticated', async () => {
            (auth as jest.Mock).mockResolvedValueOnce(null);
            const req = new Request('http://localhost:3000/api/service-orders', { method: 'POST', body: JSON.stringify({}) });
            const response = await POST(req);
            expect(response.status).toBe(401);
        });

        it('should return 400 if treeIds is missing', async () => {
            (auth as jest.Mock).mockResolvedValueOnce({ user: { role: 'GESTOR', id: 'g1' } });

            const req = new Request('http://localhost:3000/api/service-orders', {
                method: 'POST',
                body: JSON.stringify({ description: 'Test' })
            });
            const response = await POST(req);
            expect(response.status).toBe(400);
        });

        it('should create a service order successfully', async () => {
            (auth as jest.Mock).mockResolvedValueOnce({ user: { role: 'GESTOR', id: 'g1' } });

            // Mock finding trees with open management actions
            const mockTrees = [{
                id_arvore: 100,
                inspections: [{
                    managementActions: [{ id: 500, necessita_manejo: true }]
                }]
            }];
            prismaMock.tree.findMany.mockResolvedValueOnce(mockTrees);

            // Mock OS creation
            const mockCreatedOS = { id: 1, status: 'Planejada' };
            prismaMock.serviceOrder.create.mockResolvedValueOnce(mockCreatedOS);

            const payload = {
                treeIds: [100],
                description: 'Pruning',
                serviceType: 'Poda'
            };

            const req = new Request('http://localhost:3000/api/service-orders', {
                method: 'POST',
                body: JSON.stringify(payload)
            });

            const response = await POST(req);
            const json = await response.json();

            expect(response.status).toBe(201);
            expect(json).toEqual(mockCreatedOS);

            expect(prismaMock.serviceOrder.create).toHaveBeenCalledWith(expect.objectContaining({
                data: expect.objectContaining({
                    status: 'Planejada',
                    createdById: 'g1',
                    serviceType: 'Poda',
                    trees: { connect: [{ id_arvore: 100 }] },
                    managementActions: { connect: [{ id: 500 }] }
                })
            }));
        });
    });
});
