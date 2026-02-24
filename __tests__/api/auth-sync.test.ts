jest.mock('@/app/lib/prisma');

// Mock out our actual auth implementation to avoid the next-auth ESM import chain
jest.mock('@/auth', () => ({
    auth: jest.fn(),
    signIn: jest.fn(),
}));

import { POST as LOGIN_POST } from '@/app/api/auth/mobile-login/route';
import { POST as SYNC_POST } from '@/app/api/sync/route';
import { prisma } from '@/app/lib/prisma';
import { signIn } from '@/auth';

const prismaMock = prisma as any;

// Mock next/headers
jest.mock('next/headers', () => ({
    cookies: () => Promise.resolve({
        getAll: () => [{ name: 'auth.session-token', value: '123' }]
    })
}));

describe('Auth & Sync APIs', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('Mobile Login API (/api/auth/mobile-login)', () => {
        it('should return 400 if credentials missing', async () => {
            const req = new Request('http://localhost:3000/api/auth/mobile-login', {
                method: 'POST', body: JSON.stringify({})
            });
            const response = await LOGIN_POST(req);
            expect(response.status).toBe(400);
        });

        it('should return 401 on invalid credentials', async () => {
            (signIn as jest.Mock).mockRejectedValueOnce({ type: 'CredentialsSignin' });

            const req = new Request('http://localhost:3000/api/auth/mobile-login', {
                method: 'POST', body: JSON.stringify({ email: 'test@test.com', password: 'wrong' })
            });
            const response = await LOGIN_POST(req);
            expect(response.status).toBe(401);
        });

        it('should return 200 and user data on success', async () => {
            (signIn as jest.Mock).mockResolvedValueOnce(undefined);
            prismaMock.user.findUnique.mockResolvedValueOnce({ name: 'Test', role: 'ADMIN' });

            const req = new Request('http://localhost:3000/api/auth/mobile-login', {
                method: 'POST', body: JSON.stringify({ email: 'test@test.com', password: 'pass' })
            });
            const response = await LOGIN_POST(req);
            const json = await response.json();

            expect(response.status).toBe(200);
            expect(json.success).toBe(true);
            expect(json.role).toBe('ADMIN');

            // Check if cookies were set
            // The Next.js NextResponse cookies API is complex to mock fully in Jest, 
            // but we can verify the success path completes.
        });
    });

    describe('Sync API (/api/sync)', () => {
        it('should return 400 if sync_batch is not an array', async () => {
            const req = new Request('http://localhost:3000/api/sync', {
                method: 'POST', body: JSON.stringify({ sync_batch: 'invalid' })
            });
            const response = await SYNC_POST(req);
            expect(response.status).toBe(400);
        });

        it('should process a valid sync batch', async () => {
            // Mock species validation
            prismaMock.species.findMany.mockResolvedValueOnce([{ id_especie: 1 }]);

            // Mock transaction execution
            prismaMock.$transaction.mockImplementation(async (callback: any) => {
                const tx = {
                    species: { findUnique: jest.fn().mockResolvedValue({ nome_comum: 'Jerivá', nome_cientifico: 'S. romanzoffiana' }) },
                    tree: {
                        findUnique: jest.fn().mockResolvedValue(null),
                        findFirst: jest.fn().mockResolvedValue(null),
                        create: jest.fn().mockResolvedValue({ id_arvore: 100 })
                    },
                    inspection: { upsert: jest.fn().mockResolvedValue({}) },
                    $executeRaw: jest.fn().mockResolvedValue({})
                };
                return callback(tx);
            });

            const validPayload = {
                sync_batch: [
                    {
                        tree: {
                            uuid: 'uuid-123',
                            numero_etiqueta: '100',
                            speciesId: 1,
                            lat: -23,
                            lng: -46
                        },
                        inspection: {
                            uuid: 'insp-123',
                            data_inspecao: new Date().toISOString()
                        }
                    }
                ]
            };

            const req = new Request('http://localhost:3000/api/sync', {
                method: 'POST', body: JSON.stringify(validPayload)
            });
            const response = await SYNC_POST(req);
            const json = await response.json();

            expect(response.status).toBe(200);
            expect(json.success).toBe(true);
            expect(json.processed).toBe(1);
        });
    });
});
