'use client';

import {
    ShieldCheck,
    Zap,
    AlertTriangle,
    CheckCircle2,
    ChevronLeft,
    Search,
    Compass,
    Activity,
    UserCheck,
    ArrowRight
} from 'lucide-react';
import Link from 'next/link';

export default function TreeInspectionManualPage() {
    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* Header */}
            <div className="bg-green-700 py-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto">
                    <Link href="/manuals" className="inline-flex items-center text-green-100 hover:text-white mb-6 transition-colors">
                        <ChevronLeft className="w-4 h-4 mr-1" />
                        Voltar para Manuais
                    </Link>
                    <h1 className="text-4xl font-extrabold text-white tracking-tight">
                        Manual de Inspeção de Árvores
                    </h1>
                    <p className="mt-4 text-xl text-green-100 max-w-3xl">
                        Protocolos técnicos de vistoria e avaliação de risco baseados na metodologia internacional **TRAQ (Tree Risk Assessment Qualified)**.
                    </p>
                </div>
            </div>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 space-y-16">

                {/* Intro to TRAQ */}
                <section>
                    <div className="bg-white rounded-2xl shadow-sm border border-green-100 p-8">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-3 bg-green-100 rounded-xl">
                                <ShieldCheck className="w-6 h-6 text-green-600" />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900">O que é a Metodologia TRAQ?</h2>
                        </div>
                        <p className="text-gray-600 leading-relaxed mb-6">
                            O sistema **TRAQ (Tree Risk Assessment Qualified)**, desenvolvido pela ISA (International Society of Arboriculture), é o padrão global para avaliação de risco em árvores urbanas. Ele foca na identificação de alvos e na probabilidade de falha para determinar o nível de risco de forma objetiva, permitindo uma gestão eficiente do patrimônio arbóreo.
                        </p>
                        <div className="grid md:grid-cols-3 gap-6">
                            <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                                <h4 className="font-bold text-gray-800 text-sm mb-2">Objetividade</h4>
                                <p className="text-xs text-gray-500">Substitui o "eu acho" por critérios técnicos mensuráveis e matrizes de decisão.</p>
                            </div>
                            <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                                <h4 className="font-bold text-gray-800 text-sm mb-2">Foco no Alvo</h4>
                                <p className="text-xs text-gray-500">Uma árvore só apresenta risco se houver algo ou alguém que possa ser atingido (alvo).</p>
                            </div>
                            <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                                <h4 className="font-bold text-gray-800 text-sm mb-2">Priorização</h4>
                                <p className="text-xs text-gray-500">Permite classificar quais árvores precisam de intervenção imediata vs. monitoramento.</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* The Matrix */}
                <section className="space-y-8">
                    <h2 className="text-3xl font-bold text-gray-900 text-center">Matriz de Avaliação de Risco</h2>
                    <p className="text-center text-gray-500 max-w-2xl mx-auto -mt-4 text-sm">
                        O risco TRAQ é calculado através da combinação de duas sub-matrizes fundamentais.
                    </p>

                    <div className="grid lg:grid-cols-2 gap-8">
                        {/* Matrix 1 */}
                        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <AlertTriangle className="w-5 h-5 text-orange-500" />
                                1. Probabilidade de Falha e Impacto
                            </h3>
                            <div className="overflow-x-auto">
                                <table className="w-full text-xs border-collapse">
                                    <thead>
                                        <tr className="bg-gray-50">
                                            <th className="p-2 border font-bold text-left italic">Prob. de Falha</th>
                                            <th className="p-2 border font-bold" colSpan={4}>Probabilidade de Impactar o Alvo</th>
                                        </tr>
                                        <tr className="bg-gray-50">
                                            <th className="p-2 border"></th>
                                            <th className="p-2 border">Muito Baixa</th>
                                            <th className="p-2 border">Baixa</th>
                                            <th className="p-2 border">Média</th>
                                            <th className="p-2 border">Alta</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr>
                                            <td className="p-2 border font-bold bg-red-50">Iminente</td>
                                            <td className="p-2 border text-center">Improvável</td>
                                            <td className="p-2 border text-center">Provável</td>
                                            <td className="p-2 border text-center bg-orange-100 font-bold">Muito Provável</td>
                                            <td className="p-2 border text-center bg-red-100 font-bold">Muito Provável</td>
                                        </tr>
                                        <tr>
                                            <td className="p-2 border font-bold bg-orange-50">Provável</td>
                                            <td className="p-2 border text-center">Improvável</td>
                                            <td className="p-2 border text-center">Improvável</td>
                                            <td className="p-2 border text-center bg-orange-100 font-bold">Provável</td>
                                            <td className="p-2 border text-center bg-red-100 font-bold">Muito Provável</td>
                                        </tr>
                                        <tr>
                                            <td className="p-2 border font-bold bg-yellow-50">Possível</td>
                                            <td className="p-2 border text-center">Improvável</td>
                                            <td className="p-2 border text-center">Improvável</td>
                                            <td className="p-2 border text-center">Improvável</td>
                                            <td className="p-2 border text-center bg-orange-100 font-bold">Provável</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                            <p className="mt-4 text-[11px] text-gray-400 italic">
                                * Esta matriz resulta na **Probabilidade de Falha e Impacto**.
                            </p>
                        </div>

                        {/* Matrix 2 */}
                        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <Zap className="w-5 h-5 text-red-500" />
                                2. Matriz de Classificação de Risco
                            </h3>
                            <div className="overflow-x-auto">
                                <table className="w-full text-xs border-collapse">
                                    <thead>
                                        <tr className="bg-gray-50">
                                            <th className="p-2 border font-bold text-left italic">P. Falha/Impacto</th>
                                            <th className="p-2 border font-bold" colSpan={4}>Consequências do Impacto</th>
                                        </tr>
                                        <tr className="bg-gray-50">
                                            <th className="p-2 border"></th>
                                            <th className="p-2 border">Insignificantes</th>
                                            <th className="p-2 border">Menores</th>
                                            <th className="p-2 border">Significativas</th>
                                            <th className="p-2 border">Severas</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr>
                                            <td className="p-2 border font-bold bg-red-50">Muito Provável</td>
                                            <td className="p-2 border text-center bg-yellow-400 font-bold">BAIXO</td>
                                            <td className="p-2 border text-center bg-orange-400 font-bold text-white">MODERADO</td>
                                            <td className="p-2 border text-center bg-red-500 font-bold text-white">ALTO</td>
                                            <td className="p-2 border text-center bg-purple-700 font-bold text-white">EXTREMO</td>
                                        </tr>
                                        <tr>
                                            <td className="p-2 border font-bold bg-orange-50">Provável</td>
                                            <td className="p-2 border text-center bg-yellow-400 font-bold">BAIXO</td>
                                            <td className="p-2 border text-center bg-orange-400 font-bold text-white">MODERADO</td>
                                            <td className="p-2 border text-center bg-red-500 font-bold text-white">ALTO</td>
                                            <td className="p-2 border text-center bg-red-500 font-bold text-white">ALTO</td>
                                        </tr>
                                        <tr>
                                            <td className="p-2 border font-bold bg-yellow-50">Improvável</td>
                                            <td className="p-2 border text-center bg-green-500 font-bold text-white">MUITO BAIXO</td>
                                            <td className="p-2 border text-center bg-yellow-400 font-bold">BAIXO</td>
                                            <td className="p-2 border text-center bg-orange-400 font-bold text-white">MODERADO</td>
                                            <td className="p-2 border text-center bg-orange-400 font-bold text-white">MODERADO</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                            <p className="mt-4 text-[11px] text-gray-400 italic">
                                * Esta matriz define a **Classificação de Risco Final**.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Steps of Inspection */}
                <section>
                    <h2 className="text-2xl font-bold text-gray-900 mb-8 border-b pb-4">Etapas da Inspeção Técnica</h2>
                    <div className="space-y-6">
                        {/* Step 1 */}
                        <div className="flex gap-6 items-start">
                            <div className="w-12 h-12 bg-white rounded-full border-2 border-green-500 flex items-center justify-center font-bold text-green-600 shadow-sm shrink-0">1</div>
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex-1">
                                <h3 className="font-bold text-gray-900 flex items-center gap-2 mb-2">
                                    <Search className="w-4 h-4 text-green-600" />
                                    Inspeção Visual (VTA)
                                </h3>
                                <p className="text-sm text-gray-600 leading-relaxed">
                                    Realizar o **Visual Tree Assessment (VTA)**. Observe danos mecânicos, fungos xilófagos, inclinação, rachaduras no tronco ou sintomas de estresse na copa. Verifique raízes expostas ou solo levantado.
                                </p>
                            </div>
                        </div>

                        {/* Step 2 */}
                        <div className="flex gap-6 items-start">
                            <div className="w-12 h-12 bg-white rounded-full border-2 border-green-500 flex items-center justify-center font-bold text-green-600 shadow-sm shrink-0">2</div>
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex-1">
                                <h3 className="font-bold text-gray-900 flex items-center gap-2 mb-2">
                                    <Compass className="w-4 h-4 text-green-600" />
                                    Identificação de Alvos
                                </h3>
                                <p className="text-sm text-gray-600 leading-relaxed">
                                    Defina o que está na "zona de queda". Considerar fluxo de pessoas, veículos, rede elétrica ou edificações. Atribua o nível de ocupação do alvo (Frequente, Ocasional ou Raro).
                                </p>
                            </div>
                        </div>

                        {/* Step 3 */}
                        <div className="flex gap-6 items-start">
                            <div className="w-12 h-12 bg-white rounded-full border-2 border-green-500 flex items-center justify-center font-bold text-green-600 shadow-sm shrink-0">3</div>
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex-1">
                                <h3 className="font-bold text-gray-900 flex items-center gap-2 mb-2">
                                    <Activity className="w-4 h-4 text-green-600" />
                                    Avaliação das Matrizes
                                </h3>
                                <p className="text-sm text-gray-600 leading-relaxed">
                                    Utilize as matrizes acima para cruzar os dados coletados. O App Android já possui estas matrizes integradas para facilitar o cálculo automático em campo.
                                </p>
                            </div>
                        </div>

                        {/* Step 4 */}
                        <div className="flex gap-6 items-start">
                            <div className="w-12 h-12 bg-white rounded-full border-2 border-green-500 flex items-center justify-center font-bold text-green-600 shadow-sm shrink-0">4</div>
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex-1">
                                <h3 className="font-bold text-gray-900 flex items-center gap-2 mb-2">
                                    <UserCheck className="w-4 h-4 text-green-600" />
                                    Prescrição de Manejo
                                </h3>
                                <p className="text-sm text-gray-600 leading-relaxed">
                                    Com base no risco, prescreva o manejo: **Poda de Limpeza**, **Redução**, **Cabeamento** ou **Supressão**. Se o risco for persistente e alto, a supressão deve ser considerada prioritária.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Important Notes */}
                <div className="bg-amber-50 rounded-2xl p-8 border border-amber-200">
                    <h3 className="text-amber-800 font-bold flex items-center gap-2 mb-4">
                        <AlertTriangle className="w-5 h-5" />
                        Avisos de Segurança e Ética
                    </h3>
                    <ul className="space-y-3 text-sm text-amber-700">
                        <li className="flex gap-3">
                            <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
                            <span>Qualquer inspeção de nível 2 ou superior exige a presença de um perito arborista qualificado ou engenheiro agrônomo/florestal.</span>
                        </li>
                        <li className="flex gap-3">
                            <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
                            <span>Árvores com risco **EXTREMO** devem ter a área isolada imediatamente.</span>
                        </li>
                        <li className="flex gap-3">
                            <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
                            <span>Sempre documente as evidências fotográficas dos defeitos estruturais encontrados.</span>
                        </li>
                    </ul>
                </div>
            </main>
        </div>
    );
}
