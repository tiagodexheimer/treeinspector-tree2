jest.mock('@/app/lib/prisma');
import { GET, POST } from '@/app/api/trees/route';
import { GET as GET_LATEST_TAG } from '@/app/api/trees/latest-tag/route';
import { prisma } from '@/app/lib/prisma';

const prismaMock = prisma as any;

jest.mock('@/auth', () => ({
    auth: jest.fn(),
}));
import { auth } from '@/auth';

describe('Trees API (/api/trees)', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('GET', () => {
        it('should return trees for map view (no filters)', async () => {
            const mockTrees = [
                { id: 1, lat: -23.5, lng: -46.6, lbl: '001', sp: 'Bordo', st: 'Regular', sev: 0, pc: 0 }
            ];
            prismaMock.$queryRaw.mockResolvedValueOnce(mockTrees);

            const req = new Request('http://localhost:3000/api/trees');
            const response = await GET(req);
            const json = await response.json();

            expect(response.status).toBe(200);
            expect(json).toEqual(mockTrees);
            expect(response.headers.get('Cache-Control')).toContain('public');
            expect(prismaMock.$queryRaw).toHaveBeenCalledTimes(1);
        });

        it('should return paginated list when using page filter', async () => {
            const mockTrees = [{ id_arvore: 1, species: { nome_comum: 'Bordo' } }];
            prismaMock.tree.findMany.mockResolvedValueOnce(mockTrees);
            prismaMock.tree.count.mockResolvedValueOnce(1);

            const req = new Request('http://localhost:3000/api/trees?page=1');
            const response = await GET(req);
            const json = await response.json();

            expect(response.status).toBe(200);
            expect(json.data).toEqual(mockTrees);
            expect(json.pagination.total).toBe(1);
        });

        it('should return trees around a radius (mobile geoloc)', async () => {
            const mockTrees = [{ id: 1, lat: -23.5, lng: -46.6, distance: 10 }];
            prismaMock.$queryRaw.mockResolvedValueOnce(mockTrees);

            const req = new Request('http://localhost:3000/api/trees?lat=-23.5&lng=-46.6&radius=100');
            const response = await GET(req);
            const json = await response.json();

            expect(response.status).toBe(200);
            expect(json).toEqual(mockTrees);
        });
    });

    describe('POST', () => {
        it('should return 401 if unauthenticated', async () => {
            (auth as jest.Mock).mockResolvedValueOnce(null);
            const req = new Request('http://localhost:3000/api/trees', { method: 'POST', body: JSON.stringify({}) });
            const response = await POST(req);
            expect(response.status).toBe(401);
        });

        it('should return 403 if insufficient role', async () => {
            (auth as jest.Mock).mockResolvedValueOnce({ user: { role: 'OPERACIONAL' } });
            const req = new Request('http://localhost:3000/api/trees', { method: 'POST', body: JSON.stringify({}) });
            const response = await POST(req);
            expect(response.status).toBe(403);
        });

        it('should create a tree successfully (mocking transaction)', async () => {
            (auth as jest.Mock).mockResolvedValueOnce({ user: { role: 'GESTOR' } });

            // Mock the transaction returning the ID
            prismaMock.$transaction.mockResolvedValueOnce(99);

            // Mock the findUnique called after transaction
            const expectedTree = { id_arvore: 99, speciesId: 1 };
            prismaMock.tree.findUnique.mockResolvedValueOnce(expectedTree);

            const payload = {
                speciesId: 1,
                numero_etiqueta: "99",
                rua: "Test St",
                lat: 10,
                lng: 20
            };

            const req = new Request('http://localhost:3000/api/trees', {
                method: 'POST',
                body: JSON.stringify(payload)
            });

            const response = await POST(req);
            const json = await response.json();

            expect(response.status).toBe(201);
            expect(json).toEqual(expectedTree);
            expect(prismaMock.$transaction).toHaveBeenCalledTimes(1);
            expect(prismaMock.tree.findUnique).toHaveBeenCalledTimes(1);
        });
    });
});

describe('Latest Tag API (/api/trees/latest-tag)', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return next tag when results are found', async () => {
        prismaMock.$queryRaw.mockResolvedValueOnce([{ numero_etiqueta: '100' }]);

        const response = await GET_LATEST_TAG();
        const json = await response.json();

        expect(response.status).toBe(200);
        expect(json).toEqual({ latest_tag: '100', next_tag: '101' });
    });

    it('should return 0 and 1 when no tags exist', async () => {
        prismaMock.$queryRaw.mockResolvedValueOnce([]); // empty table

        const response = await GET_LATEST_TAG();
        const json = await response.json();

        expect(response.status).toBe(200);
        expect(json).toEqual({ latest_tag: '0', next_tag: '1' });
    });
});
