'use client';

import { useState } from 'react';

interface ServiceOrderAdjustmentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (notes: string) => void;
}

export default function ServiceOrderAdjustmentModal({ isOpen, onClose, onSubmit }: ServiceOrderAdjustmentModalProps) {
    const [notes, setNotes] = useState('');

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
                <div className="mb-4 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-100 text-orange-600">
                        <span className="text-xl">📝</span>
                    </div>
                    <h2 className="text-xl font-bold text-gray-800">Solicitar Ajustes</h2>
                </div>

                <p className="mb-4 text-sm text-gray-500">
                    Descreva detalhadamente quais informações precisam ser corrigidas ou adicionadas pelo técnico.
                </p>

                <div className="space-y-4">
                    <div>
                        <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-gray-400">
                            Notas de Ajuste
                        </label>
                        <textarea
                            className="w-full rounded-xl border border-gray-200 p-3 text-sm focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none transition"
                            rows={5}
                            placeholder="Ex: Por favor, adicione uma foto melhor do tronco e corrija o tipo de material utilizado..."
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                        />
                    </div>
                </div>

                <div className="mt-8 flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 rounded-xl border border-gray-200 py-3 text-sm font-bold text-gray-500 hover:bg-gray-50 transition"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={() => {
                            if (!notes.trim()) {
                                alert('Por favor, descreva os ajustes necessários.');
                                return;
                            }
                            onSubmit(notes);
                            setNotes('');
                        }}
                        className="flex-1 rounded-xl bg-orange-600 py-3 text-sm font-bold text-white hover:bg-orange-700 shadow-lg shadow-orange-200 transition"
                    >
                        Enviar Solicitação
                    </button>
                </div>
            </div>
        </div>
    );
}
