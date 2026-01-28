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
    ChevronLeft,
    Clock
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

            {/* Visual Workflow Diagram */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10">
                <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-8 border-b pb-4">Fluxo de Trabalho de Gestão de Manejo</h2>

                    <div className="relative pt-4 pb-12">
                        {/* The Flow Diagram */}
                        <div className="flex flex-col space-y-12">
                            {/* Row 1: Planejamento */}
                            <div className="flex flex-col md:flex-row items-center justify-around gap-8">
                                <div className="flex-1 max-w-sm bg-blue-50 p-4 rounded-xl border border-blue-100 text-center">
                                    <p className="text-xs font-bold text-blue-600 uppercase mb-2">Início</p>
                                    <h4 className="font-bold text-gray-800">Demanda</h4>
                                    <p className="text-xs text-gray-500">Vistoria ou Solicitação</p>
                                </div>
                                <ArrowRight className="hidden md:block w-6 h-6 text-blue-200" />
                                <div className="flex-1 max-w-sm bg-blue-600 p-4 rounded-xl shadow-lg text-center text-white">
                                    <p className="text-xs font-bold text-blue-200 uppercase mb-2">Ação Gestor</p>
                                    <h4 className="font-bold">Criação da OS</h4>
                                    <p className="text-xs text-blue-100">Seleção via Mapa/Lista</p>
                                </div>
                                <ArrowRight className="hidden md:block w-6 h-6 text-blue-200" />
                                <div className="flex-1 max-w-sm bg-blue-50 p-4 rounded-xl border border-blue-100 text-center">
                                    <p className="text-xs font-bold text-blue-600 uppercase mb-2">Gestão</p>
                                    <h4 className="font-bold text-gray-800">Atribuição</h4>
                                    <p className="text-xs text-gray-500">Definição de Equipe e Prioridade</p>
                                </div>
                            </div>

                            <div className="flex justify-center">
                                <div className="h-12 w-1 bg-gradient-to-b from-blue-200 to-orange-200"></div>
                            </div>

                            {/* Row 2: Execução */}
                            <div className="flex flex-col md:flex-row items-center justify-around gap-8">
                                <div className="flex-1 max-w-sm bg-orange-50 p-4 rounded-xl border border-orange-100 text-center">
                                    <p className="text-xs font-bold text-orange-600 uppercase mb-2">Campo</p>
                                    <h4 className="font-bold text-gray-800">Recebimento</h4>
                                    <p className="text-xs text-gray-500">Notificação Push no Android</p>
                                </div>
                                <ArrowRight className="hidden md:block w-6 h-6 text-orange-200" />
                                <div className="flex-1 max-w-sm bg-orange-500 p-4 rounded-xl shadow-lg text-center text-white">
                                    <p className="text-xs font-bold text-orange-100 uppercase mb-2">Ação Técnico</p>
                                    <h4 className="font-bold">Execução</h4>
                                    <p className="text-xs text-orange-50">Checklist, Fotos, Consumo & Tempo</p>
                                </div>
                                <ArrowRight className="hidden md:block w-6 h-6 text-orange-200" />
                                <div className="flex-1 max-w-sm bg-orange-50 p-4 rounded-xl border border-orange-100 text-center">
                                    <p className="text-xs font-bold text-orange-600 uppercase mb-2">Registro</p>
                                    <h4 className="font-bold text-gray-800">Finalização</h4>
                                    <p className="text-xs text-gray-500">Sincronização Cloud</p>
                                </div>
                            </div>

                            <div className="flex justify-center">
                                <div className="h-12 w-1 bg-gradient-to-b from-orange-200 to-green-200"></div>
                            </div>

                            {/* Row 3: Fechamento */}
                            <div className="flex flex-col md:flex-row items-center justify-around gap-8">
                                <div className="flex-1 max-w-sm bg-green-50 p-4 rounded-xl border border-green-100 text-center">
                                    <p className="text-xs font-bold text-green-600 uppercase mb-2">Revisão</p>
                                    <h4 className="font-bold text-gray-800">Validação</h4>
                                    <p className="text-xs text-gray-500">Aprovação do Gestor (Web)</p>
                                </div>
                                <ArrowRight className="hidden md:block w-6 h-6 text-green-200" />
                                <div className="flex-1 max-w-sm bg-green-600 p-4 rounded-xl shadow-lg text-center text-white">
                                    <p className="text-xs font-bold text-green-200 uppercase mb-2">Meta</p>
                                    <h4 className="font-bold">Conclusão</h4>
                                    <p className="text-xs text-green-100">Encerramento & Relatórios</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Detailed Content based on Proposal */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-16 space-y-16">

                {/* 1. Planejamento */}
                <section>
                    <div className="flex items-center gap-4 mb-8">
                        <div className="p-3 bg-blue-100 rounded-2xl">
                            <Monitor className="w-8 h-8 text-blue-600" />
                        </div>
                        <div>
                            <h2 className="text-3xl font-bold text-gray-900">1. Fase de Planejamento</h2>
                            <p className="text-blue-600 font-medium">Plataforma Web (Office)</p>
                        </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-8">
                        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                            <h3 className="font-bold text-xl text-gray-800 mb-4">Organização da Demanda</h3>
                            <ul className="space-y-4">
                                <li className="flex gap-3">
                                    <CheckCircle2 className="w-5 h-5 text-blue-500 shrink-0 mt-1" />
                                    <div>
                                        <span className="font-bold text-gray-900">Identificação:</span>
                                        <p className="text-sm text-gray-600">As OSs nascem a partir de vistorias técnicas que identificaram necessidade de manejo ou solicitações externas.</p>
                                    </div>
                                </li>
                                <li className="flex gap-3">
                                    <CheckCircle2 className="w-5 h-5 text-blue-500 shrink-0 mt-1" />
                                    <div>
                                        <span className="font-bold text-gray-900">Criação via Mapa:</span>
                                        <p className="text-sm text-gray-600">Gestor seleciona árvores geograficamente próximas para otimizar o deslocamento da equipe.</p>
                                    </div>
                                </li>
                            </ul>
                        </div>
                        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                            <h3 className="font-bold text-xl text-gray-800 mb-4">Gestão de Equipe</h3>
                            <ul className="space-y-4">
                                <li className="flex gap-3">
                                    <CheckCircle2 className="w-5 h-5 text-blue-500 shrink-0 mt-1" />
                                    <div>
                                        <span className="font-bold text-gray-900">Atribuição Digital:</span>
                                        <p className="text-sm text-gray-600">Vínculo direto com o Responsável Operacional que possui o App Android.</p>
                                    </div>
                                </li>
                                <li className="flex gap-3">
                                    <CheckCircle2 className="w-5 h-5 text-blue-500 shrink-0 mt-1" />
                                    <div>
                                        <span className="font-bold text-gray-900">Priorização:</span>
                                        <p className="text-sm text-gray-600">Níveis (Emergencial, Urgente, Normal) ordenam a fila de trabalho em campo.</p>
                                    </div>
                                </li>
                            </ul>
                        </div>
                    </div>
                </section>

                {/* 2. Execução */}
                <section>
                    <div className="flex items-center gap-4 mb-8">
                        <div className="p-3 bg-orange-100 rounded-2xl">
                            <Smartphone className="w-8 h-8 text-orange-600" />
                        </div>
                        <div>
                            <h2 className="text-3xl font-bold text-gray-900">2. Fase de Execução</h2>
                            <p className="text-orange-600 font-medium">App Android (Campo)</p>
                        </div>
                    </div>

                    <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-orange-50 rounded-bl-full -mr-16 -mt-16 flex items-center justify-center pt-8 pr-8">
                            <NavIcon className="w-8 h-8 text-orange-200 rotate-12" />
                        </div>
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 relative z-10">
                            {/* 1. Recebimento */}
                            <div className="space-y-3">
                                <h4 className="font-bold text-gray-900 flex items-center gap-2">
                                    <Bell className="w-4 h-4 text-orange-500" />
                                    1. Recebimento
                                </h4>
                                <p className="text-sm text-gray-600">Alertas instantâneos no celular sobre novas tarefas. Notificações detalhadas com mapa e descrição.</p>
                            </div>

                            {/* 2. Checklist de Início */}
                            <div className="space-y-3">
                                <h4 className="font-bold text-gray-900 flex items-center gap-2">
                                    <FileCheck className="w-4 h-4 text-orange-500" />
                                    2. Checklist de Início
                                </h4>
                                <p className="text-sm text-gray-600">Validação de segurança, conferência de EPIs e sinalização do local antes de liberar o início do cronômetro.</p>
                            </div>

                            {/* 3. Evidências */}
                            <div className="space-y-3">
                                <h4 className="font-bold text-gray-900 flex items-center gap-2">
                                    <Camera className="w-4 h-4 text-orange-500" />
                                    3. Evidências
                                </h4>
                                <p className="text-sm text-gray-600">Registro fotográfico obrigatório do **Antes** e **Depois** para garantir a rastreabilidade técnica.</p>
                            </div>

                            {/* 4. Consumo */}
                            <div className="space-y-3">
                                <h4 className="font-bold text-gray-900 flex items-center gap-2">
                                    <Layers className="w-4 h-4 text-orange-500" />
                                    4. Consumo
                                </h4>
                                <p className="text-sm text-gray-600">Registro de materiais e insumos utilizados em tempo real, integrando automaticamente com o inventário.</p>
                            </div>

                            {/* 5. Tempo de Serviço */}
                            <div className="space-y-3">
                                <h4 className="font-bold text-gray-900 flex items-center gap-2">
                                    <Clock className="w-4 h-4 text-orange-500" />
                                    5. Tempo de Serviço
                                </h4>
                                <p className="text-sm text-gray-600">O sistema calcula automaticamente a duração do trabalho em campo, desde o início até a finalização pelo técnico.</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* 3 & 4. Monitoramento e Encerramento */}
                <div className="grid md:grid-cols-2 gap-12">
                    <section>
                        <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                            <BarChart className="w-6 h-6 text-indigo-600" />
                            3. Monitoramento
                        </h2>
                        <div className="bg-indigo-50 border border-indigo-100 p-6 rounded-2xl">
                            <ul className="space-y-4">
                                <li className="flex gap-3 text-sm text-indigo-900">
                                    <ArrowRight className="w-5 h-5 shrink-0 mt-0.5" />
                                    <span>Dashboard dinâmico mostra o status de cada equipe e OS em tempo real.</span>
                                </li>
                                <li className="flex gap-3 text-sm text-indigo-900">
                                    <ArrowRight className="w-5 h-5 shrink-0 mt-0.5" />
                                    <span>Geolocalização registra a coordenada GPS exata da conclusão do serviço.</span>
                                </li>
                            </ul>
                        </div>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                            <CheckCircle2 className="w-6 h-6 text-green-600" />
                            4. Fechamento
                        </h2>
                        <div className="bg-green-50 border border-green-100 p-6 rounded-2xl">
                            <ul className="space-y-4">
                                <li className="flex gap-3 text-sm text-green-900">
                                    <ArrowRight className="w-5 h-5 shrink-0 mt-0.5" />
                                    <span><strong>Validação:</strong> Gestor revisa fotos e descrição do campo antes do encerramento final.</span>
                                </li>
                                <li className="flex gap-3 text-sm text-green-900">
                                    <ArrowRight className="w-5 h-5 shrink-0 mt-0.5" />
                                    <span><strong>KPIs:</strong> Relatórios automáticos de tempo médio de atendimento e produtividade.</span>
                                </li>
                            </ul>
                        </div>
                    </section>
                </div>

                {/* Removed Tips section as requested */}
            </main>
        </div>
    );
}
