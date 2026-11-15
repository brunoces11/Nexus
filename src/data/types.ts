// Tipos do cenário demonstrativo. Nada aqui representa integração real.

export type TeamId = 't-sup' | 't-man' | 't-reg' | 't-ops'

export interface Team {
  id: TeamId
  name: string
  lead: string
}

export interface Person {
  id: string
  name: string
  initials: string
  role: string
  team: TeamId
  load: number // ocupação estimada, 0-100
  agents: string[]
  isManager?: boolean
}

export type AgentStatus = 'disponivel' | 'em_execucao' | 'pausado'

export interface Agent {
  id: string
  name: string
  purpose: string
  instructions: string
  status: AgentStatus
  skills: string[]
  bases: string[]
  users: string[]
  teams: TeamId[]
  routines: string[]
}

export interface Skill {
  id: string
  name: string
  description: string
}

export type Sensitivity = 'Pública interna' | 'Interna' | 'Confidencial' | 'Restrita'
export type ProcessingState = 'processado' | 'processando' | 'atualizando' | 'erro'

export interface KnowledgeBase {
  id: string
  name: string
  kind: string
  origin: string
  items: string
  state: ProcessingState
  version: string
  quality: number
  owner: string
  sensitivity: Sensitivity
  updatedAt: string
  preprocessing: string[]
  entities: string[]
}

export interface RoutineStep {
  label: string
  actor: 'regra' | 'agente' | 'pessoa' | 'sistema'
  ref?: string
}

export interface Routine {
  id: string
  name: string
  trigger: string
  frequency: string
  owners: string[]
  agents: string[]
  steps: RoutineStep[]
  output: string
  review: string
  state: 'ativa' | 'pausada' | 'rascunho'
  lastRun: string
}

export type ColumnId = 'entrada' | 'planejado' | 'andamento' | 'aguardando' | 'revisao' | 'concluido'
export type Priority = 'crítica' | 'alta' | 'média' | 'baixa'

export interface Task {
  id: string
  title: string
  assignee: string
  agents: string[]
  column: ColumnId
  due: string
  overdue?: boolean
  priority: Priority
  routine?: string
  lastEvent: string
  evidences: number
  context: string
}

export type ExecutionState = 'em_execucao' | 'concluida' | 'aprovada' | 'falha'

export interface Execution {
  id: string
  agent: string
  task?: string
  routine?: string
  invokedBy: string
  startedAt: string
  state: ExecutionState
  summary: string
}

export type TimelineKind =
  | 'solicitacao'
  | 'atribuicao'
  | 'agente'
  | 'conversa'
  | 'dados'
  | 'saida'
  | 'decisao'
  | 'entrega'
  | 'revisao'

export interface TimelineEvent {
  id: string
  at: string
  kind: TimelineKind
  actor: string
  actorType: 'pessoa' | 'agente' | 'sistema'
  title: string
  detail?: string
  refs?: string[]
}

export interface ChatMessage {
  from: 'pessoa' | 'agente'
  author: string
  at: string
  text: string
  sources?: string[]
  flag?: 'inferencia' | 'nao_verificado'
}

export type FindingKind = 'fato' | 'inferencia'
export type FindingCoverage = 'incluido' | 'parcial' | 'nao_incluido'

export interface Finding {
  id: string
  text: string
  kind: FindingKind
  coverage: FindingCoverage
  sources: string[]
  deliveryRef?: string
}

export interface Evidence {
  id: string
  title: string
  source: string
  type: 'documento' | 'registro' | 'saida_agente' | 'entrega'
  excerpt: string
  usedBy: string
}

export interface ScriptedAnswer {
  question: string
  evidence: string[]
  inference: string[]
  missing: string[]
  sources: string[]
}

export interface ActivityItem {
  id: string
  group: 'Hoje' | 'Ontem' | 'Esta semana'
  at: string
  kind: 'agente' | 'tarefa' | 'dados' | 'revisao' | 'alerta'
  text: string
  link?: string
}
