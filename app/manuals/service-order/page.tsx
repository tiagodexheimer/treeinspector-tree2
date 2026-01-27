'use client';

import {
    ClipboardList,
    Smartphone,
    Monitor,
    CheckCircle2,
    ArrowRight,
    Camera,
    MapPin,
    FileCheck,
    BarChart,
    Bell,
    Layers,
    Navigation as NavIcon,
    ChevronLeft
} from 'lucide-react';
import Link from 'next/link';

export default function WorkflowManualPage() {
    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* Header */}
            <div className="bg-blue-700 py-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto">
                    <Link href="/manuals" className="inline-flex items-center text-blue-100 hover:text-white mb-6 transition-colors">
                        <ChevronLeft className="w-4 h-4 mr-1" />
                        Voltar para Manuais
                    </Link>
                    <h1 className="text-4xl font-extrabold text-white tracking-tight">
                        Manual de Ordem de Serviço (OS)
                    </h1>
                    <p className="mt-4 text-xl text-blue-100 max-w-3xl">
                        Guia completo para a gestão integrada de Ordens de Serviço entre as plataformas Web e Mobile do TreeInspector.
                    </p>
                </div>
            </div>

            {/* Visual Flow / Roadmap */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10">
                <div className="bg-white rounded-2xl shadow-xl overflow-hidden p-8 border border-gray-100">
                    <h2 className="text-2xl font-bold text-gray-900 mb-8 border-b pb-4">Visão Geral do Ciclo de Vida da OS</h2>

                    <div className="relative">
                        {/* Connection Line (Desktop) */}
                        <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-1 bg-blue-50 -translate-y-1/2 z-0"></div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 relative z-10">
                            {/* Step 1 */}
                            <div className="flex flex-col items-center">
                                <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center text-white shadow-lg mb-4 ring-4 ring-white">
                                    <Monitor className="w-8 h-8" />
                                </div>
                                <h3 className="text-lg font-bold text-gray-900">1. Planejamento</h3>
                                <p className="text-sm text-gray-500 text-center mt-2">Plataforma Web</p>
                            </div>

                            {/* Step 2 */}
                            <div className="flex flex-col items-center">
                                <div className="w-16 h-16 bg-orange-500 rounded-full flex items-center justify-center text-white shadow-lg mb-4 ring-4 ring-white">
                                    <Smartphone className="w-8 h-8" />
                                </div>
                                <h3 className="text-lg font-bold text-gray-900">2. Execução</h3>
                                <p className="text-sm text-gray-500 text-center mt-2">App Android</p>
                            </div>

                            {/* Step 3 */}
                            <div className="flex flex-col items-center">
                                <div className="w-16 h-16 bg-indigo-600 rounded-full flex items-center justify-center text-white shadow-lg mb-4 ring-4 ring-white">
                                    <Layers className="w-8 h-8" />
                                </div>
                                <h3 className="text-lg font-bold text-gray-900">3. Monitoramento</h3>
                                <p className="text-sm text-gray-500 text-center mt-2">Dashboard em Tempo Real</p>
                            </div>

                            {/* Step 4 */}
                            <div className="flex flex-col items-center">
                                <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center text-white shadow-lg mb-4 ring-4 ring-white">
                                    <CheckCircle2 className="w-8 h-8" />
                                </div>
                                <h3 className="text-lg font-bold text-gray-900">4. Finalização</h3>
                                <p className="text-sm text-gray-500 text-center mt-2">Análise & KPIs</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Detailed Sections */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-16 space-y-12">

                {/* Phase 1 */}
                <section className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="flex flex-col md:flex-row">
                        <div className="bg-blue-600 md:w-16 flex items-center justify-center p-4">
                            <span className="text-white font-black text-2xl md:-rotate-90 whitespace-nowrap uppercase tracking-widest">Fase 1</span>
                        </div>
                        <div className="p-8 flex-1">
                            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                                <Monitor className="text-blue-600" />
                                Planejamento e Abertura (Web)
                            </h2>
                            <div className="grid md:grid-cols-2 gap-8">
                                <div className="space-y-4">
                                    <div className="flex gap-4 p-4 rounded-lg hover:bg-gray-50 transition-colors">
                                        <div className="w-10 h-10 bg-blue-50 rounded flex-shrink-0 flex items-center justify-center">
                                            <Layers className="w-5 h-5 text-blue-600" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-gray-800 uppercase text-xs tracking-wider mb-1">Identificação</h4>
                                            <p className="text-sm text-gray-600">As OSs são geradas a partir de inspeções técnicas que detectaram risco ou necessidade de manutenção.</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-4 p-4 rounded-lg hover:bg-gray-50 transition-colors">
                                        <div className="w-10 h-10 bg-blue-50 rounded flex-shrink-0 flex items-center justify-center">
                                            <MapPin className="w-5 h-5 text-blue-600" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-gray-800 uppercase text-xs tracking-wider mb-1">Criação Espacial</h4>
                                            <p className="text-sm text-gray-600">O gestor seleciona árvores no mapa para agrupar serviços próximos, economizando tempo e combustível.</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <div className="flex gap-4 p-4 rounded-lg hover:bg-gray-50 transition-colors">
                                        <div className="w-10 h-10 bg-blue-50 rounded flex-shrink-0 flex items-center justify-center">
                                            <FileCheck className="w-5 h-5 text-blue-600" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-gray-800 uppercase text-xs tracking-wider mb-1">Atribuição</h4>
                                            <p className="text-sm text-gray-600">A OS é vinculada a um técnico específico. O sistema envia notificações push para o dispositivo móvel do encarregado.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Phase 2 */}
                <section className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="flex flex-col md:flex-row">
                        <div className="bg-orange-500 md:w-16 flex items-center justify-center p-4">
                            <span className="text-white font-black text-2xl md:-rotate-90 whitespace-nowrap uppercase tracking-widest">Fase 2</span>
                        </div>
                        <div className="p-8 flex-1">
                            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                                <Smartphone className="text-orange-500" />
                                Execução em Campo (App Android)
                            </h2>
                            <div className="grid md:grid-cols-2 gap-8">
                                <div className="space-y-4">
                                    <div className="flex gap-4 p-4 rounded-lg hover:bg-gray-50 transition-colors">
                                        <div className="w-10 h-10 bg-orange-50 rounded flex-shrink-0 flex items-center justify-center">
                                            <Bell className="w-5 h-5 text-orange-500" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-gray-800 uppercase text-xs tracking-wider mb-1">Checklist de Início</h4>
                                            <p className="text-sm text-gray-600">O técnico valida equipamentos de segurança (EPIs) e sinalização do local antes de iniciar o cronômetro.</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-4 p-4 rounded-lg hover:bg-gray-50 transition-colors">
                                        <div className="w-10 h-10 bg-orange-50 rounded flex-shrink-0 flex items-center justify-center">
                                            <Camera className="w-5 h-5 text-orange-500" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-gray-800 uppercase text-xs tracking-wider mb-1">Evidências</h4>
                                            <p className="text-sm text-gray-600">Registro fotográfico obrigatório do 'Antes' e 'Depois' para garantir a conformidade técnica do manejo.</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <div className="flex gap-4 p-4 rounded-lg hover:bg-gray-50 transition-colors">
                                        <div className="w-10 h-10 bg-orange-50 rounded flex-shrink-0 flex items-center justify-center">
                                            <NavIcon className="w-5 h-5 text-orange-500" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-gray-800 uppercase text-xs tracking-wider mb-1">Operação Offline</h4>
                                            <p className="text-sm text-gray-600">Todo o trabalho pode ser feito sem internet. Os dados são sincronizados automaticamente ao detectar rede WiFi ou 4G.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Final Phases */}
                <div className="grid lg:grid-cols-2 gap-8">
                    <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
                        <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                            <BarChart className="text-indigo-600" />
                            Acompanhamento
                        </h2>
                        <ul className="space-y-4 text-gray-600">
                            <li className="flex items-start gap-3">
                                <ArrowRight className="w-5 h-5 text-indigo-600 mt-1 flex-shrink-0" />
                                <span>Painel de controle Web mostra o progresso em tempo real de cada equipe na rua.</span>
                            </li>
                            <li className="flex items-start gap-3">
                                <ArrowRight className="w-5 h-5 text-indigo-600 mt-1 flex-shrink-0" />
                                <span>Monitoramento geográfico garante que o serviço foi executado na árvore correta.</span>
                            </li>
                        </ul>
                    </div>

                    <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
                        <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                            <CheckCircle2 className="text-green-600" />
                            Revisão e Encerramento
                        </h2>
                        <ul className="space-y-4 text-gray-600">
                            <li className="flex items-start gap-3">
                                <ArrowRight className="w-5 h-5 text-green-600 mt-1 flex-shrink-0" />
                                <span><strong>Aprovação:</strong> O gestor valida as fotos e o material utilizado antes de encerrar o ciclo.</span>
                            </li>
                            <li className="flex items-start gap-3">
                                <ArrowRight className="w-5 h-5 text-green-600 mt-1 flex-shrink-0" />
                                <span><strong>Ajustes:</strong> Caso o serviço necessite de correção, o gestor pode solicitar ajustes diretamente via Web.</span>
                            </li>
                        </ul>
                    </div>
                </div>
            </main>
        </div>
    );
}
