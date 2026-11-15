import { memo, useMemo, useState } from 'react'
import {
  applyNodeChanges,
  Background,
  BackgroundVariant,
  Controls,
  EdgeLabelRenderer,
  Handle,
  Position,
  ReactFlow,
  ReactFlowProvider,
  useInternalNode,
  type Edge,
  type EdgeProps,
  type Node,
  type NodeProps,
  type XYPosition,
} from '@xyflow/react'
import { Bot, Briefcase, Building2, ChevronLeft, ChevronRight, FileSignature, FileText, Flag, Info, ListChecks, Play, Truck, User, X, type LucideIcon } from 'lucide-react'
import { Badge, Chip, Field, cx } from '../components/ui'
import { usePersistentState } from '../store'

// Grafo de conhecimento: fatos e relações registrados ou extraídos sobre a empresa.
// Diferente do canvas, que representa regras e fluxos configurados pelo gestor.

type EntityType = 'pessoa' | 'departamento' | 'projeto' | 'tarefa' | 'documento' | 'contrato' | 'fornecedor' | 'agente' | 'execucao' | 'decisao'
type RelationKind = 'fato' | 'inferencia' | 'aprovado'

interface EntityData extends Record<string, unknown> {
  type: EntityType
  label: string
  attrs: [string, string][]
}
interface RelationData extends Record<string, unknown> {
  label: string
  kind: RelationKind
  meaning: string
  source: string
  recordedBy: string
  at: string
}
type EntityNode = Node<EntityData, 'entity'>
type RelationEdge = Edge<RelationData, 'relation'>

const typeMeta: Record<EntityType, { label: string; icon: LucideIcon; color: string }> = {
  pessoa: { label: 'Pessoa', icon: User, color: '#60a5fa' },
  departamento: { label: 'Departamento', icon: Building2, color: '#93c5fd' },
  projeto: { label: 'Projeto', icon: Briefcase, color: '#e879f9' },
  tarefa: { label: 'Tarefa', icon: ListChecks, color: '#cbd5e1' },
  documento: { label: 'Documento', icon: FileText, color: '#86efac' },
  contrato: { label: 'Contrato', icon: FileSignature, color: '#2dd4bf' },
  fornecedor: { label: 'Fornecedor', icon: Truck, color: '#fbbf24' },
  agente: { label: 'Agente', icon: Bot, color: '#22d3ee' },
  execucao: { label: 'Execução', icon: Play, color: '#67e8f9' },
  decisao: { label: 'Decisão', icon: Flag, color: '#a78bfa' },
}

const relMeta: Record<RelationKind, { label: string; color: string; dash?: string }> = {
  fato: { label: 'Fato registrado', color: '#94a3b8' },
  aprovado: { label: 'Aprovado por pessoa', color: '#34d399' },
  inferencia: { label: 'Inferência da IA', color: '#a78bfa', dash: '5 4' },
}

const N = (id: string, x: number, y: number, type: EntityType, label: string, attrs: [string, string][] = []): EntityNode => ({
  id, type: 'entity', position: { x, y }, data: { type, label, attrs },
})
const R = (id: string, source: string, target: string, label: string, kind: RelationKind, meaning: string, src: string, by: string, at: string): RelationEdge => ({
  id, source, target, type: 'relation', data: { label, kind, meaning, source: src, recordedBy: by, at },
})

const nodesInit: EntityNode[] = [
  N('sup', -640, -40, 'departamento', 'Suprimentos', [['Pessoas', '2'], ['Gestor', 'Lucas Fernandes']]),
  N('ana', -360, -40, 'pessoa', 'Ana Ribeiro', [['Função', 'Analista de Suprimentos'], ['Tarefas abertas', '2']]),
  N('rafael', -360, 220, 'pessoa', 'Rafael Torres', [['Função', 'Gestor de Operações']]),
  N('dec', -360, -280, 'decisao', 'Descartar Meridiano', [['Data', '31/10'], ['Registrada por', 'Ana Ribeiro']]),
  N('plano', -60, -280, 'projeto', 'Plano de Expansão 2027', [['Fase', 'Planejamento de compras']]),
  N('t1042', -60, 90, 'tarefa', 'T-1042 · Análise de fornecedor', [['Estado', 'Em revisão'], ['Prazo', '06/11']]),
  N('agente', -60, 380, 'agente', 'Agente de Pesquisa de Fornecedores', [['Bases', 'Contratos, Cadastro']]),
  N('parecer', 260, -110, 'documento', 'Parecer de fornecedor v2', [['Autoria', 'Ana Ribeiro (humana)'], ['Enviado', '04/11 09:30']]),
  N('ex', 260, 250, 'execucao', 'EX-3391', [['Iniciada', '29/10 14:02'], ['Estado', 'Concluída · aguarda aprovação']]),
  N('c118', 580, 40, 'contrato', 'C-2023-118', [['Valor', 'R$ 18,4 mi']]),
  N('c042', 580, 250, 'contrato', 'C-2024-042', [['Valor', 'R$ 26,1 mi'], ['Aditivos', '3']]),
  N('meridiano', 580, -300, 'fornecedor', 'Meridiano Elétrica', [['Faixa declarada', 'até 69 kV']]),
  N('atlas', 900, -60, 'fornecedor', 'Atlas Transformadores', [['Contratos', '3'], ['Cadastro atualizado', '14/03/2024']]),
  N('volta', 900, -280, 'fornecedor', 'Volta Equipamentos', [['Contratos', '2']]),
]

const edgesInit: RelationEdge[] = [
  R('r1', 'ana', 'sup', 'participa de', 'fato', 'Ana Ribeiro integra o departamento de Suprimentos.', 'Cadastro de pessoas', 'Sistema de RH', '02/01/2025'),
  R('r2', 'ana', 't1042', 'responsável por', 'fato', 'Ana é a responsável pela tarefa.', 'Atribuição no Kanban', 'Rafael Torres', '28/10 09:15'),
  R('r3', 'rafael', 't1042', 'revisa', 'fato', 'Rafael é o revisor designado da entrega.', 'Fluxo “Avaliação de fornecedores”', 'Canvas de conexões', '28/10 09:15'),
  R('r4', 'plano', 't1042', 'depende de', 'fato', 'A escolha do fornecedor é pré-requisito do plano de compras 2027.', 'Plano de Expansão 2027', 'Rafael Torres', '15/09'),
  R('r5', 'agente', 'ex', 'executou', 'fato', 'A execução foi feita por este agente.', 'Registro de execução', 'NEXUS', '29/10 14:02'),
  R('r6', 'ex', 't1042', 'vinculada a', 'fato', 'Execução invocada por Ana no contexto da tarefa.', 'Registro de execução', 'NEXUS', '29/10 14:02'),
  R('r7', 'ex', 'c042', 'consultou', 'fato', 'O agente recuperou trechos dos aditivos 2 e 3.', 'Log de recuperação EX-3391', 'NEXUS', '29/10 14:09'),
  R('r8', 'ex', 'c118', 'consultou', 'fato', 'O agente recuperou valor e objeto do contrato.', 'Log de recuperação EX-3391', 'NEXUS', '29/10 14:04'),
  R('r9', 'ana', 'parecer', 'produziu', 'fato', 'Documento de autoria humana.', 'Entrega da tarefa', 'Ana Ribeiro', '04/11 09:30'),
  R('r10', 'parecer', 'c118', 'fundamentado por', 'fato', 'A seção 1 do parecer cita este contrato.', 'Parecer v2 · seção 1', 'Extração de citações', '04/11 09:31'),
  R('r11', 'c118', 'atlas', 'firmado com', 'fato', 'Contrato celebrado com a Atlas.', 'Base de Contratos · v12', 'Pré-processamento jurídico', '05/2023'),
  R('r12', 'c042', 'atlas', 'firmado com', 'fato', 'Contrato celebrado com a Atlas; possui 2 aditivos de prazo por atraso.', 'Base de Contratos · v12', 'Pré-processamento jurídico', '02/2024'),
  R('r13', 'parecer', 'atlas', 'recomenda', 'fato', 'O parecer recomenda a Atlas como fornecedora principal.', 'Parecer v2 · seção 4', 'Ana Ribeiro', '04/11 09:30'),
  R('r14', 'atlas', 'plano', 'risco de capacidade para', 'inferencia', 'Possível risco de capacidade de produção em 2027. Não verificado.', 'Cadastro Atlas · declaração de 2024', 'Agente de Pesquisa (EX-3391)', '29/10 14:32'),
  R('r15', 'ana', 'dec', 'decidiu', 'aprovado', 'Decisão registrada pela analista com motivo.', 'Linha do tempo da T-1042', 'Ana Ribeiro', '31/10 16:05'),
  R('r16', 'dec', 'meridiano', 'refere-se a', 'aprovado', 'Fornecedor desconsiderado por faixa de tensão.', 'Linha do tempo da T-1042', 'Ana Ribeiro', '31/10 16:05'),
  R('r17', 'volta', 'atlas', 'alternativa a', 'inferencia', 'Fornecedor comparável, preço médio 8% maior.', 'Saída S-1 da EX-3391', 'Agente de Pesquisa (EX-3391)', '30/10 10:30'),
]

const EntityView = memo(function EntityView({ data, selected }: NodeProps<EntityNode>) {
  const m = typeMeta[data.type]
  return (
    <div
      className={cx('flex items-center gap-2 rounded-full border bg-surface-2 py-1.5 pl-1.5 pr-3.5 transition', !selected && 'border-line-strong')}
      style={selected ? { borderColor: m.color, boxShadow: `0 0 18px ${m.color}55` } : undefined}
    >
      <Handle type="source" position={Position.Top} className="!opacity-0" style={{ left: '50%', top: '50%' }} isConnectable={false} />
      <Handle type="target" position={Position.Top} className="!opacity-0" style={{ left: '50%', top: '50%' }} isConnectable={false} />
      <span className="flex h-6 w-6 items-center justify-center rounded-full" style={{ background: `${m.color}1f`, color: m.color }}>
        <m.icon size={13} />
      </span>
      <span className="whitespace-nowrap text-[12px] font-medium text-fg">{data.label}</span>
    </div>
  )
})

/** Aresta "flutuante": liga o centro das entidades, independentemente de portas. */
const RelationView = memo(function RelationView({ source, target, data, selected }: EdgeProps<RelationEdge>) {
  const s = useInternalNode(source)
  const t = useInternalNode(target)
  if (!s || !t || !data) return null
  const sx = s.internals.positionAbsolute.x + (s.measured.width ?? 0) / 2
  const sy = s.internals.positionAbsolute.y + (s.measured.height ?? 0) / 2
  const tx = t.internals.positionAbsolute.x + (t.measured.width ?? 0) / 2
  const ty = t.internals.positionAbsolute.y + (t.measured.height ?? 0) / 2
  const m = relMeta[data.kind]
  const mx = (sx + tx) / 2
  const my = (sy + ty) / 2
  const path = `M ${sx},${sy} L ${tx},${ty}`
  return (
    <>
      <path d={path} fill="none" stroke="transparent" strokeWidth={16} className="react-flow__edge-interaction" />
      <path
        d={path}
        fill="none"
        stroke={m.color}
        strokeOpacity={selected ? 1 : 0.45}
        strokeWidth={selected ? 1.8 : 1.1}
        strokeDasharray={m.dash}
        style={{ filter: selected ? `drop-shadow(0 0 4px ${m.color})` : undefined }}
      />
      <circle cx={sx + (tx - sx) * 0.72} cy={sy + (ty - sy) * 0.72} r={2.5} fill={m.color} fillOpacity={selected ? 1 : 0.6} />
      <EdgeLabelRenderer>
        <div className="pointer-events-none absolute" style={{ transform: `translate(-50%,-50%) translate(${mx}px, ${my}px)` }}>
          <span
            className="rounded px-1.5 py-[1px] text-[10px]"
            style={{ color: selected ? m.color : 'var(--text-faint)', background: 'rgba(10,16,26,0.92)', border: `1px solid ${selected ? m.color + '66' : 'transparent'}` }}
          >
            {data.label}
          </span>
        </div>
      </EdgeLabelRenderer>
    </>
  )
})

const nodeTypes = { entity: EntityView }
const edgeTypes = { relation: RelationView }

function GraphInner() {
  // Só as posições são salvas; os dados das entidades continuam vindo do cenário fictício.
  const [positions, setPositions] = usePersistentState<Record<string, XYPosition>>('graph.positions', {})
  const [nodes, setNodes] = useState(() => nodesInit.map((n) => (positions[n.id] ? { ...n, position: positions[n.id] } : n)))
  const [selected, setSelected] = usePersistentState<{ kind: 'node' | 'edge'; id: string } | null>('graph.selected', null)
  const [hiddenList, setHiddenList] = usePersistentState<EntityType[]>('graph.hidden', [])
  const hidden = useMemo(() => new Set(hiddenList), [hiddenList])
  const [showInference, setShowInference] = usePersistentState('graph.showInference', true)
  const [showLegend, setShowLegend] = usePersistentState('graph.showLegend', true)
  const [showInspector, setShowInspector] = usePersistentState('graph.showInspector', true)

  const visibleNodes = useMemo(() => nodes.filter((n) => !hidden.has(n.data.type)), [nodes, hidden])
  const visibleIds = new Set(visibleNodes.map((n) => n.id))
  const edges = edgesInit
    .filter((e) => visibleIds.has(e.source) && visibleIds.has(e.target) && (showInference || e.data?.kind !== 'inferencia'))
    .map((e) => ({ ...e, selected: selected?.kind === 'edge' && selected.id === e.id }))
  const rfNodes = visibleNodes.map((n) => ({ ...n, selected: selected?.kind === 'node' && selected.id === n.id }))

  const selNode = selected?.kind === 'node' ? nodes.find((n) => n.id === selected.id) : undefined
  const selEdge = selected?.kind === 'edge' ? edgesInit.find((e) => e.id === selected.id) : undefined
  const label = (id: string) => nodes.find((n) => n.id === id)?.data.label ?? id

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-wrap items-center gap-1.5 border-b border-line bg-bg-elev px-4 py-2.5">
        <span className="mr-1 text-[11px] uppercase tracking-[0.1em] text-faint">Entidades</span>
        {(Object.keys(typeMeta) as EntityType[]).map((t) => (
          <Chip
            key={t}
            active={!hidden.has(t)}
            onClick={() => setHiddenList((h) => (h.includes(t) ? h.filter((x) => x !== t) : [...h, t]))}
          >
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: typeMeta[t].color }} />
            {typeMeta[t].label}
          </Chip>
        ))}
        <span className="mx-1 h-4 w-px bg-line-strong" />
        <Chip active={showInference} onClick={() => setShowInference((v) => !v)}>Mostrar inferências</Chip>
      </div>
      <div className="relative min-h-0 flex-1">
        <ReactFlow
          nodes={rfNodes}
          edges={edges}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          onNodesChange={(ch) => {
            setNodes((ns) => applyNodeChanges(ch.filter((c) => c.type !== 'select'), ns))
            const moved = ch.flatMap((c) => (c.type === 'position' && c.position ? [[c.id, c.position] as const] : []))
            if (moved.length) setPositions((p) => ({ ...p, ...Object.fromEntries(moved) }))
          }}
          onNodeClick={(_, n) => setSelected({ kind: 'node', id: n.id })}
          onEdgeClick={(_, e) => setSelected({ kind: 'edge', id: e.id })}
          onPaneClick={() => setSelected(null)}
          nodesConnectable={false}
          fitView
          fitViewOptions={{ padding: 0.12 }}
          minZoom={0.3}
        >
          <Background variant={BackgroundVariant.Dots} gap={22} size={1} color="rgba(148,173,207,0.12)" />
          <Controls position="bottom-left" showInteractive={false} />
        </ReactFlow>

        <div className={cx('absolute left-3 top-3 rounded-xl text-[11.5px]', showLegend && 'glass px-3 py-2.5')}>
          <div id="graph-relation-legend" aria-hidden={!showLegend} className={showLegend ? 'visible' : 'invisible pointer-events-none'}>
            {(Object.keys(relMeta) as RelationKind[]).map((k) => (
              <div key={k} className="flex items-center gap-2 py-0.5 text-muted">
                <svg width="26" height="6"><line x1="0" y1="3" x2="26" y2="3" stroke={relMeta[k].color} strokeWidth="1.6" strokeDasharray={relMeta[k].dash} /></svg>
                {relMeta[k].label}
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setShowLegend((visible) => !visible)}
            className={cx('glass absolute flex items-center justify-center text-muted transition hover:text-fg', showLegend ? 'right-1 top-1 h-5 w-5 rounded-md' : 'left-0 top-0 h-8 w-8 rounded-lg')}
            style={showLegend ? { border: 'none', boxShadow: 'none', background: 'transparent' } : undefined}
            aria-label={showLegend ? 'Ocultar legenda de relações' : 'Exibir legenda de relações'}
            aria-expanded={showLegend}
            aria-controls="graph-relation-legend"
            title={showLegend ? 'Ocultar legenda' : 'Exibir legenda'}
          >
            {showLegend ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
          </button>
        </div>

        <aside
          id="graph-inspector"
          className={cx('absolute bottom-3 right-3 top-3 flex flex-col rounded-2xl', showInspector ? 'glass w-[340px] overflow-visible' : 'pointer-events-none w-0')}
        >
          {showInspector && (
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl">
              <header className="flex items-center justify-between border-b border-line px-4 py-3">
                <span className="text-[11px] font-medium uppercase tracking-[0.12em] text-faint">{selEdge ? 'Relação' : selNode ? 'Entidade' : 'Grafo de conhecimento'}</span>
                {selected && (
                  <button onClick={() => setSelected(null)} className="rounded p-1 text-muted hover:bg-white/5 hover:text-fg" aria-label="Limpar seleção">
                    <X size={15} />
                  </button>
                )}
              </header>
              <div className="min-h-0 flex-1 overflow-y-auto p-4 text-[13px]">
                {selEdge?.data ? (
                  <div className="space-y-4">
                    <div>
                      <Badge tone={selEdge.data.kind === 'inferencia' ? 'violet' : selEdge.data.kind === 'aprovado' ? 'success' : 'neutral'}>{relMeta[selEdge.data.kind].label}</Badge>
                      <div className="mt-2 text-[14px] font-medium">
                        {label(selEdge.source)} <span className="text-accent">{selEdge.data.label}</span> {label(selEdge.target)}
                      </div>
                    </div>
                    <div className="rounded-xl border border-line bg-surface/70 p-3">
                      <div className="mb-1 text-[11px] uppercase tracking-[0.1em] text-faint">Significado</div>
                      <p className="leading-relaxed">{selEdge.data.meaning}</p>
                    </div>
                    <div>
                      <div className="mb-1 text-[11px] uppercase tracking-[0.1em] text-faint">Proveniência</div>
                      <Field label="Origem">{selEdge.data.source}</Field>
                      <Field label="Registrado por">{selEdge.data.recordedBy}</Field>
                      <Field label="Quando">{selEdge.data.at}</Field>
                    </div>
                    {selEdge.data.kind === 'inferencia' && (
                      <div className="rounded-lg border border-violet/30 bg-violet/[0.07] p-3 text-[12px] leading-relaxed text-violet">
                        Relação inferida pela IA. Não é tratada como fato até ser validada por uma pessoa.
                      </div>
                    )}
                  </div>
                ) : selNode ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-9 w-9 items-center justify-center rounded-full" style={{ background: `${typeMeta[selNode.data.type].color}1f`, color: typeMeta[selNode.data.type].color }}>
                        {(() => { const I = typeMeta[selNode.data.type].icon; return <I size={16} /> })()}
                      </span>
                      <div>
                        <div className="text-[10.5px] uppercase tracking-[0.1em]" style={{ color: typeMeta[selNode.data.type].color }}>{typeMeta[selNode.data.type].label}</div>
                        <div className="text-[14px] font-medium">{selNode.data.label}</div>
                      </div>
                    </div>
                    <div>{selNode.data.attrs.map(([k, v]) => <Field key={k} label={k}>{v}</Field>)}</div>
                    <div>
                      <div className="mb-2 text-[11px] uppercase tracking-[0.1em] text-faint">Relações</div>
                      <ul className="space-y-1.5">
                        {edgesInit.filter((e) => e.source === selNode.id || e.target === selNode.id).map((e) => (
                          <li key={e.id}>
                            <button onClick={() => setSelected({ kind: 'edge', id: e.id })} className="w-full rounded-lg border border-line bg-surface/60 p-2.5 text-left text-[12px] text-muted hover:border-line-strong">
                              {label(e.source)} <span style={{ color: relMeta[e.data!.kind].color }}>{e.data!.label}</span> {label(e.target)}
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3 leading-relaxed text-muted">
                    <p>Fatos e relações registrados ou extraídos das fontes da empresa, centrados na análise de fornecedor T-1042.</p>
                    <p className="flex gap-2 rounded-lg border border-line p-3 text-[12px] text-faint">
                      <Info size={13} className="mt-0.5 shrink-0" />
                      O grafo mostra o que se sabe e de onde veio. As regras de acesso e de trabalho ficam no Canvas de conexões.
                    </p>
                    <p className="text-[12px] text-faint">Selecione uma entidade ou relação para ver significado e origem.</p>
                  </div>
                )}
              </div>
            </div>
          )}
          <button
            type="button"
            onClick={() => setShowInspector((visible) => !visible)}
            className="glass pointer-events-auto absolute -left-7 top-1/2 flex h-9 w-7 -translate-y-1/2 items-center justify-center rounded-l-lg text-muted transition hover:text-fg"
            aria-label={showInspector ? 'Ocultar painel de detalhes' : 'Exibir painel de detalhes'}
            aria-expanded={showInspector}
            aria-controls="graph-inspector"
            title={showInspector ? 'Ocultar painel' : 'Exibir painel'}
          >
            {showInspector ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>
        </aside>
      </div>
    </div>
  )
}

export default function GraphPage() {
  return (
    <ReactFlowProvider>
      <GraphInner />
    </ReactFlowProvider>
  )
}
