jest.mock('@/app/lib/prisma');
import { GET, POST } from '@/app/api/pests/route';
import { prisma } from '@/app/lib/prisma';

const prismaMock = prisma as any;

jest.mock('@/auth', () => ({
    auth: jest.fn(),
}));
import { auth } from '@/auth';

describe('Pests API (/api/pests)', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('GET', () => {
        it('should return paginated pests', async () => {
            const mockPests = [{ id: 1, nome_comum: 'Formiga', tipo: 'Inseto' }];
            prismaMock.pestCatalog.findMany.mockResolvedValueOnce(mockPests);
            prismaMock.pestCatalog.count.mockResolvedValueOnce(1);

            const req = new Request('http://localhost:3000/api/pests?page=1&limit=10');
            const response = await GET(req);
            const json = await response.json();

            expect(response.status).toBe(200);
            expect(json.data).toEqual(mockPests);
            expect(json.pagination.total).toBe(1);
            expect(prismaMock.pestCatalog.findMany).toHaveBeenCalledWith({
                orderBy: { nome_comum: 'asc' },
                skip: 0,
                take: 10
            });
        });
    });

    describe('POST', () => {
        it('should return 401 if unauthenticated', async () => {
            (auth as jest.Mock).mockResolvedValueOnce(null);
            const req = new Request('http://localhost:3000/api/pests', { method: 'POST', body: JSON.stringify({}) });
            const response = await POST(req);
            expect(response.status).toBe(401);
        });

        it('should return 403 if unauthorized', async () => {
            (auth as jest.Mock).mockResolvedValueOnce({ user: { role: 'OPERACIONAL' } });
            const req = new Request('http://localhost:3000/api/pests', { method: 'POST', body: JSON.stringify({}) });
            const response = await POST(req);
            expect(response.status).toBe(403);
        });

        it('should return 400 if pest exists (P2002)', async () => {
            (auth as jest.Mock).mockResolvedValueOnce({ user: { role: 'GESTOR' } });
            const error = new Error('Unique constraint failed');
            (error as any).code = 'P2002';
            prismaMock.pestCatalog.create.mockRejectedValueOnce(error);

            const req = new Request('http://localhost:3000/api/pests', { method: 'POST', body: JSON.stringify({ nome_comum: 'Formiga' }) });
            const response = await POST(req);
            const json = await response.json();

            expect(response.status).toBe(400);
            expect(json.error).toBe('Praga já existe');
        });

        it('should create pest successfully', async () => {
            (auth as jest.Mock).mockResolvedValueOnce({ user: { role: 'GESTOR' } });
            const mockPest = { id: 1, nome_comum: 'Cupim', tipo: 'Inseto' };
            prismaMock.pestCatalog.create.mockResolvedValueOnce(mockPest);

            const req = new Request('http://localhost:3000/api/pests', {
                method: 'POST',
                body: JSON.stringify({ nome_comum: 'Cupim', tipo: 'Inseto' })
            });
            const response = await POST(req);
            const json = await response.json();

            expect(response.status).toBe(201);
            expect(json).toEqual(mockPest);
        });
    });
});
