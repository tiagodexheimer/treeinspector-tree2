'use client';

import { useState, useMemo } from 'react';

interface InspectionPhoto {
    id: number;
    uri: string;
}

interface PhytosanitaryData {
    estado_saude?: string;
}

interface Inspection {
    id_inspecao: number;
    data_inspecao: string | Date;
    photos: InspectionPhoto[];
    phytosanitary: PhytosanitaryData[];
}

interface GalleryProps {
    inspections: Inspection[];
}

export default function InspectionComparisonGallery({ inspections }: GalleryProps) {
    // Sort inspections just in case
    const sortedInspections = useMemo(() => {
        return [...(inspections || [])].sort((a, b) =>
            new Date(b.data_inspecao).getTime() - new Date(a.data_inspecao).getTime()
        );
    }, [inspections]);

    // Initial state: Compare latest (left) vs previous (right), or same if only 1
    const [leftId, setLeftId] = useState<number | ''>(sortedInspections[0]?.id_inspecao || '');
    const [rightId, setRightId] = useState<number | ''>(sortedInspections[1]?.id_inspecao || sortedInspections[0]?.id_inspecao || '');

    const leftInsp = sortedInspections.find(i => i.id_inspecao === Number(leftId));
    const rightInsp = sortedInspections.find(i => i.id_inspecao === Number(rightId));

    if (!sortedInspections.length) return null;

    return (
        <div className="bg-white p-6 rounded-lg shadow mt-6">
            <h2 className="text-xl font-semibold mb-4 border-b pb-2">Galeria Comparativa</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Left Side */}
                <div className="flex flex-col gap-4">
                    <select
                        value={leftId}
                        onChange={(e) => setLeftId(Number(e.target.value))}
                        className="p-2 border rounded bg-gray-50 font-medium"
                    >
                        {sortedInspections.map(insp => (
                            <option key={insp.id_inspecao} value={insp.id_inspecao}>
                                {new Date(insp.data_inspecao).toLocaleDateString()}
                            </option>
                        ))}
                    </select>

                    {leftInsp ? (
                        <div className="border rounded-lg p-2 min-h-[300px] bg-gray-100 flex flex-col items-center justify-center">
                            {leftInsp.photos.length > 0 ? (
                                <img
                                    src={leftInsp.photos[0].uri}
                                    alt={`Inspeção ${new Date(leftInsp.data_inspecao).toLocaleDateString()}`}
                                    className="max-h-[300px] w-auto object-contain rounded shadow-sm"
                                />
                            ) : (
                                <div className="text-gray-400 text-sm">Sem fotos</div>
                            )}

                            <div className="mt-4 text-center">
                                <span className={`inline-block px-3 py-1 rounded-full text-sm font-bold ${leftInsp.phytosanitary[0]?.estado_saude === 'Bom' ? 'bg-green-100 text-green-800' :
                                        leftInsp.phytosanitary[0]?.estado_saude === 'Regular' ? 'bg-yellow-100 text-yellow-800' :
                                            'bg-red-100 text-red-800'
                                    }`}>
                                    {leftInsp.phytosanitary[0]?.estado_saude || 'Não avaliada'}
                                </span>
                            </div>
                        </div>
                    ) : (
                        <div className="h-[300px] bg-gray-100 rounded-lg flex items-center justify-center text-gray-400">
                            Selecione uma data
                        </div>
                    )}
                </div>

                {/* Right Side */}
                <div className="flex flex-col gap-4">
                    <select
                        value={rightId}
                        onChange={(e) => setRightId(Number(e.target.value))}
                        className="p-2 border rounded bg-gray-50 font-medium"
                    >
                        {sortedInspections.map(insp => (
                            <option key={insp.id_inspecao} value={insp.id_inspecao}>
                                {new Date(insp.data_inspecao).toLocaleDateString()}
                            </option>
                        ))}
                    </select>

                    {rightInsp ? (
                        <div className="border rounded-lg p-2 min-h-[300px] bg-gray-100 flex flex-col items-center justify-center">
                            {rightInsp.photos.length > 0 ? (
                                <img
                                    src={rightInsp.photos[0].uri}
                                    alt={`Inspeção ${new Date(rightInsp.data_inspecao).toLocaleDateString()}`}
                                    className="max-h-[300px] w-auto object-contain rounded shadow-sm"
                                />
                            ) : (
                                <div className="text-gray-400 text-sm">Sem fotos</div>
                            )}

                            <div className="mt-4 text-center">
                                <span className={`inline-block px-3 py-1 rounded-full text-sm font-bold ${rightInsp.phytosanitary[0]?.estado_saude === 'Bom' ? 'bg-green-100 text-green-800' :
                                        rightInsp.phytosanitary[0]?.estado_saude === 'Regular' ? 'bg-yellow-100 text-yellow-800' :
                                            'bg-red-100 text-red-800'
                                    }`}>
                                    {rightInsp.phytosanitary[0]?.estado_saude || 'Não avaliada'}
                                </span>
                            </div>
                        </div>
                    ) : (
                        <div className="h-[300px] bg-gray-100 rounded-lg flex items-center justify-center text-gray-400">
                            Selecione uma data
                        </div>
                    )}
                </div>
            </div>

            <p className="text-center text-xs text-gray-500 mt-4">
                Comparando visualmente o estado da árvore entre duas datas.
            </p>
        </div>
    );
}
