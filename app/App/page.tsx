"use client";
import React, { useState } from 'react';
// Ícones Lucide-React substituídos por SVGs inline para garantir a compilação
// import { Sprout, BarChart3, HeartPulse, HardHat, MapPin, Calendar, CheckCircle, XCircle } from 'lucide-react';

// --- SVGs INLINE DE SUBSTITUIÇÃO ---
const Sprout = (props: any) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20c-3.3 0-6-2.7-6-6 0-3.3 2.7-6 6-6V2" /><path d="M12 20c3.3 0 6-2.7 6-6 0-3.3-2.7-6-6-6V2" /></svg>;
const BarChart3 = (props: any) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18" /><path d="M18 17V9" /><path d="M13 17V7" /><path d="M8 17v-3" /></svg>;
const HeartPulse = (props: any) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" /><path d="M3.23 8.35h2.89L9 11l3-7 3 7h3.88" /></svg>;
const HardHat = (props: any) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11h-3a3 3 0 0 0-3 3v2a3 3 0 0 0 3 3h3v-8z" /><path d="M2 11h3a3 3 0 0 1 3 3v2a3 3 0 0 1-3 3H2v-8z" /><path d="M14 2c-2.7 0-5 3-5 5v5h10V7c0-2-2.3-5-5-5z" /></svg>;
const MapPin = (props: any) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 17.5A2.5 2.5 0 0 1 9.5 15a2.5 2.5 0 0 1 2.5-2.5 2.5 2.5 0 0 1 2.5 2.5 2.5 2.5 0 0 1-2.5 2.5z" /><path d="M12 22s-8-6-8-12c0-4.42 3.58-8 8-8s8 3.58 8 8c0 6-8 12-8 12z" /></svg>;
const Calendar = (props: any) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>;
const CheckCircle = (props: any) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><path d="M9 11l3 3L22 4" /></svg>;
const XCircle = (props: any) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M15 9l-6 6" /><path d="M9 9l6 6" /></svg>;
// Fim dos SVGs de substituição

// --- DADOS MOCKADOS PARA SIMULAR O HISTÓRICO TEMPORAL ---
const arvoreData = {
    id: 42,
    nomeComum: 'Ipê Amarelo',
    nomeCientifico: 'Handroanthus chrysotrichus',
    endereco: 'Av. Ipiranga, 500 - Centro',
    coordenadas: '-30.0346, -51.2177',
    dataCadastro: '2015-03-10',
    ultimaInspecao: '2025-05-20',
};

const historicoDendrometrico = [
    { data: '2015-03-10', altura: 3.5, dap: 10.2, cap: 32.0 },
    { data: '2018-07-22', altura: 7.1, dap: 22.5, cap: 70.7 },
    { data: '2021-11-05', altura: 10.5, dap: 35.8, cap: 112.5 },
    { data: '2023-01-15', altura: 11.2, dap: 37.0, cap: 116.2 },
    { data: '2025-05-20', altura: 12.5, dap: 40.1, cap: 125.9 },
];

const historicoFitossanitario = [
    { data: '2018-07-22', estadoSaude: 'Bom', problemas: ['Nenhum'], observacoes: 'Árvore vigorosa.' },
    { data: '2021-11-05', estadoSaude: 'Regular', problemas: ['Pragas (Pulgões)'], observacoes: 'Início de infestação na copa. Recomendado controle.' },
    { data: '2023-01-15', estadoSaude: 'Ruim', problemas: ['Pragas (Pulgões)', 'Danos Mecânicos'], observacoes: 'Infestação persistente. Danos por colisão veicular no tronco.' },
    { data: '2025-05-20', estadoSaude: 'Ótimo', problemas: ['Epífitas'], observacoes: 'Saúde recuperada após tratamento. Presença de bromélias (não prejudicial).' },
];

const historicoManejo = [
    { data: '2021-12-10', tipo: 'Poda (Levantamento de Copa)', status: 'Concluído', descricao: 'Executada poda de levantamento de copa para liberar passagem de pedestres.' },
    { data: '2023-03-01', tipo: 'Supressão (Planejada)', status: 'Cancelado', descricao: 'Supressão planejada devido a danos na calçada. Cancelada após análise de manejo de raiz.' },
    { data: '2023-03-05', tipo: 'Manejo de Raiz', status: 'Concluído', descricao: 'Poda de raiz direcional e instalação de barreira radicular.' },
    { data: '2025-05-20', tipo: 'Poda (Afastamento Rede)', status: 'Pendente', descricao: 'Proposta poda de afastamento da rede elétrica (Urgência Alta).' },
];

// --- COMPONENTES AUXILIARES ---

// Simulação de Gráfico (usando div placeholder)
const ChartPlaceholder = ({ title, data, labelY, color }: any) => (
    <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-inner">
        <h4 className="text-md font-semibold text-gray-700 mb-2">{title}</h4>
        <div className={`h-40 flex items-end justify-between p-2 bg-gray-50 border-t-2 border-l-2 border-${color}-500`}>
            {data.map((item: any, index: any) => (
                <div key={index} className="flex flex-col items-center group relative cursor-pointer">
                    <div
                        style={{ height: `${item.valor * 5}px`, backgroundColor: color }}
                        className={`w-4 bg-${color}-500 rounded-t-sm transition-all duration-300 hover:opacity-80`}
                    />
                    <span className="text-xs mt-1 text-gray-500">{item.data.substring(0, 4)}</span>
                    <div className="absolute top-0 transform -translate-y-full mb-1 p-1 px-2 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                        {item.valor} {labelY}
                    </div>
                </div>
            ))}
        </div>
        <p className="text-sm text-gray-500 mt-2">Tendência: {labelY}</p>
    </div>
);

// Timeline Item
const TimelineItem = ({ data, tipo, status, descricao, icon: Icon, color }: any) => (
    <div className="flex relative pb-8">
        <div className="h-full w-6 absolute inset-0 flex items-center justify-center">
            <div className={`h-full w-0.5 bg-gray-200 ${status === 'Pendente' ? 'dashed' : ''}`} />
        </div>
        <div className={`flex-shrink-0 w-6 h-6 rounded-full mt-1 inline-flex items-center justify-center relative z-10 ${color}`}>
            <Icon className="w-3 h-3 text-white" />
        </div>
        <div className="flex-grow md:pl-8 pl-6 flex flex-col">
            <time className="font-medium text-xs tracking-wider text-gray-500">{data}</time>
            <h3 className="font-bold text-gray-900 mt-1">{tipo}</h3>
            <p className="text-sm text-gray-700 leading-relaxed mt-2">{descricao}</p>
            <span className={`text-xs font-semibold mt-1 inline-flex items-center ${status === 'Concluído' ? 'text-green-600' : status === 'Pendente' ? 'text-yellow-600' : 'text-red-600'}`}>
                {status === 'Concluído' && <CheckCircle className="w-3 h-3 mr-1" />}
                {status === 'Cancelado' && <XCircle className="w-3 h-3 mr-1" />}
                {status === 'Pendente' && <Calendar className="w-3 h-3 mr-1" />}
                Status: {status}
            </span>
        </div>
    </div>
);

// Timeline Item for Health
const HealthTimelineItem = ({ data, estadoSaude, problemas, observacoes }: any) => {
    const healthMap: any = {
        'Ótimo': { color: 'bg-green-500', icon: HeartPulse },
        'Bom': { color: 'bg-lime-500', icon: HeartPulse },
        'Regular': { color: 'bg-yellow-500', icon: HeartPulse },
        'Ruim': { color: 'bg-orange-500', icon: HeartPulse },
        'Crítico': { color: 'bg-red-500', icon: HeartPulse },
    };
    const { color, icon: Icon } = healthMap[estadoSaude] || healthMap['Bom'];

    return (
        <div className="flex relative pb-8">
            <div className="h-full w-6 absolute inset-0 flex items-center justify-center">
                <div className="h-full w-0.5 bg-gray-200" />
            </div>
            <div className={`flex-shrink-0 w-6 h-6 rounded-full mt-1 inline-flex items-center justify-center relative z-10 ${color}`}>
                <Icon className="w-3 h-3 text-white" />
            </div>
            <div className="flex-grow md:pl-8 pl-6 flex flex-col">
                <time className="font-medium text-xs tracking-wider text-gray-500">{data}</time>
                <h3 className="font-bold text-gray-900 mt-1">Estado: {estadoSaude}</h3>
                <p className="text-sm text-gray-700 leading-relaxed mt-1">
                    **Problemas:** {problemas.join(', ') || 'Nenhum problema fitossanitário registrado.'}
                </p>
                {observacoes && <p className="text-xs text-gray-600 mt-1 italic">Obs: {observacoes}</p>}
            </div>
        </div>
    );
};

// --- COMPONENTE PRINCIPAL ---
const App = () => {
    const [activeTab, setActiveTab] = useState('Dendrometria');

    // Dados preparados para o ChartPlaceholder
    const dapChartData = historicoDendrometrico.map(d => ({ data: d.data, valor: d.dap }));
    const alturaChartData = historicoDendrometrico.map(d => ({ data: d.data, valor: d.altura }));

    const tabs = [
        {
            name: 'Dendrometria', icon: BarChart3, content: (
                <div className="space-y-6">
                    <h3 className="text-xl font-bold text-gray-800 border-b pb-2 mb-4">Gráfico de Crescimento (Histórico)</h3>
                    <div className="grid md:grid-cols-2 gap-6">
                        <ChartPlaceholder title="DAP (Diâmetro à Altura do Peito)" data={dapChartData} labelY="cm" color="blue" />
                        <ChartPlaceholder title="Altura Total" data={alturaChartData} labelY="m" color="teal" />
                    </div>

                    <h3 className="text-xl font-bold text-gray-800 border-b pb-2 mt-8">Tabela de Dados Dendrométricos</h3>
                    <div className="overflow-x-auto bg-white rounded-lg shadow">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Altura (m)</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">DAP (cm)</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CAP (cm)</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {historicoDendrometrico.map((d: any, index: any) => (
                                    <tr key={index} className={index === historicoDendrometrico.length - 1 ? 'bg-blue-50/50 font-bold' : ''}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{d.data}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{d.altura}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{d.dap}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{d.cap}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )
        },
        {
            name: 'Fitossanidade', icon: HeartPulse, content: (
                <div className="space-y-6">
                    <h3 className="text-xl font-bold text-gray-800 border-b pb-2 mb-4">Linha do Tempo de Inspeções e Saúde</h3>
                    <div className="relative border-l-2 border-gray-200 ml-3">
                        {historicoFitossanitario.slice().reverse().map((d: any, index: any) => (
                            <HealthTimelineItem
                                key={index}
                                data={d.data}
                                estadoSaude={d.estadoSaude}
                                problemas={d.problemas}
                                observacoes={d.observacoes}
                            />
                        ))}
                    </div>
                </div>
            )
        },
        {
            name: 'Manejo e OS', icon: HardHat, content: (
                <div className="space-y-6">
                    <h3 className="text-xl font-bold text-gray-800 border-b pb-2 mb-4">Histórico de Ordens de Serviço (OS) e Ações</h3>
                    <div className="relative border-l-2 border-gray-200 ml-3">
                        {historicoManejo.slice().reverse().map((d: any, index: any) => {
                            let color;
                            let Icon;
                            if (d.status === 'Concluído') {
                                color = 'bg-green-600';
                                Icon = CheckCircle;
                            } else if (d.status === 'Pendente') {
                                color = 'bg-yellow-500';
                                Icon = Calendar;
                            } else {
                                color = 'bg-red-500';
                                Icon = XCircle;
                            }

                            return (
                                <TimelineItem
                                    key={index}
                                    data={d.data}
                                    tipo={d.tipo}
                                    status={d.status}
                                    descricao={d.descricao}
                                    icon={Icon}
                                    color={color}
                                />
                            );
                        })}
                    </div>
                </div>
            )
        },
    ];

    return (
        <div className="min-h-screen bg-gray-50 font-sans p-4 sm:p-8">
            <div className="max-w-6xl mx-auto bg-white rounded-xl shadow-2xl overflow-hidden">
                {/* Cabeçalho da Árvore */}
                <header className="p-6 bg-green-700 text-white shadow-lg">
                    <div className="flex items-center mb-2">
                        <Sprout className="w-8 h-8 mr-3 text-green-300" />
                        <h1 className="text-3xl font-extrabold tracking-tight">Registro da Árvore #{arvoreData.id}</h1>
                    </div>
                    <h2 className="text-xl font-light">{arvoreData.nomeComum} ({arvoreData.nomeCientifico})</h2>
                    <div className="mt-3 text-sm flex flex-col sm:flex-row sm:space-x-8">
                        <p className="flex items-center"><MapPin className="w-4 h-4 mr-1 opacity-80" /> {arvoreData.endereco}</p>
                        <p className="flex items-center"><Calendar className="w-4 h-4 mr-1 opacity-80" /> Cadastrada em: {arvoreData.dataCadastro}</p>
                    </div>
                    <p className="text-xs mt-1">Última Inspeção: {arvoreData.ultimaInspecao}</p>
                </header>

                <div className="p-6">
                    {/* Navegação por Abas (Tabs) */}
                    <div className="border-b border-gray-200 mb-6">
                        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                            {tabs.map((tab) => (
                                <button
                                    key={tab.name}
                                    onClick={() => setActiveTab(tab.name)}
                                    className={`
                                        ${activeTab === tab.name
                                            ? 'border-green-600 text-green-600'
                                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                        }
                                        group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm transition duration-150
                                    `}
                                    aria-current={activeTab === tab.name ? 'page' : undefined}
                                >
                                    <tab.icon className="-ml-0.5 mr-2 h-5 w-5" aria-hidden="true" />
                                    <span>{tab.name}</span>
                                </button>
                            ))}
                        </nav>
                    </div>

                    {/* Conteúdo da Aba Ativa */}
                    <div className="py-4">
                        {tabs.find(tab => tab.name === activeTab)?.content}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default App;