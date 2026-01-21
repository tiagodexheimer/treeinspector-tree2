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
    const [zoomedPhoto, setZoomedPhoto] = useState<string | null>(null);

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

    const renderPhotoSide = (insp: Inspection | undefined, setId: (id: number) => void, currentId: number | '') => (
        <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <select
                    value={currentId}
                    onChange={(e) => setId(Number(e.target.value))}
                    className="p-3 border-2 border-emerald-100 rounded-xl bg-emerald-50/50 font-bold text-emerald-900 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all cursor-pointer min-w-[200px]"
                >
                    {sortedInspections.map(item => (
                        <option key={item.id_inspecao} value={item.id_inspecao}>
                            📅 {new Date(item.data_inspecao).toLocaleDateString()}
                        </option>
                    ))}
                </select>

                {insp && (
                    <span className={`px-4 py-1.5 rounded-full text-sm font-black shadow-sm ${insp.phytosanitary[0]?.estado_saude === 'Bom' ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' :
                        insp.phytosanitary[0]?.estado_saude === 'Regular' ? 'bg-yellow-100 text-yellow-700 border border-yellow-200' :
                            'bg-red-100 text-red-700 border border-red-200'
                        }`}>
                        {insp.phytosanitary[0]?.estado_saude || 'Não avaliada'}
                    </span>
                )}
            </div>

            <div className="bg-gray-50/50 rounded-2xl border-2 border-dashed border-gray-200 p-6 min-h-[400px]">
                {insp ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                        {insp.photos.length > 0 ? (
                            insp.photos.map((photo, idx) => (
                                <div
                                    key={photo.id}
                                    className="relative aspect-square bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all cursor-zoom-in group/photo"
                                    onClick={() => setZoomedPhoto(photo.uri)}
                                >
                                    <img
                                        src={photo.uri}
                                        alt={`Foto ${idx + 1}`}
                                        className="w-full h-full object-cover transition-transform duration-500 group-hover/photo:scale-110"
                                    />
                                    <div className="absolute inset-0 bg-black/0 group-hover/photo:bg-black/10 transition-colors" />
                                </div>
                            ))
                        ) : (
                            <div className="col-span-full h-[300px] flex flex-col items-center justify-center text-gray-400 gap-3">
                                <svg className="w-12 h-12 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                <p className="font-medium">Nenhuma foto nesta vistoria</p>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="h-[300px] flex items-center justify-center text-gray-400 italic">
                        Selecione uma data para comparar
                    </div>
                )}
            </div>
        </div>
    );

    return (
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-emerald-50">
            <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-6 flex items-center gap-3">
                <svg className="w-8 h-8 text-white/90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <h2 className="text-2xl font-bold text-white tracking-tight">Galeria Comparativa Evolutiva</h2>
            </div>

            <div className="p-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                    {renderPhotoSide(leftInsp, setLeftId, leftId)}
                    {renderPhotoSide(rightInsp, setRightId, rightId)}
                </div>

                <div className="mt-12 flex items-center justify-center gap-4 py-4 bg-emerald-50/50 rounded-2xl border border-emerald-100">
                    <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-sm font-semibold text-emerald-800">
                        Compare visualmente o histórico de monitoramento entre as vistorias selecionadas.
                    </p>
                </div>
            </div>

            {/* Internal Zoom Modal for the Gallery */}
            {zoomedPhoto && (
                <div
                    className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-300"
                    onClick={() => setZoomedPhoto(null)}
                >
                    <button
                        className="absolute top-6 right-6 text-white/50 hover:text-white transition-colors"
                        onClick={() => setZoomedPhoto(null)}
                    >
                        <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                    <img
                        src={zoomedPhoto}
                        alt="Zoom"
                        className="max-w-full max-h-full object-contain rounded-xl shadow-2xl animate-in zoom-in-95 duration-500"
                        onClick={(e) => e.stopPropagation()}
                    />
                </div>
            )}
        </div>
    );
}
