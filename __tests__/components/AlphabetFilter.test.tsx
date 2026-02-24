/** @jest-environment jsdom */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AlphabetFilter from '@/components/AlphabetFilter';

describe('AlphabetFilter Component', () => {
    it('renders "Todos" button and all alphabet letters', () => {
        const mockOnLetterSelect = jest.fn();
        render(<AlphabetFilter selectedLetter="" onLetterSelect={mockOnLetterSelect} />);

        // Check if "Todos" button exists
        expect(screen.getByText('Todos')).toBeInTheDocument();

        // Check if A-Z buttons exist
        const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
        alphabet.forEach(letter => {
            expect(screen.getByText(letter)).toBeInTheDocument();
        });
    });

    it('highlights the selected letter', () => {
        const mockOnLetterSelect = jest.fn();
        render(<AlphabetFilter selectedLetter="M" onLetterSelect={mockOnLetterSelect} />);

        const mButton = screen.getByText('M');
        expect(mButton).toHaveClass('bg-emerald-600');
        expect(mButton).toHaveClass('text-white');

        // "Todos" should not be highlighted
        const todosButton = screen.getByText('Todos');
        expect(todosButton).not.toHaveClass('bg-emerald-600');
    });

    it('highlights "Todos" when selectedLetter is empty', () => {
        const mockOnLetterSelect = jest.fn();
        render(<AlphabetFilter selectedLetter="" onLetterSelect={mockOnLetterSelect} />);

        const todosButton = screen.getByText('Todos');
        expect(todosButton).toHaveClass('bg-emerald-600');
        expect(todosButton).toHaveClass('text-white');
    });

    it('calls onLetterSelect when a letter is clicked', async () => {
        const user = userEvent.setup();
        const mockOnLetterSelect = jest.fn();
        render(<AlphabetFilter selectedLetter="" onLetterSelect={mockOnLetterSelect} />);

        const tButton = screen.getByText('T');
        await user.click(tButton);

        expect(mockOnLetterSelect).toHaveBeenCalledTimes(1);
        expect(mockOnLetterSelect).toHaveBeenCalledWith('T');
    });

    it('disables letters not in availableLetters array', async () => {
        const user = userEvent.setup();
        const mockOnLetterSelect = jest.fn();
        const available = ['A', 'B', 'C'];

        render(
            <AlphabetFilter
                selectedLetter=""
                onLetterSelect={mockOnLetterSelect}
                availableLetters={available}
            />
        );

        // A should be enabled
        const aButton = screen.getByText('A');
        expect(aButton).not.toBeDisabled();

        // Z should be disabled
        const zButton = screen.getByText('Z');
        expect(zButton).toBeDisabled();
        expect(zButton).toHaveClass('cursor-not-allowed');

        // Clicking disabled button should not call handler
        await user.click(zButton);
        expect(mockOnLetterSelect).not.toHaveBeenCalled();
    });
});
