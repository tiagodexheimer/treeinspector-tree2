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
    Navigation as NavIcon
} from 'lucide-react';

export default function WorkflowManualPage() {
    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* Header */}
            <div className="bg-green-700 py-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <h1 className="text-4xl font-extrabold text-white tracking-tight">
                        Manual do Fluxo de Trabalho
                    </h1>
                    <p className="mt-4 text-xl text-green-100 max-w-3xl">
                        Guia completo para a gestão integrada de Ordens de Serviço (OS) entre as plataformas Web e Mobile do TreeInspector.
                    </p>
                </div>
            </div>

            {/* Visual Flow / Roadmap */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10">
                <div className="bg-white rounded-2xl shadow-xl overflow-hidden p-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-8 border-b pb-4">Visão Geral do Ciclo de Vida da OS</h2>
                    
                    <div className="relative">
                        {/* Connection Line (Desktop) */}
                        <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-1 bg-green-100 -translate-y-1/2 z-0"></div>
                        
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
                                <p className="text-sm text-gray-500 text-center mt-2">Real-time Dashboard</p>
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
                            <span className="text-white font-black text-2xl md:-rotate-90 whitespace-nowrap">FASE 1</span>
                        </div>
                        <div className="p-8 flex-1">
                            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                                <Monitor className="text-blue-600" />
                                Planejamento e Abertura (Web)
                            </h2>
                            <div className="grid md:grid-cols-2 gap-8">
                                <div className="space-y-4">
                                    <div className="flex gap-4">
                                        <div className="w-10 h-10 bg-blue-50 rounded flex-shrink-0 flex items-center justify-center">
                                            <Layers className="w-5 h-5 text-blue-600" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-gray-800">Identificação da Demanda</h4>
                                            <p className="text-sm text-gray-600">As OSs são criadas a partir de inspeções de campo ou solicitações externas cadastradas no portal.</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-4">
                                        <div className="w-10 h-10 bg-blue-50 rounded flex-shrink-0 flex items-center justify-center">
                                            <MapPin className="w-5 h-5 text-blue-600" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-gray-800">Criação via Mapa ou Lista</h4>
                                            <p className="text-sm text-gray-600">Selecione árvores próximas diretamente no mapa para criar ordens de manejo geograficamente otimizadas.</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <div className="flex gap-4">
                                        <div className="w-10 h-10 bg-blue-50 rounded flex-shrink-0 flex items-center justify-center">
                                            <FileCheck className="w-5 h-5 text-blue-600" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-gray-800">Atribuição e Prioridade</h4>
                                            <p className="text-sm text-gray-600">Vincule a OS ao <strong>Responsável Operacional</strong> e defina a prioridade (Baixa, Média, Alta ou Emergencial).</p>
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
                            <span className="text-white font-black text-2xl md:-rotate-90 whitespace-nowrap">FASE 2</span>
                        </div>
                        <div className="p-8 flex-1">
                            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                                <Smartphone className="text-orange-500" />
                                Execução em Campo (App Android)
                            </h2>
                            <div className="grid md:grid-cols-2 gap-8">
                                <div className="space-y-4">
                                    <div className="flex gap-4">
                                        <div className="w-10 h-10 bg-orange-50 rounded flex-shrink-0 flex items-center justify-center">
                                            <Bell className="w-5 h-5 text-orange-500" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-gray-800">Recebimento de Notificações</h4>
                                            <p className="text-sm text-gray-600">O celular recebe alertas de novas tarefas instantaneamente, mesmo em segundo plano.</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-4">
                                        <div className="w-10 h-10 bg-orange-50 rounded flex-shrink-0 flex items-center justify-center">
                                            <Camera className="w-5 h-5 text-orange-500" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-gray-800">Registro "Antes" e "Depois"</h4>
                                            <p className="text-sm text-gray-600">Obrigatoriedade de registro fotográfico em cada etapa para garantir a qualidade do serviço.</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <div className="flex gap-4">
                                        <div className="w-10 h-10 bg-orange-50 rounded flex-shrink-0 flex items-center justify-center">
                                            <NavIcon className="w-5 h-5 text-orange-500" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-gray-800">Modo Offline First</h4>
                                            <p className="text-sm text-gray-600">Trabalhe sem internet em áreas remotas. A sincronização ocorre automaticamente ao reconectar.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Phase 3 & 4 */}
                <div className="grid lg:grid-cols-2 gap-8">
                    <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
                        <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                            <BarChart className="text-indigo-600" />
                            Monitoramento
                        </h2>
                        <ul className="space-y-4 text-gray-600">
                            <li className="flex items-start gap-3">
                                <ArrowRight className="w-5 h-5 text-indigo-600 mt-1 flex-shrink-0" />
                                <span>Acompanhamento em tempo real do status das ordens (Em Execução, Pendente, Atrasada).</span>
                            </li>
                            <li className="flex items-start gap-3">
                                <ArrowRight className="w-5 h-5 text-indigo-600 mt-1 flex-shrink-0" />
                                <span>Localização geográfica do último registro do Responsável Operacional.</span>
                            </li>
                        </ul>
                    </div>

                    <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
                        <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                            <CheckCircle2 className="text-green-600" />
                            Finalização e KPIs
                        </h2>
                        <ul className="space-y-4 text-gray-600">
                            <li className="flex items-start gap-3">
                                <ArrowRight className="w-5 h-5 text-green-600 mt-1 flex-shrink-0" />
                                <span><strong>Validação:</strong> O gestor revisa as fotos antes de dar baixa definitiva no estoque/serviço.</span>
                            </li>
                            <li className="flex items-start gap-3">
                                <ArrowRight className="w-5 h-5 text-green-600 mt-1 flex-shrink-0" />
                                <span><strong>Relatórios:</strong> Geração automática de indicadores de produtividade e custo de manejo.</span>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Information Alerts */}
                <div className="grid md:grid-cols-2 gap-6 mt-12">
                    <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
                        <div className="flex">
                            <div className="flex-shrink-0">
                                <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <div className="ml-3">
                                <p className="text-sm text-blue-700 font-medium">
                                    Dica: Implemente rotas inteligentes para reduzir em até 20% o tempo de deslocamento da equipe.
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                        <div className="flex">
                            <div className="flex-shrink-0">
                                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <div className="ml-3">
                                <p className="text-sm text-yellow-700 font-medium">
                                    Importante: Garanta a compressão de fotos no App para otimizar o consumo de dados móveis.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

