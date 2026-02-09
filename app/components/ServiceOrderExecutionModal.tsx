'use client';

import { useState, useRef } from 'react';
import { EXECUTION_CHECKLIST_ITEMS } from '../lib/checklistConstants';

interface ServiceOrderExecutionModalProps {
    isOpen: boolean;
    onClose: () => void;
    action: 'start' | 'finalize' | 'cancel' | null;
    serviceOrderId: number;
    initialStartTime?: string;
    onSuccess: () => void;
}

export default function ServiceOrderExecutionModal({
    isOpen,
    onClose,
    action,
    serviceOrderId,
    initialStartTime,
    onSuccess
}: ServiceOrderExecutionModalProps) {
    const [isLoading, setIsLoading] = useState(false);

    // Start State
    const [checklist, setChecklist] = useState<Record<string, boolean>>({});
    const [startPhotos, setStartPhotos] = useState<File[]>([]);
    const [startPhotoUrls, setStartPhotoUrls] = useState<string[]>([]);

    // Finalize State
    const [description, setDescription] = useState('');
    const [finalizePhotos, setFinalizePhotos] = useState<File[]>([]);
    const [finalizePhotoUrls, setFinalizePhotoUrls] = useState<{ uri: string, category: string }[]>([]);
    const [materials, setMaterials] = useState<{ name: string; quantity: string; unit: string }[]>([]);
    const [newMaterial, setNewMaterial] = useState({ name: '', quantity: '', unit: 'un' });
    const [durationHours, setDurationHours] = useState('0');
    const [durationMinutes, setDurationMinutes] = useState('0');
    const [startDateTime, setStartDateTime] = useState('');

    // Effect to set initial start time when modal opens
    if (isOpen && action === 'finalize' && !startDateTime && initialStartTime) {
        // Convert ISO string to local datetime-local format (YYYY-MM-DDTHH:mm)
        const date = new Date(initialStartTime);
        const localIso = new Date(date.getTime() - (date.getTimezoneOffset() * 60000)).toISOString().slice(0, 16);
        setStartDateTime(localIso);
    }

    // Cancel State
    const [cancelReason, setCancelReason] = useState('');

    const fileInputRef = useRef<HTMLInputElement>(null);

    if (!isOpen || !action) return null;

    const handlePhotoUpload = async (files: FileList | null, type: 'start' | 'finalize') => {
        if (!files) return;

        setIsLoading(true);
        const uploadedUrls: string[] = [];

        try {
            for (let i = 0; i < files.length; i++) {
                const formData = new FormData();
                formData.append('file', files[i]);

                const res = await fetch('/api/upload', {
                    method: 'POST',
                    body: formData
                });

                if (res.ok) {
                    const data = await res.json();
                    uploadedUrls.push(data.url);
                }
            }

            if (type === 'start') {
                setStartPhotoUrls(prev => [...prev, ...uploadedUrls]);
            } else {
                const newPhotos = uploadedUrls.map(url => ({ uri: url, category: 'Depois' }));
                setFinalizePhotoUrls(prev => [...prev, ...newPhotos]);
            }
        } catch (error) {
            console.error('Upload failed', error);
            alert('Erro ao fazer upload das imagens.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleStartOrder = async () => {
        const mandatoryItems = EXECUTION_CHECKLIST_ITEMS.filter(i => i.isMandatory);
        const allChecked = mandatoryItems.every(i => checklist[i.id]);

        if (!allChecked) {
            alert('Todos os itens obrigatórios do checklist devem ser marcados.');
            return;
        }

        if (startPhotoUrls.length === 0) {
            alert('É necessário anexar pelo menos uma foto do "Antes".');
            return;
        }

        setIsLoading(true);
        try {
            const res = await fetch(`/api/service-orders/${serviceOrderId}/start`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    checklist,
                    photosBefore: startPhotoUrls
                })
            });

            if (res.ok) {
                alert('Execução iniciada com sucesso!');
                onSuccess();
                onClose();
            } else {
                const data = await res.json();
                alert(`Erro: ${data.error || 'Falha ao iniciar'}`);
            }
        } catch (e) {
            console.error(e);
            alert('Erro ao iniciar ordem de serviço');
        } finally {
            setIsLoading(false);
        }
    };

    const handleFinalizeOrder = async () => {
        if (!description.trim()) {
            alert('A descrição do serviço é obrigatória.');
            return;
        }
        if (finalizePhotoUrls.length === 0) {
            alert('É necessário anexar fotos do "Depois".');
            return;
        }

        setIsLoading(true);
        try {
            const formattedMaterials = materials.map(m => ({
                ...m,
                quantity: parseFloat(m.quantity)
            }));

            const res = await fetch(`/api/service-orders/${serviceOrderId}/finalize`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    description,
                    photos: finalizePhotoUrls,
                    materials: formattedMaterials,
                    duration: {
                        hours: parseInt(durationHours) || 0,
                        minutes: parseInt(durationMinutes) || 0
                    },
                    customStartTime: startDateTime ? new Date(startDateTime).toISOString() : null
                })
            });

            if (res.ok) {
                alert('Ordem de serviço finalizada e enviada para revisão!');
                onSuccess();
                onClose();
            } else {
                const data = await res.json();
                alert(`Erro: ${data.error || 'Falha ao finalizar'}`);
            }
        } catch (e) {
            console.error(e);
            alert('Erro ao finalizar ordem de serviço');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCancelOrder = async () => {
        if (!cancelReason.trim()) {
            alert('O motivo do cancelamento é obrigatório.');
            return;
        }

        setIsLoading(true);
        try {
            const res = await fetch(`/api/service-orders/${serviceOrderId}/cancel`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ reason: cancelReason })
            });

            if (res.ok) {
                alert('Ordem de serviço cancelada/interrompida.');
                onSuccess();
                onClose();
            } else {
                const data = await res.json();
                alert(`Erro: ${data.error || 'Falha ao cancelar'}`);
            }
        } catch (e) {
            console.error(e);
            alert('Erro ao cancelar ordem de serviço');
        } finally {
            setIsLoading(false);
        }
    };

    const addMaterial = () => {
        if (newMaterial.name && newMaterial.quantity) {
            setMaterials([...materials, newMaterial]);
            setNewMaterial({ name: '', quantity: '', unit: 'un' });
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 overflow-y-auto">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
                <div className="p-4 border-b flex justify-between items-center bg-gray-50 rounded-t-lg">
                    <h2 className="text-xl font-bold text-gray-800">
                        {action === 'start' && 'Iniciar Execução'}
                        {action === 'finalize' && 'Finalizar Execução'}
                        {action === 'cancel' && 'Interromper/Cancelar OS'}
                    </h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl">&times;</button>
                </div>

                <div className="p-6 overflow-y-auto flex-1">
                    {action === 'start' && (
                        <div className="space-y-6">
                            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                                <p className="text-sm text-blue-800 font-medium">Confira os itens de segurança obrigatórios para iniciar o serviço.</p>
                            </div>

                            {/* Checklist Groups */}
                            {Object.entries(EXECUTION_CHECKLIST_ITEMS.reduce((acc, item) => {
                                (acc[item.category] = acc[item.category] || []).push(item);
                                return acc;
                            }, {} as Record<string, typeof EXECUTION_CHECKLIST_ITEMS>)).map(([category, items]) => (
                                <div key={category}>
                                    <h3 className="font-bold text-gray-700 mb-2 uppercase text-xs tracking-wider border-b pb-1">{category}</h3>
                                    <div className="space-y-2">
                                        {items.map(item => (
                                            <label key={item.id} className="flex items-start gap-3 p-2 hover:bg-gray-50 rounded cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    className="mt-1 w-4 h-4 text-green-600 rounded focus:ring-green-500"
                                                    checked={!!checklist[item.id]}
                                                    onChange={(e) => setChecklist(prev => ({ ...prev, [item.id]: e.target.checked }))}
                                                />
                                                <div className="text-sm">
                                                    <span className="text-gray-800">{item.label}</span>
                                                    {!item.isMandatory && <span className="text-gray-400 ml-1 text-xs">(Opcional)</span>}
                                                </div>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            ))}

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Fotos do Local (Antes do serviço)</label>
                                <input
                                    type="file"
                                    multiple
                                    accept="image/*"
                                    onChange={(e) => handlePhotoUpload(e.target.files, 'start')}
                                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                />
                                {startPhotoUrls.length > 0 && (
                                    <div className="flex gap-2 mt-2 overflow-x-auto pb-2">
                                        {startPhotoUrls.map((url, idx) => (
                                            <img key={idx} src={url} alt="Preview" className="h-20 w-20 object-cover rounded border" />
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {action === 'finalize' && (
                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Descrição do Serviço Realizado</label>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    className="w-full p-2 border border-gray-300 rounded focus:ring-green-500 focus:border-green-500"
                                    rows={4}
                                    placeholder="Descreva detalhadamente o que foi feito..."
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Data/Hora de Início</label>
                                <input
                                    type="datetime-local"
                                    value={startDateTime}
                                    onChange={(e) => setStartDateTime(e.target.value)}
                                    className="w-full p-2 border border-gray-300 rounded focus:ring-green-500 focus:border-green-500"
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    Se necessário, ajuste o horário que o serviço realmente começou.
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Duração Aproximada</label>
                                <div className="flex gap-4 items-center">
                                    <div className="flex flex-col">
                                        <label className="text-xs text-gray-500 mb-1">Horas</label>
                                        <input
                                            type="number"
                                            min="0"
                                            value={durationHours}
                                            onChange={(e) => setDurationHours(e.target.value)}
                                            className="w-20 p-2 border border-gray-300 rounded focus:ring-green-500 focus:border-green-500"
                                        />
                                    </div>
                                    <div className="flex flex-col">
                                        <label className="text-xs text-gray-500 mb-1">Minutos</label>
                                        <input
                                            type="number"
                                            min="0"
                                            max="59"
                                            value={durationMinutes}
                                            onChange={(e) => setDurationMinutes(e.target.value)}
                                            className="w-20 p-2 border border-gray-300 rounded focus:ring-green-500 focus:border-green-500"
                                        />
                                    </div>
                                    <div className="text-sm text-gray-500 mt-4 italic">
                                        Informe quanto tempo durou o manejo.
                                    </div>
                                </div>
                            </div>


                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Consumo de Materiais</label>
                                <div className="flex gap-2 mb-2">
                                    <input
                                        type="text"
                                        placeholder="Material"
                                        className="flex-1 p-2 border rounded text-sm"
                                        value={newMaterial.name}
                                        onChange={(e) => setNewMaterial({ ...newMaterial, name: e.target.value })}
                                    />
                                    <input
                                        type="number"
                                        placeholder="Qtd"
                                        className="w-20 p-2 border rounded text-sm"
                                        value={newMaterial.quantity}
                                        onChange={(e) => setNewMaterial({ ...newMaterial, quantity: e.target.value })}
                                    />
                                    <input
                                        type="text"
                                        placeholder="Un"
                                        className="w-16 p-2 border rounded text-sm"
                                        value={newMaterial.unit}
                                        onChange={(e) => setNewMaterial({ ...newMaterial, unit: e.target.value })}
                                    />
                                    <button
                                        onClick={addMaterial}
                                        type="button"
                                        className="bg-gray-100 px-3 py-2 rounded hover:bg-gray-200"
                                    >
                                        +
                                    </button>
                                </div>
                                {materials.length > 0 && (
                                    <div className="bg-gray-50 p-2 rounded text-sm space-y-1">
                                        {materials.map((m, idx) => (
                                            <div key={idx} className="flex justify-between">
                                                <span>{m.name}</span>
                                                <span className="font-mono text-gray-600">{m.quantity} {m.unit}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Fotos do Resultado (Depois)</label>
                                <input
                                    type="file"
                                    multiple
                                    accept="image/*"
                                    onChange={(e) => handlePhotoUpload(e.target.files, 'finalize')}
                                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
                                />
                                {finalizePhotoUrls.length > 0 && (
                                    <div className="flex gap-2 mt-2 overflow-x-auto pb-2">
                                        {finalizePhotoUrls.map((p, idx) => (
                                            <img key={idx} src={p.uri} alt="Preview" className="h-20 w-20 object-cover rounded border" />
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {action === 'cancel' && (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Motivo da Interrupção/Cancelamento</label>
                                <textarea
                                    value={cancelReason}
                                    onChange={(e) => setCancelReason(e.target.value)}
                                    className="w-full p-2 border border-gray-300 rounded focus:ring-red-500 focus:border-red-500"
                                    rows={4}
                                    placeholder="Explique o motivo..."
                                />
                            </div>
                        </div>
                    )}
                </div>

                <div className="p-4 border-t bg-gray-50 rounded-b-lg flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-gray-700 font-medium hover:bg-gray-200 rounded transition"
                        disabled={isLoading}
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={
                            action === 'start' ? handleStartOrder :
                                action === 'finalize' ? handleFinalizeOrder :
                                    handleCancelOrder
                        }
                        className={`px-6 py-2 text-white font-bold rounded shadow-sm transition flex items-center gap-2 ${isLoading ? 'opacity-70 cursor-not-allowed' : ''
                            } ${action === 'start' ? 'bg-green-600 hover:bg-green-700' :
                                action === 'finalize' ? 'bg-blue-600 hover:bg-blue-700' :
                                    'bg-red-600 hover:bg-red-700'
                            }`}
                        disabled={isLoading}
                    >
                        {isLoading && <span className="animate-spin text-white">⏳</span>}
                        {action === 'start' && 'Confirmar Início'}
                        {action === 'finalize' && 'Enviar para Revisão'}
                        {action === 'cancel' && 'Confirmar Cancelamento'}
                    </button>
                </div>
            </div>
        </div>
    );
}
