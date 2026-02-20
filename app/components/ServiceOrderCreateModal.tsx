import { useState } from 'react';

interface ServiceOrderCreateModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: any) => Promise<void>;
    treeCount: number;
    initialData?: {
        serviceType?: string;
        serviceSubtypes?: string[];
        description?: string;
        priority?: string;
        managementActionId?: number;
    };
}

const SERVICE_TYPES = [
    'Poda',
    'Remoção',
    'Substituição',
    'Transplante',
    'Outros'
];

const PODA_SUBTYPES = [
    'Levantamento de copa',
    'Afastamento de edificação',
    'Afastamento da rede elétrica',
    'Melhoria da iluminação pública',
    'Livramento de placas de sinalização',
    'Limpeza',
    'Conformação',
    'Redução de copa'
];

export default function ServiceOrderCreateModal({ isOpen, onClose, onSubmit, treeCount, initialData }: ServiceOrderCreateModalProps) {
    const [loading, setLoading] = useState(false);

    // Initialize with props or defaults
    const [serviceType, setServiceType] = useState<string>(initialData?.serviceType || '');
    const [subtypes, setSubtypes] = useState<string[]>(initialData?.serviceSubtypes || []);
    const [description, setDescription] = useState(initialData?.description || '');
    const [priority, setPriority] = useState<string>(initialData?.priority || 'Moderada');

    // Update state when initialData changes (e.g. reopening modal with different item)
    // We use a key={...} strategy in parent usually, or useEffect here.
    // Let's use useEffect to reset when isOpen becomes true? Or rely on parent re-rendering.
    // Better: Parent should control instance or key, but useEffect is safer here.

    // Actually simpler: initialize state lazily or strictly from props if open.
    // But since this is a controlled modal often kept mounted, use useEffect to sync when opening.
    // However, hooks order matters. Let's keep it simple: assume parent forces re-mount or we add a reset effect.
    // For now, let's add a useEffect that updates state when `isOpen` becomes true, if we want to support reusing the modal.
    // Or just updating when `initialData` changes.

    // Changing state directly in render logic is bad.
    // Let's use a key in parent to reset state, OR useEffect here.
    // Let's stick to initial state for now, assuming parent might unmount it or we rely on re-init when props change.
    // Actually, if we use the same modal instance, state won't reset.
    // Let's add useEffect.

    const [prevInitialData, setPrevInitialData] = useState(initialData);
    if (initialData !== prevInitialData) {
        setPrevInitialData(initialData);
        setServiceType(initialData?.serviceType || '');
        setSubtypes(initialData?.serviceSubtypes || []);
        setDescription(initialData?.description || '');
        setPriority(initialData?.priority || 'Moderada');
    }

    if (!isOpen) return null;

    const handleSubtypeChange = (subtype: string) => {
        if (subtypes.includes(subtype)) {
            setSubtypes(subtypes.filter(s => s !== subtype));
        } else {
            setSubtypes([...subtypes, subtype]);
        }
    };

    const handleSubmit = async () => {
        if (!serviceType) {
            alert('Selecione um tipo de serviço');
            return;
        }

        setLoading(true);
        try {
            await onSubmit({
                serviceType,
                serviceSubtypes: subtypes,
                description,
                priority,
                managementActionId: initialData?.managementActionId // Pass ID back
            });
            onClose();
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[9999] flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-green-50 rounded-t-lg">
                    <h2 className="text-xl font-bold text-green-800">Nova Ordem de Serviço</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 font-bold text-2xl">&times;</button>
                </div>

                <div className="p-6 space-y-6">
                    <div className="bg-blue-50 border border-blue-100 p-3 rounded text-sm text-blue-700">
                        Criando O.S. para <strong>{treeCount}</strong> árvore(s).
                    </div>

                    {/* Service Type */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Tipo de Serviço</label>
                        <div className="grid grid-cols-2 gap-2">
                            {SERVICE_TYPES.map(type => (
                                <label key={type} className={`flex items-center p-3 border rounded cursor-pointer transition ${serviceType === type ? 'bg-green-100 border-green-500 ring-1 ring-green-500' : 'hover:bg-gray-50'
                                    }`}>
                                    <input
                                        type="radio"
                                        name="serviceType"
                                        value={type}
                                        checked={serviceType === type}
                                        onChange={(e) => {
                                            setServiceType(e.target.value);
                                            if (e.target.value !== 'Poda') setSubtypes([]);
                                        }}
                                        className="h-4 w-4 text-green-600"
                                    />
                                    <span className="ml-2 text-sm font-medium">{type}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Subtypes (Only for Poda) */}
                    {serviceType === 'Poda' && (
                        <div className="animate-fadeIn">
                            <label className="block text-sm font-bold text-gray-700 mb-2">Especificações da Poda</label>
                            <div className="grid grid-cols-1 gap-2 bg-gray-50 p-4 rounded border">
                                {PODA_SUBTYPES.map(subtype => (
                                    <label key={subtype} className="flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={subtypes.includes(subtype)}
                                            onChange={() => handleSubtypeChange(subtype)}
                                            className="h-4 w-4 text-green-600 rounded border-gray-300 focus:ring-green-500"
                                        />
                                        <span className="ml-2 text-sm text-gray-700">{subtype}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Observações do Planejamento</label>
                        <textarea
                            className="w-full border border-gray-300 rounded-lg p-2 focus:ring-green-500 focus:border-green-500"
                            rows={3}
                            placeholder="Descreva detalhes adicionais..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        />
                    </div>

                    {/* Priority */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Prioridade</label>
                        <div className="flex flex-wrap gap-2">
                            {['Baixa', 'Moderada', 'Alta', 'Emergencial'].map(p => (
                                <button
                                    key={p}
                                    type="button"
                                    onClick={() => setPriority(p)}
                                    className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all border ${priority === p
                                        ? p === 'Emergencial' ? 'bg-red-600 text-white border-red-700 ring-2 ring-red-200'
                                            : p === 'Alta' ? 'bg-orange-500 text-white border-orange-600 ring-2 ring-orange-100'
                                                : p === 'Moderada' ? 'bg-blue-500 text-white border-blue-600 ring-2 ring-blue-100'
                                                    : 'bg-gray-600 text-white border-gray-700 ring-2 ring-gray-100'
                                        : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
                                        }`}
                                >
                                    {p}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="p-6 border-t border-gray-100 flex justify-end gap-3 bg-gray-50 rounded-b-lg">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded font-medium"
                        disabled={loading}
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={loading || !serviceType}
                        className="px-6 py-2 bg-green-600 text-white rounded font-bold hover:bg-green-700 disabled:opacity-50 shadow-sm"
                    >
                        {loading ? 'Criando...' : 'Confirmar Criação'}
                    </button>
                </div>
            </div>
        </div>
    );
}
