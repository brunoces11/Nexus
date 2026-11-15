import type { Edge, Node } from '@xyflow/react'

// Gramática do canvas: tipos de nó, verbos de conexão e categoria de cada verbo.

export type NodeKind = 'pessoa' | 'equipe' | 'agente' | 'skill' | 'base' | 'rotina' | 'tarefa' | 'saida'
export type NodeStatus = 'publicado' | 'rascunho' | 'pausado'

export interface NexusNodeData extends Record<string, unknown> {
  kind: NodeKind
  label: string
  subtitle: string
  refId?: string
  status: NodeStatus
}

export type Verb = 'USA' | 'CONSULTA' | 'UTILIZA' | 'RECEBE' | 'ACIONA' | 'PRODUZ' | 'REVISA' | 'PARTICIPA DE'
export type EdgeCategory = 'estrutura' | 'acesso' | 'fluxo'
export type EdgeStatus = 'publicado' | 'rascunho' | 'conflito'

export interface VerbEdgeData extends Record<string, unknown> {
  verb: Verb | '?'
  category: EdgeCategory | 'indefinida'
  status: EdgeStatus
  note?: string
}

export type NexusNode = Node<NexusNodeData, 'nexus'>
export type VerbEdge = Edge<VerbEdgeData, 'verb'>

export const kindMeta: Record<NodeKind, { label: string; color: string; plural: string }> = {
  pessoa: { label: 'Pessoa', plural: 'Pessoas', color: '#60a5fa' },
  equipe: { label: 'Equipe', plural: 'Equipes', color: '#93c5fd' },
  agente: { label: 'Agente', plural: 'Agentes', color: '#22d3ee' },
  skill: { label: 'Skill', plural: 'Skills e ferramentas', color: '#a78bfa' },
  base: { label: 'Base de conhecimento', plural: 'Bases de conhecimento', color: '#2dd4bf' },
  rotina: { label: 'Rotina', plural: 'Rotinas', color: '#e879f9' },
  tarefa: { label: 'Tarefa', plural: 'Tarefas', color: '#cbd5e1' },
  saida: { label: 'Saída / revisão', plural: 'Saídas e revisões', color: '#86efac' },
}

export const categoryMeta: Record<EdgeCategory | 'indefinida', { label: string; color: string; dash?: string }> = {
  estrutura: { label: 'Estrutura', color: '#94a3b8', dash: '2 4' },
  acesso: { label: 'Acesso', color: '#22d3ee' },
  fluxo: { label: 'Fluxo de trabalho', color: '#a78bfa', dash: '6 4' },
  indefinida: { label: 'Indefinida', color: '#fb923c', dash: '3 3' },
}

// Regras "origem>destino" → verbo. A conexão é lida como: ORIGEM VERBO DESTINO.
const rules: Record<string, { verb: Verb; category: EdgeCategory }> = {
  'pessoa>agente': { verb: 'USA', category: 'acesso' },
  'equipe>agente': { verb: 'USA', category: 'acesso' },
  'agente>base': { verb: 'CONSULTA', category: 'acesso' },
  'agente>skill': { verb: 'UTILIZA', category: 'acesso' },
  'pessoa>tarefa': { verb: 'RECEBE', category: 'fluxo' },
  'equipe>tarefa': { verb: 'RECEBE', category: 'fluxo' },
  'rotina>agente': { verb: 'ACIONA', category: 'fluxo' },
  'rotina>tarefa': { verb: 'ACIONA', category: 'fluxo' },
  'agente>saida': { verb: 'PRODUZ', category: 'fluxo' },
  'tarefa>saida': { verb: 'PRODUZ', category: 'fluxo' },
  'pessoa>saida': { verb: 'REVISA', category: 'fluxo' },
  'pessoa>equipe': { verb: 'PARTICIPA DE', category: 'estrutura' },
}

/** Resolve o verbo para um par de tipos; inverte a direção se a regra existir só ao contrário. */
export function resolveVerb(source: NodeKind, target: NodeKind) {
  const direct = rules[`${source}>${target}`]
  if (direct) return { ...direct, reversed: false }
  const reverse = rules[`${target}>${source}`]
  if (reverse) return { ...reverse, reversed: true }
  return null
}

export const verbSentence: Record<Verb, (a: string, b: string) => string> = {
  USA: (a, b) => `${a} pode usar ${b} nas tarefas atribuídas.`,
  CONSULTA: (a, b) => `${a} pode consultar ${b}; a pesquisa fica delimitada a essa base.`,
  UTILIZA: (a, b) => `${a} pode executar a capacidade ${b}.`,
  RECEBE: (a, b) => `${a} é responsável por ${b}.`,
  ACIONA: (a, b) => `${a} inicia ${b} quando seu gatilho ocorre.`,
  PRODUZ: (a, b) => `${a} gera ${b} como resultado.`,
  REVISA: (a, b) => `${a} revisa e aprova ${b} antes da conclusão.`,
  'PARTICIPA DE': (a, b) => `${a} faz parte de ${b} e herda as permissões da equipe.`,
}

const n = (id: string, x: number, y: number, data: NexusNodeData): NexusNode => ({
  id,
  type: 'nexus',
  position: { x, y },
  data,
})

const e = (
  id: string,
  source: string,
  target: string,
  verb: Verb,
  category: EdgeCategory,
  status: EdgeStatus = 'publicado',
  note?: string,
): VerbEdge => ({ id, source, target, type: 'verb', data: { verb, category, status, note } })

export const initialNodes: NexusNode[] = [
  n('n-rotina', 0, 40, { kind: 'rotina', label: 'Revisão mensal de fornecedores', subtitle: 'Mensal · dia 1', refId: 'r-forn', status: 'publicado' }),
  n('n-ana', 0, 260, { kind: 'pessoa', label: 'Ana Ribeiro', subtitle: 'Analista de Suprimentos', refId: 'p-ana', status: 'publicado' }),
  n('n-tarefa', 320, 40, { kind: 'tarefa', label: 'Análise de fornecedor', subtitle: 'T-1042 · transformadores', status: 'publicado' }),
  n('n-equipe', 320, 420, { kind: 'equipe', label: 'Suprimentos', subtitle: 'Equipe · 2 pessoas', status: 'publicado' }),
  n('n-agente', 640, 250, { kind: 'agente', label: 'Agente de Pesquisa de Fornecedores', subtitle: 'Pesquisa e comparação', refId: 'ag-forn', status: 'publicado' }),
  n('n-rafael', 640, -110, { kind: 'pessoa', label: 'Rafael Torres', subtitle: 'Gestor de Operações', refId: 'p-rafael', status: 'publicado' }),
  n('n-saida', 960, -110, { kind: 'saida', label: 'Parecer de fornecedor', subtitle: 'Exige revisão humana', status: 'publicado' }),
  n('n-contratos', 960, 50, { kind: 'base', label: 'Base de Contratos', subtitle: 'Confidencial · v12', refId: 'kb-contratos', status: 'publicado' }),
  n('n-cadastro', 960, 190, { kind: 'base', label: 'Cadastro de Fornecedores', subtitle: 'Interna · v31', refId: 'kb-forn', status: 'publicado' }),
  n('n-normas', 960, 330, { kind: 'base', label: 'Normas Regulatórias', subtitle: 'Restrita · v5', refId: 'kb-normas', status: 'rascunho' }),
  n('n-comp', 960, 470, { kind: 'skill', label: 'Comparador de contratos', subtitle: 'Skill', refId: 'sk-comp', status: 'publicado' }),
  n('n-claus', 640, 520, { kind: 'skill', label: 'Extrator de cláusulas', subtitle: 'Skill · não conectada', refId: 'sk-claus', status: 'rascunho' }),
]

export const initialEdges: VerbEdge[] = [
  e('e-rot-tar', 'n-rotina', 'n-tarefa', 'ACIONA', 'fluxo'),
  e('e-ana-eq', 'n-ana', 'n-equipe', 'PARTICIPA DE', 'estrutura'),
  e('e-ana-tar', 'n-ana', 'n-tarefa', 'RECEBE', 'fluxo'),
  e('e-ana-ag', 'n-ana', 'n-agente', 'USA', 'acesso'),
  e('e-ag-con', 'n-agente', 'n-contratos', 'CONSULTA', 'acesso'),
  e('e-ag-cad', 'n-agente', 'n-cadastro', 'CONSULTA', 'acesso'),
  e('e-ag-nor', 'n-agente', 'n-normas', 'CONSULTA', 'acesso', 'conflito', 'Base restrita à equipe Regulatório. A conexão exige aprovação de Juliana Prado (responsável pela base).'),
  e('e-ag-comp', 'n-agente', 'n-comp', 'UTILIZA', 'acesso'),
  e('e-ag-sai', 'n-agente', 'n-saida', 'PRODUZ', 'fluxo'),
  e('e-raf-sai', 'n-rafael', 'n-saida', 'REVISA', 'fluxo'),
]

export interface LibraryItem {
  kind: NodeKind
  label: string
  subtitle: string
  refId?: string
}
