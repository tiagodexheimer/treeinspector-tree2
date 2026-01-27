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
    const [priority, setPriority] = useState<string>('Moderada');
    const [checklist, setChecklist] = useState<any>(null);
    const [executionDescription, setExecutionDescription] = useState('');
    const [materials, setMaterials] = useState<any[]>([]);

    useEffect(() => {
        if (initialData) {
            setServiceType(initialData.serviceType || '');
            setSubtypes(initialData.serviceSubtypes || []);
            setDescription(initialData.observations || '');
            setExecutionDescription(initialData.description || '');
            setAssignedTo(initialData.assigned_to || '');
            setPriority(initialData.priority || 'Moderada');
            setChecklist(initialData.checklist || {});
            setMaterials(initialData.materials || []);
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
                observations: description,
                description: executionDescription,
                assigned_to: assignedTo,
                priority,
                checklist,
                materials,
                // Status automatically goes back to review if it was in 'Aguardando Ajustes'?
                // Actually, let the page logic handle status if needed, or send it here.
                status: initialData.status === 'Aguardando Ajustes' ? 'Aguardando Revisão' : initialData.status
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

                    {/* Description (Planning) */}
                    {['ADMIN', 'GESTOR'].includes(initialData?.role || '') && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Observações do Planejamento</label>
                            <textarea
                                className="w-full border border-gray-300 rounded-lg p-2 focus:ring-blue-500 focus:border-blue-500"
                                rows={2}
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                            />
                        </div>
                    )}

                    {/* Execution Adjustment Section */}
                    {(initialData.status === 'Aguardando Ajustes' || initialData.status === 'Aguardando Revisão') && (
                        <div className="bg-orange-50 p-4 rounded-lg border border-orange-100 space-y-4">
                            <h3 className="text-sm font-bold text-orange-800 uppercase tracking-wider mb-2">Correção da Execução</h3>

                            {/* Checklist Editor */}
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Checklist de Segurança</label>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    {checklist && Object.keys(checklist).map(item => (
                                        <label key={item} className="flex items-center gap-2 p-2 bg-white rounded border border-orange-200 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={checklist[item]}
                                                onChange={(e) => setChecklist({ ...checklist, [item]: e.target.checked })}
                                                className="h-4 w-4 text-orange-600 rounded"
                                            />
                                            <span className="text-sm text-gray-700">{item}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {/* Execution Description */}
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Relatório do Técnico (Manejo Realizado)</label>
                                <textarea
                                    className="w-full border border-orange-200 rounded-lg p-3 text-sm focus:ring-orange-500 focus:border-orange-500"
                                    rows={4}
                                    placeholder="Descreva o que foi realizado..."
                                    value={executionDescription}
                                    onChange={(e) => setExecutionDescription(e.target.value)}
                                />
                            </div>

                            {/* Materials Manager */}
                            <div className="pt-2">
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Materiais Consumidos</label>
                                <div className="space-y-2">
                                    {materials.map((mat, index) => (
                                        <div key={index} className="flex gap-2 bg-white p-2 rounded border border-orange-200 shadow-sm items-center">
                                            <input
                                                className="flex-1 text-sm border-none focus:ring-0 p-0"
                                                placeholder="Nome do material"
                                                value={mat.name}
                                                onChange={(e) => {
                                                    const newMats = [...materials];
                                                    newMats[index].name = e.target.value;
                                                    setMaterials(newMats);
                                                }}
                                            />
                                            <input
                                                type="number"
                                                className="w-16 text-sm border-none focus:ring-0 p-0 text-right font-bold text-orange-700"
                                                placeholder="Quant."
                                                value={mat.quantity}
                                                onChange={(e) => {
                                                    const newMats = [...materials];
                                                    newMats[index].quantity = e.target.value;
                                                    setMaterials(newMats);
                                                }}
                                            />
                                            <input
                                                className="w-12 text-sm border-none focus:ring-0 p-0 text-gray-400"
                                                placeholder="Unid."
                                                value={mat.unit}
                                                onChange={(e) => {
                                                    const newMats = [...materials];
                                                    newMats[index].unit = e.target.value;
                                                    setMaterials(newMats);
                                                }}
                                            />
                                            <button
                                                onClick={() => setMaterials(materials.filter((_, i) => i !== index))}
                                                className="text-red-400 hover:text-red-600 px-1"
                                            >
                                                &times;
                                            </button>
                                        </div>
                                    ))}
                                    <button
                                        onClick={() => setMaterials([...materials, { name: '', quantity: '1', unit: 'un' }])}
                                        className="w-full py-2 border-2 border-dashed border-orange-200 rounded text-orange-600 text-xs font-bold hover:bg-orange-100 transition"
                                    >
                                        + Adicionar Material
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
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
