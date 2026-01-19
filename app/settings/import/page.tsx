'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function ImportPage() {
    const [file, setFile] = useState<File | null>(null);
    const [importing, setImporting] = useState(false);
    const [progress, setProgress] = useState(0);
    const [total, setTotal] = useState(0);
    const [current, setCurrent] = useState(0);
    const [errors, setErrors] = useState<string[]>([]);
    const [success, setSuccess] = useState(false);

    async function handleImport() {
        if (!file) return;

        setImporting(true);
        setProgress(0);
        setErrors([]);
        setSuccess(false);
        setCurrent(0);
        setTotal(0);

        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await fetch('/api/import', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                throw new Error('Erro ao iniciar importação');
            }

            // Read the stream
            const reader = response.body?.getReader();
            const decoder = new TextDecoder();

            if (!reader) {
                throw new Error('No reader available');
            }

            while (true) {
                const { done, value } = await reader.read();

                if (done) break;

                // Decode the chunk
                const chunk = decoder.decode(value);
                const lines = chunk.split('\n');

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        try {
                            const data = JSON.parse(line.substring(6));

                            if (data.type === 'start') {
                                setTotal(data.total);
                            } else if (data.type === 'progress') {
                                setCurrent(data.imported);
                                setProgress(data.progress);
                                setTotal(data.total);
                            } else if (data.type === 'complete') {
                                setCurrent(data.imported);
                                setTotal(data.total);
                                setProgress(100);
                                setErrors(data.errors || []);
                                setImporting(false);
                                setSuccess(true);
                            } else if (data.type === 'error') {
                                throw new Error(data.message);
                            }
                        } catch (e) {
                            console.error('Error parsing SSE data:', e);
                        }
                    }
                }
            }

        } catch (error: any) {
            console.error(error);
            alert(error.message || 'Erro ao importar arquivo');
            setImporting(false);
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
                <div className="max-w-5xl mx-auto px-8 py-8">
                    <Link href="/settings" className="text-white/80 hover:text-white transition-colors flex items-center gap-2 mb-4">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        Voltar
                    </Link>
                    <h1 className="text-3xl font-bold">Importar Dados</h1>
                    <p className="text-blue-100">Envie planilhas Excel com levantamentos de árvores</p>
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-8 py-12">
                {/* Upload Area */}
                {!importing && !success && (
                    <div className="bg-white rounded-xl shadow-lg p-8">
                        <h2 className="text-xl font-bold text-gray-900 mb-4">Selecione o arquivo</h2>

                        <div className="border-2 border-dashed border-gray-300 rounded-xl p-12 text-center hover:border-blue-500 transition-colors">
                            <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                            </svg>

                            {file ? (
                                <div>
                                    <p className="text-gray-900 font-medium mb-2">{file.name}</p>
                                    <p className="text-gray-500 text-sm">{(file.size / 1024).toFixed(2)} KB</p>
                                    <button
                                        onClick={() => setFile(null)}
                                        className="mt-4 text-red-600 hover:text-red-700 font-medium"
                                    >
                                        Remover
                                    </button>
                                </div>
                            ) : (
                                <>
                                    <p className="text-gray-600 mb-4">Arraste um arquivo .xlsx ou clique para selecionar</p>
                                    <input
                                        type="file"
                                        accept=".xlsx"
                                        onChange={(e) => setFile(e.target.files?.[0] || null)}
                                        className="hidden"
                                        id="file-upload"
                                    />
                                    <label
                                        htmlFor="file-upload"
                                        className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer transition-colors font-medium"
                                    >
                                        Selecionar Arquivo
                                    </label>
                                </>
                            )}
                        </div>

                        {file && (
                            <button
                                onClick={handleImport}
                                className="w-full mt-6 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-bold text-lg"
                            >
                                Iniciar Importação
                            </button>
                        )}

                        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                            <p className="text-sm text-yellow-800">
                                <strong>Atenção:</strong> Certifique-se de que o arquivo Excel está no formato correto com as colunas esperadas.
                            </p>
                        </div>
                    </div>
                )}

                {/* Processing */}
                {importing && (
                    <div className="bg-white rounded-xl shadow-lg p-8">
                        <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Importando Dados...</h2>

                        <div className="mb-6">
                            <div className="flex justify-between text-sm text-gray-600 mb-2">
                                <span>Progresso</span>
                                <span className="font-bold">{progress}%</span>
                            </div>
                            <div className="relative w-full h-6 bg-gray-200 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-blue-600 transition-all duration-500 flex items-center justify-end pr-2 animate-pulse"
                                    style={{ width: `${progress}%` }}
                                >
                                    {progress > 10 && <span className="text-white text-xs font-bold drop-shadow-lg">{progress}%</span>}
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-center mb-6">
                            <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                                <p className="text-sm text-gray-600 mb-1">Processadas</p>
                                <p className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 text-transparent bg-clip-text">
                                    {current.toLocaleString()}
                                </p>
                            </div>
                            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                                <p className="text-sm text-gray-600 mb-1">Total</p>
                                <p className="text-4xl font-bold text-gray-900">{total.toLocaleString()}</p>
                            </div>
                        </div>

                        <div className="flex items-center justify-center gap-3 text-gray-600">
                            <div className="relative">
                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-t-2 border-blue-600"></div>
                                <div className="absolute inset-0 rounded-full border-2 border-blue-200"></div>
                            </div>
                            <span className="font-medium">Processando em lotes de 100 árvores...</span>
                        </div>

                        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                            <p className="text-sm text-blue-800 text-center">
                                <strong>💡 Dica:</strong> Grandes importações podem levar alguns minutos. O progresso é atualizado a cada lote processado.
                            </p>
                        </div>
                    </div>
                )}

                {/* Success */}
                {success && (
                    <div className="bg-white rounded-xl shadow-lg p-8 text-center">
                        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Importação Concluída!</h2>
                        <p className="text-gray-600 mb-6">
                            {current} de {total} árvore(s) importada(s) com sucesso.
                        </p>

                        {errors.length > 0 && (
                            <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-left">
                                <p className="font-bold text-yellow-800 mb-2">Avisos ({errors.length}):</p>
                                <ul className="text-sm text-yellow-700 list-disc list-inside">
                                    {errors.map((error, i) => (
                                        <li key={i}>{error}</li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        <div className="flex gap-4 justify-center">
                            <button
                                onClick={() => { setSuccess(false); setFile(null); }}
                                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                            >
                                Importar Outro Arquivo
                            </button>
                            <Link
                                href="/trees"
                                className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 inline-block"
                            >
                                Ver Árvores
                            </Link>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
