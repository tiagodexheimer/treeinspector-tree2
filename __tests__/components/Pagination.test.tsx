/** @jest-environment jsdom */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Pagination from '@/components/Pagination';

describe('Pagination Component', () => {
    it('does not render when totalPages is 1 or less', () => {
        const { container } = render(
            <Pagination currentPage={1} totalPages={1} onPageChange={jest.fn()} />
        );
        expect(container).toBeEmptyDOMElement();
    });

    it('renders correct page information', () => {
        render(<Pagination currentPage={2} totalPages={5} onPageChange={jest.fn()} />);

        const pageInfo = screen.getByText((content, element) => {
            return element !== null && element.tagName.toLowerCase() === 'p' && content.includes('Página');
        });
        expect(pageInfo).toHaveTextContent('Página 2 de 5');
    });

    it('renders all page numbers when totalPages <= 5', () => {
        render(<Pagination currentPage={1} totalPages={4} onPageChange={jest.fn()} />);

        for (let i = 1; i <= 4; i++) {
            expect(screen.getByRole('button', { name: String(i) })).toBeInTheDocument();
        }
    });

    it('renders ellipses when totalPages > 5', () => {
        render(<Pagination currentPage={1} totalPages={10} onPageChange={jest.fn()} />);

        // Should show 1, 2, 3, ..., 10
        expect(screen.getByRole('button', { name: '1' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: '2' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: '3' })).toBeInTheDocument();
        expect(screen.getByText('...')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: '10' })).toBeInTheDocument();
    });

    it('highlights the current page', () => {
        render(<Pagination currentPage={3} totalPages={5} onPageChange={jest.fn()} />);

        const currentBtn = screen.getByRole('button', { name: '3' });
        expect(currentBtn).toHaveClass('bg-emerald-600');
        expect(currentBtn).toHaveClass('text-white');
    });

    it('disables previous button on first page', () => {
        render(<Pagination currentPage={1} totalPages={5} onPageChange={jest.fn()} />);

        const prevBtn = screen.getByRole('button', { name: /Anterior/i });
        expect(prevBtn).toBeDisabled();
    });

    it('disables next button on last page', () => {
        render(<Pagination currentPage={5} totalPages={5} onPageChange={jest.fn()} />);

        const nextBtn = screen.getByRole('button', { name: /Próxima/i });
        expect(nextBtn).toBeDisabled();
    });

    it('calls onPageChange with expected values when clicking next/prev', async () => {
        const user = userEvent.setup();
        const mockOnPageChange = jest.fn();

        render(<Pagination currentPage={2} totalPages={5} onPageChange={mockOnPageChange} />);

        const prevBtn = screen.getByRole('button', { name: /Anterior/i });
        const nextBtn = screen.getByRole('button', { name: /Próxima/i });

        await user.click(prevBtn);
        expect(mockOnPageChange).toHaveBeenCalledWith(1);

        await user.click(nextBtn);
        expect(mockOnPageChange).toHaveBeenCalledWith(3);
    });

    it('calls onPageChange when a specific page number is clicked', async () => {
        const user = userEvent.setup();
        const mockOnPageChange = jest.fn();

        render(<Pagination currentPage={1} totalPages={5} onPageChange={mockOnPageChange} />);

        const page3Btn = screen.getByRole('button', { name: '3' });
        await user.click(page3Btn);

        expect(mockOnPageChange).toHaveBeenCalledWith(3);
    });
});
