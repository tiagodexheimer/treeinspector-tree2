import { useState, useEffect } from 'react';

interface ServiceOrderEditModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: any) => Promise<void>;
    initialData: any;
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

export default function ServiceOrderEditModal({ isOpen, onClose, onSubmit, initialData }: ServiceOrderEditModalProps) {
    const [loading, setLoading] = useState(false);
    const [serviceType, setServiceType] = useState<string>('');
    const [subtypes, setSubtypes] = useState<string[]>([]);
    const [description, setDescription] = useState('');
    const [assignedTo, setAssignedTo] = useState('');

    useEffect(() => {
        if (initialData) {
            setServiceType(initialData.serviceType || '');
            setSubtypes(initialData.serviceSubtypes || []);
            setDescription(initialData.description || initialData.observations || '');
            setAssignedTo(initialData.assigned_to || '');
        }
    }, [initialData]);

    if (!isOpen) return null;

    const handleSubtypeChange = (subtype: string) => {
        if (subtypes.includes(subtype)) {
            setSubtypes(subtypes.filter(s => s !== subtype));
        } else {
            setSubtypes([...subtypes, subtype]);
        }
    };

    const handleSubmit = async () => {
        setLoading(true);
        try {
            await onSubmit({
                serviceType,
                serviceSubtypes: subtypes,
                description,
                assigned_to: assignedTo
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
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-blue-50 rounded-t-lg">
                    <h2 className="text-xl font-bold text-blue-800">Editar Detalhes da O.S.</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 font-bold text-2xl">&times;</button>
                </div>

                <div className="p-6 space-y-6">
                    {/* Service Type */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Tipo de Serviço</label>
                        <div className="grid grid-cols-2 gap-2">
                            {SERVICE_TYPES.map(type => (
                                <label key={type} className={`flex items-center p-3 border rounded cursor-pointer transition ${serviceType === type ? 'bg-blue-100 border-blue-500 ring-1 ring-blue-500' : 'hover:bg-gray-50'
                                    }`}>
                                    <input
                                        type="radio"
                                        name="serviceTypeEdit"
                                        value={type}
                                        checked={serviceType === type}
                                        onChange={(e) => {
                                            setServiceType(e.target.value);
                                            if (e.target.value !== 'Poda') setSubtypes([]);
                                        }}
                                        className="h-4 w-4 text-blue-600"
                                    />
                                    <span className="ml-2 text-sm font-medium">{type}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Subtypes */}
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
                                            className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                                        />
                                        <span className="ml-2 text-sm text-gray-700">{subtype}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Assigned To */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Atribuído a (Responsável)</label>
                        <input
                            className="w-full border border-gray-300 rounded-lg p-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Nome do responsável..."
                            value={assignedTo}
                            onChange={(e) => setAssignedTo(e.target.value)}
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Observações / Detalhes</label>
                        <textarea
                            className="w-full border border-gray-300 rounded-lg p-2 focus:ring-blue-500 focus:border-blue-500"
                            rows={3}
                            placeholder="Descreva detalhes adicionais..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        />
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
                        className="px-6 py-2 bg-blue-600 text-white rounded font-bold hover:bg-blue-700 disabled:opacity-50 shadow-sm"
                    >
                        {loading ? 'Salvando...' : 'Salvar Alterações'}
                    </button>
                </div>
            </div>
        </div>
    );
}
