/** @jest-environment jsdom */
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SpeciesPage from '@/app/settings/species/page';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

// Mock Next.js hooks
jest.mock('next-auth/react', () => ({
    useSession: jest.fn(),
}));

jest.mock('next/navigation', () => ({
    useRouter: jest.fn(),
}));

describe('SpeciesPage', () => {
    const mockRouterPush = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
        (useRouter as jest.Mock).mockReturnValue({ push: mockRouterPush });

        // Mock global fetch
        global.fetch = jest.fn();
    });

    it('shows loading state initially', () => {
        (useSession as jest.Mock).mockReturnValue({ status: 'loading', data: null });
        const { container } = render(<SpeciesPage />);
        expect(container.querySelector('.animate-spin')).toBeInTheDocument();
    });

    it('redirects to login if unauthenticated', () => {
        (useSession as jest.Mock).mockReturnValue({ status: 'unauthenticated', data: null });
        render(<SpeciesPage />);
        expect(mockRouterPush).toHaveBeenCalledWith('/login');
    });

    it('redirects to home if user role is not authorized', () => {
        (useSession as jest.Mock).mockReturnValue({
            status: 'authenticated',
            data: { user: { role: 'VISITANTE' } }
        });
        render(<SpeciesPage />);
        expect(mockRouterPush).toHaveBeenCalledWith('/');
    });

    it('renders the species list correctly for an ADMIN', async () => {
        (useSession as jest.Mock).mockReturnValue({
            status: 'authenticated',
            data: { user: { role: 'ADMIN' } }
        });

        // Mock fetch responses
        (global.fetch as jest.Mock).mockImplementation((url: string) => {
            if (url.includes('initials=true')) {
                return Promise.resolve({
                    json: () => Promise.resolve(['A', 'B', 'M', 'P'])
                });
            }
            if (url.includes('/api/species')) {
                return Promise.resolve({
                    json: () => Promise.resolve({
                        data: [
                            {
                                id_especie: 1,
                                nome_comum: 'Pau-Brasil',
                                nome_cientifico: 'Paubrasilia echinata',
                                native_status: 'Nativa',
                                porte: 'Medio'
                            },
                            {
                                id_especie: 2,
                                nome_comum: 'Mangueira',
                                nome_cientifico: 'Mangifera indica',
                                native_status: 'Exótica',
                                porte: 'Grande'
                            }
                        ],
                        pagination: { pages: 1 }
                    })
                });
            }
            return Promise.resolve({});
        });

        render(<SpeciesPage />);

        // Wait for table to populate
        await waitFor(() => {
            expect(screen.getByText('Pau-Brasil')).toBeInTheDocument();
            expect(screen.getByText('Mangueira')).toBeInTheDocument();
        });

        // Check columns
        expect(screen.getByText('Paubrasilia echinata')).toBeInTheDocument();
        expect(screen.getByText('Nativa')).toBeInTheDocument();
        expect(screen.getByText('Exótica')).toBeInTheDocument();

        // Admin should see add and edit actions
        expect(screen.getByText('+ Adicionar Espécie')).toBeInTheDocument();
        expect(screen.getAllByText('Editar').length).toBe(2);
        expect(screen.getAllByText('Deletar').length).toBe(2);
    });

    it('triggers a new fetch when search input is typed', async () => {
        const user = userEvent.setup();
        (useSession as jest.Mock).mockReturnValue({
            status: 'authenticated',
            data: { user: { role: 'INSPETOR' } }
        });

        (global.fetch as jest.Mock).mockImplementation((url: string) => {
            if (url.includes('initials=true')) {
                return Promise.resolve({
                    json: () => Promise.resolve(['A', 'B', 'M', 'P'])
                });
            }
            return Promise.resolve({
                json: () => Promise.resolve({ data: [], pagination: { pages: 1 } })
            });
        });

        render(<SpeciesPage />);

        const searchInput = screen.getByPlaceholderText('Buscar espécie...');
        await user.type(searchInput, 'Manga');

        await waitFor(() => {
            // Check that fetch was called with the search query
            expect((global.fetch as jest.Mock).mock.calls.some(call => call[0].includes('q=Manga'))).toBe(true);
        });
    });
});
