export interface ChecklistItem {
    id: string;
    label: string;
    category: string;
    isMandatory: boolean;
}

export const EXECUTION_CHECKLIST_ITEMS: ChecklistItem[] = [
    // 1. EPIs da Equipe
    { id: "epi_capacete", label: "Capacete com jugular", category: "1. EPIs da Equipe", isMandatory: true },
    { id: "epi_oculos", label: "Óculos de proteção ou viseira", category: "1. EPIs da Equipe", isMandatory: true },
    { id: "epi_auricular", label: "Protetor auricular", category: "1. EPIs da Equipe", isMandatory: true },
    { id: "epi_luvas", label: "Luvas de segurança", category: "1. EPIs da Equipe", isMandatory: true },
    { id: "epi_botina", label: "Botina/bota de segurança antiderrapante", category: "1. EPIs da Equipe", isMandatory: true },
    { id: "epi_calca", label: "Calça de proteção para uso de motosserra", category: "1. EPIs da Equipe", isMandatory: true },
    { id: "epi_colete", label: "Colete refletivo (quando em via pública)", category: "1. EPIs da Equipe", isMandatory: true },

    // 2. Equipamentos e Ferramentas
    { id: "eq_motosserra", label: "Motosserra em boas condições de uso", category: "2. Equipamentos e Ferramentas", isMandatory: true },
    { id: "eq_freio", label: "Freio de corrente funcionando", category: "2. Equipamentos e Ferramentas", isMandatory: true },
    { id: "eq_tensao", label: "Corrente corretamente tensionada e afiada", category: "2. Equipamentos e Ferramentas", isMandatory: true },
    { id: "eq_abastecimento", label: "Abastecimento adequado (combustível e óleo da corrente)", category: "2. Equipamentos e Ferramentas", isMandatory: true },

    // 3. Sinalização e Isolamento
    { id: "sin_isolamento", label: "Área devidamente isolada", category: "3. Sinalização e Isolamento", isMandatory: true },
    { id: "sin_cones", label: "Uso de cones, fitas ou barreiras", category: "3. Sinalização e Isolamento", isMandatory: true },
    { id: "sin_pedestres", label: "Controle de acesso de pedestres e veículos", category: "3. Sinalização e Isolamento", isMandatory: true },
    { id: "sin_vigia", label: "Vigia/apoio em solo designado (quando necessário)", category: "3. Sinalização e Isolamento", isMandatory: true },

    // 4. Trabalho em Altura
    { id: "alt_capacitado", label: "Trabalhador capacitado para trabalho em altura (opcional)", category: "4. Trabalho em Altura (se aplicável)", isMandatory: false },
    { id: "alt_cinto", label: "Cinto tipo paraquedista (opcional)", category: "4. Trabalho em Altura (se aplicável)", isMandatory: false },
    { id: "alt_talabarte", label: "Talabarte com absorvedor de energia (opcional)", category: "4. Trabalho em Altura (se aplicável)", isMandatory: false },
    { id: "alt_ancoragem", label: "Pontos de ancoragem verificados (opcional)", category: "4. Trabalho em Altura (se aplicável)", isMandatory: false },
    { id: "alt_escada", label: "Escada ou sistema de acesso em boas condições (opcional)", category: "4. Trabalho em Altura (se aplicável)", isMandatory: false },

    // 5. Segurança Operacional
    { id: "op_comunicacao", label: "Comunicação definida entre equipe (verbal ou sinais)", category: "5. Segurança Operacional", isMandatory: true },
    { id: "op_fuga", label: "Rota de fuga definida", category: "5. Segurança Operacional", isMandatory: true },
    { id: "op_primeiros", label: "Kit de primeiros socorros disponível", category: "5. Segurança Operacional", isMandatory: true },
    { id: "op_clima", label: "Condições climáticas favoráveis no momento da execução", category: "5. Segurança Operacional", isMandatory: true },

    // 6. Avaliação do Entorno
    { id: "ent_eletrica", label: "Presença de rede elétrica próxima (opcional)", category: "6. Avaliação do Entorno", isMandatory: false },
    { id: "ent_edificacoes", label: "Proximidade de edificações (opcional)", category: "6. Avaliação do Entorno", isMandatory: false },
    { id: "ent_vias", label: "Proximidade de vias públicas (opcional)", category: "6. Avaliação do Entorno", isMandatory: false },
    { id: "ent_interdicao", label: "Necessidade de interdição parcial ou total (opcional)", category: "6. Avaliação do Entorno", isMandatory: false },

    // 7. Apoio Operacional
    { id: "apoio_cordas", label: "Uso de cordas para descida controlada (opcional)", category: "7. Apoio Operacional", isMandatory: false },
    { id: "apoio_cintas", label: "Uso de cintas, roldanas ou mosquetões (opcional)", category: "7. Apoio Operacional", isMandatory: false },
    { id: "apoio_mecanizado", label: "Equipamento mecanizado de apoio (caminhão, cesto aéreo, munck) (opcional)", category: "7. Apoio Operacional", isMandatory: false }
];
