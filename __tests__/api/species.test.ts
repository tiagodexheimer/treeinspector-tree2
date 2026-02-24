jest.mock('@/app/lib/prisma');
import { GET, POST } from '@/app/api/species/route';
import { prisma } from '@/app/lib/prisma';
const prismaMock = prisma as any;

// Mock the auth module
jest.mock('@/auth', () => ({
    auth: jest.fn(),
}));
import { auth } from '@/auth';

describe('Species API', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('GET', () => {
        it('should return a list of species and pagination data', async () => {
            // Mock prisma findMany and count
            const mockSpecies = [
                { id_especie: 1, nome_comum: 'Bordo', nome_cientifico: 'Acer palmatum' },
                { id_especie: 2, nome_comum: 'Carvalho', nome_cientifico: 'Quercus robur' },
            ];
            prismaMock.species.findMany.mockResolvedValue(mockSpecies as any);
            prismaMock.species.count.mockResolvedValue(2);

            // Create mock request
            const req = new Request('http://localhost:3000/api/species?page=1&limit=10');

            // Call GET handler
            const response = await GET(req);
            const json = await response.json();

            // Assertions
            expect(response.status).toBe(200);
            expect(json.data).toEqual(mockSpecies);
            expect(json.pagination).toEqual({
                total: 2,
                page: 1,
                limit: 10,
                pages: 1,
            });
            expect(prismaMock.species.findMany).toHaveBeenCalledTimes(1);
            expect(prismaMock.species.count).toHaveBeenCalledTimes(1);
        });

        it('should return species based on letter filter', async () => {
            const mockSpecies = [{ id_especie: 1, nome_comum: 'Amendoeira', nome_cientifico: 'Prunus dulcis' }];
            prismaMock.$queryRaw.mockResolvedValueOnce(mockSpecies as any) // for species
                .mockResolvedValueOnce([{ count: BigInt(1) }] as any); // for count

            const req = new Request('http://localhost:3000/api/species?letter=A');
            const response = await GET(req);
            const json = await response.json();

            expect(response.status).toBe(200);
            expect(json.data).toEqual(mockSpecies);
            expect(json.pagination.total).toBe(1);
            expect(prismaMock.$queryRaw).toHaveBeenCalledTimes(2);
        });

        it('should return initials when initials=true', async () => {
            const mockInitials = [{ letter: 'A' }, { letter: 'B' }];
            prismaMock.$queryRaw.mockResolvedValueOnce(mockInitials as any);

            const req = new Request('http://localhost:3000/api/species?initials=true');
            const response = await GET(req);
            const json = await response.json();

            expect(response.status).toBe(200);
            expect(json).toEqual(['A', 'B']);
            expect(prismaMock.$queryRaw).toHaveBeenCalledTimes(1);
        });
    });

    describe('POST', () => {
        it('should return 401 if not authenticated', async () => {
            // Mock auth returning null
            (auth as jest.Mock).mockResolvedValueOnce(null);

            const req = new Request('http://localhost:3000/api/species', {
                method: 'POST',
                body: JSON.stringify({ nome_comum: 'Bordo', nome_cientifico: 'Acer palmatum' }),
            });

            const response = await POST(req);
            expect(response.status).toBe(401);
            const json = await response.json();
            expect(json.error).toBe('Não autenticado');
        });

        it('should return 403 if unauthorized role', async () => {
            // Mock auth returning OPERACIONAL user (not allowed to create species)
            (auth as jest.Mock).mockResolvedValueOnce({ user: { role: 'OPERACIONAL' } });

            const req = new Request('http://localhost:3000/api/species', {
                method: 'POST',
                body: JSON.stringify({ nome_comum: 'Bordo', nome_cientifico: 'Acer palmatum' }),
            });

            const response = await POST(req);
            expect(response.status).toBe(403);
            const json = await response.json();
            expect(json.error).toBe('Não autorizado');
        });

        it('should create species successfully if ADMIN', async () => {
            // Mock auth returning ADMIN user
            (auth as jest.Mock).mockResolvedValueOnce({ user: { role: 'ADMIN' } });

            const newSpecies = {
                id_especie: 1,
                nome_comum: 'Bordo Teste',
                nome_cientifico: 'Acer palmatum test',
                family: null,
                native_status: null,
                porte: null,
                growth_rate: null,
                max_height_m: null,
                description: null,
                gbif_id: null,
                plantnet_id: null,
                created_at: new Date(),
                updated_at: new Date()
            };
            prismaMock.species.create.mockResolvedValueOnce(newSpecies as any);

            const req = new Request('http://localhost:3000/api/species', {
                method: 'POST',
                body: JSON.stringify({
                    nome_comum: 'Bordo Teste',
                    nome_cientifico: 'Acer palmatum test',
                }),
            });

            const response = await POST(req);
            expect(response.status).toBe(201);

            // Note: date fields might fail toEqual, but we can verify structure
            expect(prismaMock.species.create).toHaveBeenCalledWith({
                data: {
                    nome_comum: 'Bordo Teste',
                    nome_cientifico: 'Acer palmatum test',
                    family: null,
                    native_status: null,
                    porte: null,
                    growth_rate: null,
                    max_height_m: null,
                    description: null
                }
            });
        });

        it('should return 400 if scientific name already exists', async () => {
            // Mock auth returning ADMIN user
            (auth as jest.Mock).mockResolvedValue({ user: { role: 'ADMIN' } });

            const error = new Error('Unique constraint failed');
            (error as any).code = 'P2002';
            prismaMock.species.create.mockRejectedValueOnce(error);

            const req = new Request('http://localhost:3000/api/species', {
                method: 'POST',
                body: JSON.stringify({ nome_comum: 'Bordo', nome_cientifico: 'Acer palmatum' }),
            });

            const response = await POST(req);
            expect(response.status).toBe(400);
            const json = await response.json();
            expect(json.error).toBe('Nome científico já existe');
        });
    });
});
