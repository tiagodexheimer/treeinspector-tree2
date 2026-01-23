interface AlphabetFilterProps {
    selectedLetter: string;
    onLetterSelect: (letter: string) => void;
    availableLetters?: string[];
}

export default function AlphabetFilter({ selectedLetter, onLetterSelect, availableLetters }: AlphabetFilterProps) {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

    return (
        <div className="flex flex-wrap gap-1 mb-6 p-4 bg-white rounded-xl shadow-sm border border-gray-100">
            <button
                onClick={() => onLetterSelect('')}
                className={`px-3 py-1 text-sm font-medium rounded-lg transition-colors ${selectedLetter === ''
                        ? 'bg-emerald-600 text-white shadow-md shadow-emerald-200'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
            >
                Todos
            </button>
            {alphabet.map((letter) => {
                const isDisabled = availableLetters && !availableLetters.includes(letter);
                return (
                    <button
                        key={letter}
                        onClick={() => !isDisabled && onLetterSelect(letter)}
                        disabled={isDisabled}
                        className={`w-8 h-8 flex items-center justify-center text-sm font-medium rounded-lg transition-colors ${selectedLetter === letter
                                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-200'
                                : isDisabled
                                    ? 'text-gray-300 cursor-not-allowed bg-gray-50'
                                    : 'text-gray-600 hover:bg-gray-100'
                            }`}
                    >
                        {letter}
                    </button>
                );
            })}
        </div>
    );
}
