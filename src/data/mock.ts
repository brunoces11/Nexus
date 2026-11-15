// Cenário fictício do setor de energia (distribuidora). Nomes de pessoas,
// fornecedores, subestações e contratos são inventados para a demonstração.
import type {
  ActivityItem,
  Agent,
  ChatMessage,
  Evidence,
  Execution,
  Finding,
  KnowledgeBase,
  Person,
  Routine,
  ScriptedAnswer,
  Skill,
  Task,
  Team,
  TimelineEvent,
} from './types'

export const CURRENT_USER = 'p-rafael'

export const teams: Team[] = [
  { id: 't-sup', name: 'Suprimentos', lead: 'p-lucas' },
  { id: 't-man', name: 'Manutenção de Ativos', lead: 'p-carlos' },
  { id: 't-reg', name: 'Regulatório', lead: 'p-juliana' },
  { id: 't-ops', name: 'Centro de Operações', lead: 'p-rafael' },
]

export const people: Person[] = [
  { id: 'p-rafael', name: 'Rafael Torres', initials: 'RT', role: 'Gestor de Operações', team: 't-ops', load: 55, agents: ['ag-forn', 'ag-man', 'ag-reg', 'ag-tri'], isManager: true },
  { id: 'p-ana', name: 'Ana Ribeiro', initials: 'AR', role: 'Analista de Suprimentos', team: 't-sup', load: 72, agents: ['ag-forn'] },
  { id: 'p-lucas', name: 'Lucas Fernandes', initials: 'LF', role: 'Comprador Sênior', team: 't-sup', load: 50, agents: ['ag-forn'] },
  { id: 'p-carlos', name: 'Carlos Menezes', initials: 'CM', role: 'Engenheiro de Manutenção', team: 't-man', load: 88, agents: ['ag-man'] },
  { id: 'p-pedro', name: 'Pedro Alves', initials: 'PA', role: 'Técnico de Campo', team: 't-man', load: 64, agents: ['ag-man'] },
  { id: 'p-juliana', name: 'Juliana Prado', initials: 'JP', role: 'Especialista Regulatória', team: 't-reg', load: 60, agents: ['ag-reg'] },
  { id: 'p-marina', name: 'Marina Costa', initials: 'MC', role: 'Analista de Dados', team: 't-ops', load: 41, agents: ['ag-tri'] },
]

export const skills: Skill[] = [
  { id: 'sk-busca', name: 'Busca semântica', description: 'Recupera trechos relevantes nas bases autorizadas, com referência à origem.' },
  { id: 'sk-comp', name: 'Comparador de contratos', description: 'Compara cláusulas, prazos, valores e aditivos entre contratos.' },
  { id: 'sk-claus', name: 'Extrator de cláusulas', description: 'Identifica cláusulas de penalidade, prazo e reajuste em documentos.' },
  { id: 'sk-series', name: 'Análise de séries temporais', description: 'Detecta tendências e anomalias em leituras de sensores.' },
  { id: 'sk-relat', name: 'Redator de relatórios', description: 'Gera rascunhos estruturados para revisão humana.' },
  { id: 'sk-class', name: 'Classificador de mensagens', description: 'Classifica mensagens de ocorrência por tipo, região e criticidade.' },
]

export const bases: KnowledgeBase[] = [
  {
    id: 'kb-contratos', name: 'Base de Contratos', kind: 'Documentos', origin: 'Repositório jurídico', items: '1.284 documentos',
    state: 'processado', version: 'v12', quality: 94, owner: 'p-lucas', sensitivity: 'Confidencial', updatedAt: 'Hoje, 06:00',
    preprocessing: ['Extração de texto e tabelas', 'Identificação de partes, valores e prazos', 'Vínculo de aditivos ao contrato original', 'Classificação de sensibilidade'],
    entities: ['Contrato', 'Fornecedor', 'Aditivo', 'Cláusula'],
  },
  {
    id: 'kb-forn', name: 'Cadastro de Fornecedores', kind: 'Tabela', origin: 'Sistema de compras', items: '312 registros',
    state: 'processado', version: 'v31', quality: 88, owner: 'p-lucas', sensitivity: 'Interna', updatedAt: 'Hoje, 05:30',
    preprocessing: ['Normalização de CNPJ e razão social', 'Deduplicação', 'Validação de certidões'],
    entities: ['Fornecedor', 'Categoria', 'Certidão'],
  },
  {
    id: 'kb-man', name: 'Histórico de Manutenção', kind: 'Séries e ordens de serviço', origin: 'Sensores de subestação + ordens de serviço', items: '2,1 mi leituras · 8.940 OS',
    state: 'processando', version: 'v7', quality: 81, owner: 'p-carlos', sensitivity: 'Interna', updatedAt: 'Processando lote de 04/11',
    preprocessing: ['Agregação por ativo e janela de 15 min', 'Remoção de leituras fora de faixa', 'Vínculo OS ↔ ativo'],
    entities: ['Ativo', 'Ordem de serviço', 'Leitura', 'Subestação'],
  },
  {
    id: 'kb-ocor', name: 'Ocorrências de Campo', kind: 'Mensagens', origin: 'Canal de ocorrências e central de atendimento', items: '46.230 mensagens',
    state: 'atualizando', version: 'contínua', quality: 76, owner: 'p-marina', sensitivity: 'Interna', updatedAt: 'Há 3 min',
    preprocessing: ['Remoção de dados pessoais de clientes', 'Classificação por tipo e região', 'Agrupamento de mensagens do mesmo evento'],
    entities: ['Ocorrência', 'Região', 'Alimentador'],
  },
  {
    id: 'kb-normas', name: 'Normas Regulatórias', kind: 'Documentos', origin: 'Biblioteca regulatória interna', items: '418 documentos',
    state: 'processado', version: 'v5', quality: 97, owner: 'p-juliana', sensitivity: 'Restrita', updatedAt: 'Ontem, 18:00',
    preprocessing: ['Segmentação por artigo', 'Vigência e revogações', 'Vínculo norma ↔ processo interno'],
    entities: ['Norma', 'Artigo', 'Processo'],
  },
  {
    id: 'kb-ativos', name: 'Inventário de Ativos', kind: 'Tabela', origin: 'Cadastro técnico', items: '5.602 ativos',
    state: 'erro', version: 'v19', quality: 69, owner: 'p-marina', sensitivity: 'Interna', updatedAt: 'Falha na validação · 3 registros',
    preprocessing: ['Validação de código de ativo', 'Georreferenciamento', 'Vínculo ativo ↔ subestação'],
    entities: ['Ativo', 'Subestação', 'Fabricante'],
  },
]

export const agents: Agent[] = [
  {
    id: 'ag-forn', name: 'Agente de Pesquisa de Fornecedores', status: 'em_execucao',
    purpose: 'Levantar histórico contratual, desempenho de entrega e riscos de fornecedores.',
    instructions: 'Responder apenas com base nas fontes autorizadas. Citar contrato e trecho para cada afirmação. Sinalizar inferências e dados desatualizados.',
    skills: ['sk-busca', 'sk-comp'], bases: ['kb-contratos', 'kb-forn'], users: ['p-ana', 'p-lucas'], teams: ['t-sup'], routines: ['r-forn'],
  },
  {
    id: 'ag-man', name: 'Agente de Manutenção Preditiva', status: 'em_execucao',
    purpose: 'Investigar anomalias de ativos e sugerir hipóteses de causa para a engenharia.',
    instructions: 'Correlacionar leituras e ordens de serviço. Nunca recomendar desligamento sem revisão humana.',
    skills: ['sk-series', 'sk-relat'], bases: ['kb-man', 'kb-ocor'], users: ['p-carlos', 'p-pedro'], teams: ['t-man'], routines: ['r-insp', 'r-tri'],
  },
  {
    id: 'ag-reg', name: 'Agente Regulatório', status: 'disponivel',
    purpose: 'Localizar exigências normativas e apontar impactos em processos internos.',
    instructions: 'Indicar artigo e vigência. Separar texto normativo de interpretação.',
    skills: ['sk-claus', 'sk-busca'], bases: ['kb-normas'], users: ['p-juliana'], teams: ['t-reg'], routines: ['r-reg'],
  },
  {
    id: 'ag-tri', name: 'Agente de Triagem de Ocorrências', status: 'em_execucao',
    purpose: 'Classificar mensagens de campo e propor tarefas para casos críticos.',
    instructions: 'Aplicar as regras de criticidade antes da IA. Casos críticos exigem validação do gestor.',
    skills: ['sk-class'], bases: ['kb-ocor'], users: ['p-marina'], teams: ['t-ops'], routines: ['r-tri'],
  },
]

export const routines: Routine[] = [
  {
    id: 'r-tri', name: 'Triagem diária de ocorrências', trigger: 'Novas mensagens no canal de ocorrências', frequency: 'Contínua · consolidação às 08h',
    owners: ['p-marina', 'p-rafael'], agents: ['ag-tri', 'ag-man'], state: 'ativa', lastRun: 'Há 3 min',
    steps: [
      { label: 'Mensagens entram', actor: 'sistema', ref: 'kb-ocor' },
      { label: 'Regras e IA classificam', actor: 'agente', ref: 'ag-tri' },
      { label: 'Caso crítico vira tarefa', actor: 'regra' },
      { label: 'Engenharia investiga com agente', actor: 'pessoa', ref: 'p-carlos' },
      { label: 'Gestor acompanha no Kanban', actor: 'pessoa', ref: 'p-rafael' },
    ],
    output: 'Tarefas críticas no Kanban', review: 'Gestor valida cada caso crítico',
  },
  {
    id: 'r-forn', name: 'Revisão mensal de fornecedores', trigger: 'Calendário', frequency: 'Mensal · dia 1',
    owners: ['p-ana', 'p-lucas'], agents: ['ag-forn'], state: 'ativa', lastRun: '01/11, 08:00',
    steps: [
      { label: 'Seleciona fornecedores com contrato a vencer', actor: 'regra' },
      { label: 'Cria tarefa de análise', actor: 'sistema' },
      { label: 'Analista pesquisa com agente', actor: 'pessoa', ref: 'p-ana' },
      { label: 'Parecer entregue', actor: 'pessoa', ref: 'p-ana' },
      { label: 'Gestor revisa', actor: 'pessoa', ref: 'p-rafael' },
    ],
    output: 'Parecer de fornecedor', review: 'Revisão do gestor antes da decisão de compra',
  },
  {
    id: 'r-insp', name: 'Inspeção preventiva de subestações', trigger: 'Calendário + alerta de sensor', frequency: 'Semanal · segundas',
    owners: ['p-carlos', 'p-pedro'], agents: ['ag-man'], state: 'ativa', lastRun: '03/11, 07:00',
    steps: [
      { label: 'Agente prioriza ativos', actor: 'agente', ref: 'ag-man' },
      { label: 'Engenharia aprova roteiro', actor: 'pessoa', ref: 'p-carlos' },
      { label: 'Técnico executa em campo', actor: 'pessoa', ref: 'p-pedro' },
      { label: 'Relatório gerado para revisão', actor: 'agente', ref: 'ag-man' },
    ],
    output: 'Relatório de inspeção', review: 'Engenheiro responsável assina o relatório',
  },
  {
    id: 'r-reg', name: 'Monitoramento de normas', trigger: 'Publicação de nova norma', frequency: 'Por evento',
    owners: ['p-juliana'], agents: ['ag-reg'], state: 'pausada', lastRun: '21/10, 14:12',
    steps: [
      { label: 'Nova norma cadastrada', actor: 'sistema', ref: 'kb-normas' },
      { label: 'Agente aponta processos afetados', actor: 'agente', ref: 'ag-reg' },
      { label: 'Especialista valida impacto', actor: 'pessoa', ref: 'p-juliana' },
    ],
    output: 'Nota de impacto regulatório', review: 'Especialista regulatória valida',
  },
]

export const tasks: Task[] = [
  { id: 'T-1055', title: 'Triagem: 14 mensagens de interrupção na região Sul', assignee: 'p-marina', agents: ['ag-tri'], column: 'entrada', due: '05/11', priority: 'alta', routine: 'r-tri', lastEvent: 'Agente agrupou 14 mensagens em 2 eventos · há 12 min', evidences: 14, context: 'Mensagens recebidas entre 06h e 08h relatando interrupção em bairros atendidos pelo alimentador AL-221.' },
  { id: 'T-1056', title: 'Corrigir 3 registros inválidos no inventário de ativos', assignee: 'p-marina', agents: [], column: 'entrada', due: '08/11', priority: 'baixa', lastEvent: 'Validação falhou no pré-processamento · hoje 05:40', evidences: 3, context: 'Códigos de ativo sem correspondência no cadastro técnico.' },
  { id: 'T-1052', title: 'Inspeção preventiva SE Ponte Alta', assignee: 'p-pedro', agents: ['ag-man'], column: 'planejado', due: '10/11', priority: 'média', routine: 'r-insp', lastEvent: 'Roteiro aprovado por Carlos · ontem', evidences: 2, context: 'Inspeção semanal com 6 ativos priorizados pelo agente.' },
  { id: 'T-1049', title: 'Revisar cláusulas de penalidade — Volta Equipamentos', assignee: 'p-ana', agents: ['ag-forn', 'ag-reg'], column: 'planejado', due: '12/11', priority: 'média', routine: 'r-forn', lastEvent: 'Tarefa criada pela rotina · 01/11', evidences: 0, context: 'Verificar aderência das penalidades às exigências de qualidade do fornecimento.' },
  { id: 'T-1043', title: 'Renovação do contrato de manutenção de disjuntores', assignee: 'p-lucas', agents: ['ag-forn'], column: 'andamento', due: '14/11', priority: 'média', routine: 'r-forn', lastEvent: 'Lucas consultou o agente · há 1 h', evidences: 4, context: 'Contrato C-2022-311 vence em dezembro.' },
  { id: 'T-1047', title: 'Adequação ao novo procedimento de qualidade do fornecimento', assignee: 'p-juliana', agents: ['ag-reg'], column: 'andamento', due: '04/11', overdue: true, priority: 'alta', lastEvent: 'Execução do agente falhou: fonte indisponível · ontem', evidences: 5, context: 'Mapear processos afetados pela revisão do procedimento interno de qualidade.' },
  { id: 'T-1051', title: 'Vibração anômala no transformador TR-07 · SE Vale Norte', assignee: 'p-carlos', agents: ['ag-man', 'ag-tri'], column: 'aguardando', due: '05/11', priority: 'crítica', routine: 'r-tri', lastEvent: 'Agente analisando 30 dias de leituras · em execução', evidences: 6, context: 'Alerta de vibração 38% acima da média histórica, originado por ocorrência de campo.' },
  { id: 'T-1042', title: 'Análise de fornecedor — transformadores de potência', assignee: 'p-ana', agents: ['ag-forn'], column: 'revisao', due: '06/11', priority: 'alta', routine: 'r-forn', lastEvent: 'Ana enviou o parecer v2 · há 2 h', evidences: 7, context: 'Avaliar a Atlas Transformadores como fornecedora principal de transformadores de potência para o plano de expansão 2027.' },
  { id: 'T-1038', title: 'Relatório mensal de indisponibilidade de ativos', assignee: 'p-carlos', agents: ['ag-man'], column: 'concluido', due: '31/10', priority: 'média', lastEvent: 'Aprovado por Rafael · 31/10', evidences: 9, context: 'Consolidação de indisponibilidades de outubro.' },
  { id: 'T-1040', title: 'Cotação de cabos de média tensão', assignee: 'p-lucas', agents: ['ag-forn'], column: 'concluido', due: '30/10', priority: 'baixa', lastEvent: 'Concluída · 29/10', evidences: 3, context: 'Cotação com 3 fornecedores cadastrados.' },
]

export const executions: Execution[] = [
  { id: 'EX-3405', agent: 'ag-tri', routine: 'r-tri', task: 'T-1055', invokedBy: 'Rotina · Triagem diária', startedAt: 'Hoje, 08:02', state: 'em_execucao', summary: 'Classificando mensagens da região Sul.' },
  { id: 'EX-3402', agent: 'ag-man', task: 'T-1051', invokedBy: 'p-carlos', startedAt: 'Hoje, 07:48', state: 'em_execucao', summary: 'Correlacionando vibração do TR-07 com ordens de serviço.' },
  { id: 'EX-3391', agent: 'ag-forn', task: 'T-1042', invokedBy: 'p-ana', startedAt: '29/10, 14:02', state: 'concluida', summary: 'Histórico e comparação de 3 fornecedores de transformadores.' },
  { id: 'EX-3388', agent: 'ag-man', task: 'T-1038', invokedBy: 'p-carlos', startedAt: '30/10, 09:10', state: 'aprovada', summary: 'Rascunho do relatório de indisponibilidade.' },
  { id: 'EX-3379', agent: 'ag-reg', task: 'T-1047', invokedBy: 'p-juliana', startedAt: 'Ontem, 16:20', state: 'falha', summary: 'Base Normas Regulatórias indisponível durante a reindexação.' },
  { id: 'EX-3370', agent: 'ag-forn', task: 'T-1040', invokedBy: 'p-lucas', startedAt: '28/10, 11:00', state: 'aprovada', summary: 'Comparação de preços de cabos.' },
]

// ---------- Detalhe rico da tarefa T-1042 (jornada principal) ----------

export const timelineT1042: TimelineEvent[] = [
  { id: 'e1', at: '28/10 · 09:12', kind: 'solicitacao', actor: 'p-rafael', actorType: 'pessoa', title: 'Tarefa criada pela rotina “Revisão mensal de fornecedores”', detail: 'Avaliar a Atlas Transformadores como fornecedora principal de transformadores de potência para o plano de expansão 2027.' },
  { id: 'e2', at: '28/10 · 09:15', kind: 'atribuicao', actor: 'p-rafael', actorType: 'pessoa', title: 'Atribuída a Ana Ribeiro · prazo 06/11', detail: 'Agente habilitado pelo fluxo “Avaliação de fornecedores”: Agente de Pesquisa de Fornecedores.' },
  { id: 'e3', at: '29/10 · 14:02', kind: 'agente', actor: 'p-ana', actorType: 'pessoa', title: 'Ana invocou o Agente de Pesquisa de Fornecedores', detail: 'Execução EX-3391 · objetivo: levantar histórico contratual e desempenho de entrega.', refs: ['EX-3391'] },
  { id: 'e4', at: '29/10 · 14:03–14:41', kind: 'conversa', actor: 'ag-forn', actorType: 'agente', title: 'Conversa exploratória · 10 mensagens', detail: 'Histórico contratual, atrasos, comparação com Volta e Meridiano, risco de capacidade.' },
  { id: 'e5', at: '29/10 · 14:20', kind: 'dados', actor: 'ag-forn', actorType: 'agente', title: 'Fontes consultadas', detail: 'Base de Contratos (5 documentos) · Cadastro de Fornecedores (3 registros) · skill Comparador de contratos.', refs: ['C-2023-118', 'C-2024-042', 'C-2025-007', 'Cadastro Atlas'] },
  { id: 'e6', at: '30/10 · 10:30', kind: 'saida', actor: 'ag-forn', actorType: 'agente', title: 'Saída intermediária: resumo comparativo de 3 fornecedores', refs: ['S-1'] },
  { id: 'e7', at: '31/10 · 16:05', kind: 'decisao', actor: 'p-ana', actorType: 'pessoa', title: 'Ana descartou Meridiano Elétrica', detail: 'Motivo registrado: atende apenas até 69 kV, fora do escopo técnico.' },
  { id: 'e8', at: '03/11 · 17:45', kind: 'entrega', actor: 'p-ana', actorType: 'pessoa', title: 'Parecer v1 enviado' },
  { id: 'e9', at: '04/11 · 09:30', kind: 'entrega', actor: 'p-ana', actorType: 'pessoa', title: 'Parecer v2 enviado', detail: 'Ajuste no cronograma de entrega proposto.' },
  { id: 'e10', at: '04/11 · 09:31', kind: 'revisao', actor: 'sistema', actorType: 'sistema', title: 'Aguardando revisão de Rafael Torres' },
]

export const conversationT1042: ChatMessage[] = [
  { from: 'pessoa', author: 'p-ana', at: '14:03', text: 'Levante o histórico contratual da Atlas Transformadores nos últimos 3 anos.' },
  { from: 'agente', author: 'ag-forn', at: '14:04', text: 'Encontrei 3 contratos: C-2023-118 (R$ 18,4 mi), C-2024-042 (R$ 26,1 mi) e C-2025-007 (R$ 9,7 mi). Todos para transformadores de 69 kV a 138 kV.', sources: ['C-2023-118', 'C-2024-042', 'C-2025-007'] },
  { from: 'pessoa', author: 'p-ana', at: '14:08', text: 'Houve atrasos ou penalidades?' },
  { from: 'agente', author: 'ag-forn', at: '14:09', text: 'Sim. O C-2024-042 tem 2 aditivos de prazo (47 e 32 dias) por atraso na entrega de unidades de 138 kV, e uma multa contratual aplicada em março de 2025.', sources: ['C-2024-042 · Aditivo 2', 'C-2024-042 · Aditivo 3'] },
  { from: 'pessoa', author: 'p-ana', at: '14:15', text: 'Compare com Volta Equipamentos e Meridiano Elétrica.' },
  { from: 'agente', author: 'ag-forn', at: '14:18', text: 'Volta: nenhum atraso registrado em 2 contratos; preço médio 8% maior que o da Atlas. Meridiano: o catálogo cadastrado indica atendimento até 69 kV.', sources: ['Cadastro Volta', 'C-2023-201', 'Cadastro Meridiano'], flag: 'inferencia' },
  { from: 'pessoa', author: 'p-ana', at: '14:30', text: 'Há algum risco de capacidade de produção da Atlas para 2027?' },
  { from: 'agente', author: 'ag-forn', at: '14:32', text: 'O cadastro informa 2 contratos simultâneos de grande porte com outras distribuidoras, declarados pelo fornecedor em 2024 e sem atualização. Hipótese não verificada: risco de capacidade no 1º semestre de 2027.', sources: ['Cadastro Atlas · declaração 2024'], flag: 'nao_verificado' },
  { from: 'pessoa', author: 'p-ana', at: '14:40', text: 'Gere um resumo comparativo.' },
  { from: 'agente', author: 'ag-forn', at: '14:41', text: 'Resumo comparativo gerado como saída intermediária S-1, com as fontes de cada linha.', sources: ['S-1'] },
]

export const findingsT1042: Finding[] = [
  { id: 'f1', text: 'Três contratos com a Atlas nos últimos 3 anos, somando R$ 54,2 mi.', kind: 'fato', coverage: 'incluido', sources: ['C-2023-118', 'C-2024-042', 'C-2025-007'], deliveryRef: 'Parecer v2 · seção 1' },
  { id: 'f2', text: 'Preço médio da Volta 8% maior que o da Atlas.', kind: 'fato', coverage: 'incluido', sources: ['C-2023-201', 'Cadastro Volta'], deliveryRef: 'Parecer v2 · seção 2' },
  { id: 'f3', text: 'Dois atrasos de entrega no C-2024-042 (47 e 32 dias) e multa aplicada em março de 2025.', kind: 'fato', coverage: 'nao_incluido', sources: ['C-2024-042 · Aditivo 2', 'C-2024-042 · Aditivo 3'] },
  { id: 'f4', text: 'Possível risco de capacidade da Atlas em 2027 (dado declarado em 2024, sem atualização).', kind: 'inferencia', coverage: 'nao_incluido', sources: ['Cadastro Atlas · declaração 2024'] },
  { id: 'f5', text: 'Meridiano atende apenas até 69 kV, fora do escopo técnico.', kind: 'inferencia', coverage: 'parcial', sources: ['Cadastro Meridiano'], deliveryRef: 'Parecer v2 · seção 3 (sem citar fonte)' },
]

export const deliveryT1042 = {
  title: 'Parecer de fornecedor · v2',
  sentAt: '04/11 · 09:30',
  sections: [
    { h: '1. Histórico contratual', p: 'A Atlas Transformadores mantém 3 contratos com a companhia desde 2023, totalizando R$ 54,2 mi.' },
    { h: '2. Condições comerciais', p: 'A proposta da Atlas é 8% inferior à média da Volta Equipamentos para unidades equivalentes.' },
    { h: '3. Alternativas', p: 'Meridiano Elétrica foi desconsiderada por não atender à faixa de tensão exigida.' },
    { h: '4. Recomendação', p: 'Recomenda-se a Atlas como fornecedora principal, considerando melhor preço e histórico de entregas satisfatório.' },
  ],
}

export const evidencesT1042: Evidence[] = [
  { id: 'ev1', title: 'Contrato C-2024-042 · Aditivo 2', source: 'Base de Contratos', type: 'documento', excerpt: '“…prorroga-se o prazo de entrega das unidades de 138 kV em 47 (quarenta e sete) dias…”', usedBy: 'Agente · achado F3' },
  { id: 'ev2', title: 'Contrato C-2024-042 · Aditivo 3', source: 'Base de Contratos', type: 'documento', excerpt: '“…nova prorrogação de 32 dias, com aplicação da multa prevista na cláusula 11.2…”', usedBy: 'Agente · achado F3' },
  { id: 'ev3', title: 'Cadastro Atlas · declaração de capacidade', source: 'Cadastro de Fornecedores', type: 'registro', excerpt: 'Capacidade comprometida declarada: 2 contratos de grande porte (2024). Última atualização: 14/03/2024.', usedBy: 'Agente · achado F4' },
  { id: 'ev4', title: 'Contratos C-2023-118, C-2024-042, C-2025-007', source: 'Base de Contratos', type: 'documento', excerpt: 'Valores globais de R$ 18,4 mi, R$ 26,1 mi e R$ 9,7 mi.', usedBy: 'Agente · F1 · Parecer seção 1' },
  { id: 'ev5', title: 'Cadastro Volta · tabela de preços', source: 'Cadastro de Fornecedores', type: 'registro', excerpt: 'Preço médio por MVA 8% acima da referência Atlas.', usedBy: 'Agente · F2 · Parecer seção 2' },
  { id: 'ev6', title: 'S-1 · Resumo comparativo de 3 fornecedores', source: 'Execução EX-3391', type: 'saida_agente', excerpt: 'Tabela com histórico, preço, prazo e riscos por fornecedor, com fontes por linha.', usedBy: 'Ana · base do parecer' },
  { id: 'ev7', title: 'Parecer de fornecedor · v2', source: 'Entrega de Ana Ribeiro', type: 'entrega', excerpt: 'Recomenda a Atlas como fornecedora principal.', usedBy: 'Em revisão' },
]

export const managerAnswersT1042: ScriptedAnswer[] = [
  {
    question: 'O que foi apurado?',
    evidence: ['3 contratos com a Atlas desde 2023, somando R$ 54,2 mi.', 'C-2024-042 registra 2 atrasos de entrega (47 e 32 dias) e multa em mar/2025.', 'Preço da Volta 8% acima do da Atlas.'],
    inference: ['Meridiano parece fora do escopo técnico, com base apenas no catálogo cadastrado.', 'Possível risco de capacidade da Atlas em 2027.'],
    missing: ['Não há registro de visita técnica nem de avaliação de qualidade das unidades entregues.'],
    sources: ['C-2023-118', 'C-2024-042', 'C-2025-007', 'Cadastro de Fornecedores'],
  },
  {
    question: 'Quais fontes sustentaram esta conclusão?',
    evidence: ['Histórico e valores: C-2023-118, C-2024-042 e C-2025-007 (Base de Contratos, v12).', 'Preço comparativo: tabela de preços da Volta (Cadastro de Fornecedores, v31).'],
    inference: ['A afirmação “histórico de entregas satisfatório” no parecer não tem fonte correspondente na execução EX-3391.'],
    missing: ['A execução não consultou avaliações de desempenho pós-entrega; essa base não está autorizada para o agente.'],
    sources: ['Base de Contratos · v12', 'Cadastro de Fornecedores · v31'],
  },
  {
    question: 'O que ficou fora da entrega?',
    evidence: ['Os 2 atrasos e a multa do C-2024-042 aparecem na conversa (14:09) e na saída S-1, mas não no parecer v2.'],
    inference: ['O risco de capacidade em 2027 também não foi mencionado; ele se apoia em dado de 2024 e não foi verificado.'],
    missing: ['A conversa registrada não traz justificativa para a omissão. Não é possível afirmar se foi decisão deliberada; vale perguntar à Ana.'],
    sources: ['EX-3391 · mensagem 14:09', 'S-1', 'Parecer v2'],
  },
  {
    question: 'Há hipóteses não verificadas?',
    evidence: [],
    inference: ['Risco de capacidade da Atlas em 2027, baseado em declaração de 2024.', 'Limite de 69 kV da Meridiano, inferido do catálogo cadastrado e não confirmado com o fornecedor.'],
    missing: ['Não há dados atualizados de capacidade produtiva da Atlas nas bases autorizadas.'],
    sources: ['Cadastro Atlas · 14/03/2024', 'Cadastro Meridiano'],
  },
]

export const activity: ActivityItem[] = [
  { id: 'a1', group: 'Hoje', at: '09:31', kind: 'revisao', text: 'Parecer v2 de Ana Ribeiro aguarda sua revisão · T-1042', link: '/tarefas/T-1042' },
  { id: 'a2', group: 'Hoje', at: '08:14', kind: 'alerta', text: 'Agente de Triagem converteu ocorrência em tarefa crítica · TR-07 SE Vale Norte', link: '/tarefas/T-1051' },
  { id: 'a3', group: 'Hoje', at: '08:02', kind: 'agente', text: 'Rotina “Triagem diária” iniciou execução EX-3405', link: '/rotinas' },
  { id: 'a4', group: 'Hoje', at: '05:40', kind: 'dados', text: 'Inventário de Ativos: 3 registros falharam na validação', link: '/dados' },
  { id: 'a5', group: 'Ontem', at: '18:00', kind: 'dados', text: 'Normas Regulatórias atualizada para v5', link: '/dados' },
  { id: 'a6', group: 'Ontem', at: '16:20', kind: 'alerta', text: 'Execução EX-3379 do Agente Regulatório falhou: fonte indisponível', link: '/agentes' },
  { id: 'a7', group: 'Ontem', at: '11:05', kind: 'tarefa', text: 'Carlos aprovou o roteiro de inspeção da SE Ponte Alta', link: '/tarefas/T-1052' },
  { id: 'a8', group: 'Esta semana', at: '31/10', kind: 'revisao', text: 'Você aprovou o relatório de indisponibilidade de outubro', link: '/tarefas/T-1038' },
]

// ---------- Utilitários de busca ----------

export const personById = (id: string) => people.find((p) => p.id === id)
export const agentById = (id: string) => agents.find((a) => a.id === id)
export const baseById = (id: string) => bases.find((b) => b.id === id)
export const skillById = (id: string) => skills.find((s) => s.id === id)
export const routineById = (id: string) => routines.find((r) => r.id === id)
export const teamById = (id: string) => teams.find((t) => t.id === id)
export const nameOf = (id: string) =>
  personById(id)?.name ?? agentById(id)?.name ?? baseById(id)?.name ?? skillById(id)?.name ?? routineById(id)?.name ?? id
