import { useCallback, useMemo, useState, type DragEvent } from 'react'
import { Link, useOutletContext } from 'react-router'
import {
  Background,
  BackgroundVariant,
  ConnectionMode,
  Controls,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
  type Connection,
} from '@xyflow/react'
import { AlertTriangle, ArrowRight, GripVertical, Info, PanelRightOpen, Plus, Search, Trash2, X } from 'lucide-react'
import NexusNodeView, { stateMeta, useNodeState } from '../canvas/NexusNodeView'
import VerbEdgeView from '../canvas/VerbEdgeView'
import {
  categoryMeta,
  kindMeta,
  resolveVerb,
  verbSentence,
  type EdgeCategory,
  type LibraryItem,
  type NexusNode,
  type NodeKind,
  type VerbEdge,
} from '../canvas/model'
import { agents, baseById, bases, agentById, people, personById, routineById, routines, skillById, skills, teams, tasks, nameOf } from '../data/mock'
import { Badge, Button, cx, kindIcon } from '../components/ui'
import { useNexus, usePersistentState } from '../store'
import type { CanvasLayoutContext } from '../components/Shell'

const nodeTypes = { nexus: NexusNodeView }
const edgeTypes = { verb: VerbEdgeView }

const library: LibraryItem[] = [
  ...people.map((p) => ({ kind: 'pessoa' as const, label: p.name, subtitle: p.role, refId: p.id })),
  ...teams.map((t) => ({ kind: 'equipe' as const, label: t.name, subtitle: 'Equipe' })),
  ...agents.map((a) => ({ kind: 'agente' as const, label: a.name, subtitle: a.purpose.split(',')[0], refId: a.id })),
  ...skills.map((s) => ({ kind: 'skill' as const, label: s.name, subtitle: 'Skill', refId: s.id })),
  ...bases.map((b) => ({ kind: 'base' as const, label: b.name, subtitle: `${b.sensitivity} · ${b.version}`, refId: b.id })),
  ...routines.map((r) => ({ kind: 'rotina' as const, label: r.name, subtitle: r.frequency, refId: r.id })),
  ...tasks.slice(0, 5).map((t) => ({ kind: 'tarefa' as const, label: t.title, subtitle: t.id })),
  { kind: 'saida', label: 'Relatório de inspeção', subtitle: 'Exige assinatura' },
  { kind: 'saida', label: 'Nota de impacto regulatório', subtitle: 'Exige validação' },
]

const kindOrder: NodeKind[] = ['pessoa', 'equipe', 'agente', 'skill', 'base', 'rotina', 'tarefa', 'saida']

function describe(node: NexusNode): string | undefined {
  const id = node.data.refId
  if (!id) return undefined
  return agentById(id)?.purpose ?? skillById(id)?.description ?? routineById(id)?.trigger ?? (baseById(id) ? `${baseById(id)!.kind} · ${baseById(id)!.items} · origem: ${baseById(id)!.origin}` : undefined) ?? personById(id)?.role
}

function Library({ onAdd, collapsed }: { onAdd: (item: LibraryItem) => void; collapsed: boolean }) {
  const [q, setQ] = useState('')
  const filtered = library.filter((i) => i.label.toLowerCase().includes(q.toLowerCase()))
  const onDragStart = (e: DragEvent, item: LibraryItem) => {
    e.dataTransfer.setData('application/nexus', JSON.stringify(item))
    e.dataTransfer.effectAllowed = 'move'
  }
  return (
    <aside id="canvas-library" className={cx('flex shrink-0 flex-col overflow-hidden border-r border-line bg-bg-elev transition-[width] duration-200 ease-in-out', collapsed ? 'w-12' : 'w-64')}>
      {!collapsed && <div className="flex h-11 shrink-0 items-center border-b border-line px-3">
        <div className="text-[11px] font-medium uppercase tracking-[0.12em] text-faint">Biblioteca</div>
      </div>}
      {!collapsed && <>
        <div className="border-b border-line p-3">
        <div className="flex h-8 items-center gap-2 rounded-lg border border-line bg-surface px-2.5 focus-within:border-accent/40">
          <Search size={13} className="text-faint" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filtrar elementos" className="w-full bg-transparent text-[12px] outline-none placeholder:text-faint" />
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-2">
        {kindOrder.map((k) => {
          const items = filtered.filter((i) => i.kind === k)
          if (!items.length) return null
          const Icon = kindIcon[k]
          return (
            <div key={k} className="mb-3">
              <div className="flex items-center gap-1.5 px-1.5 py-1 text-[10.5px] font-medium uppercase tracking-[0.08em]" style={{ color: kindMeta[k].color }}>
                <Icon size={12} /> {kindMeta[k].plural}
              </div>
              {items.map((i) => (
                <div
                  key={i.label}
                  draggable
                  onDragStart={(e) => onDragStart(e, i)}
                  className="group flex cursor-grab items-center gap-1.5 rounded-md px-1.5 py-1.5 text-[12px] text-muted hover:bg-white/[0.04] hover:text-fg active:cursor-grabbing"
                >
                  <GripVertical size={12} className="shrink-0 text-faint opacity-0 group-hover:opacity-100" />
                  <span className="min-w-0 flex-1 truncate" title={i.label}>{i.label}</span>
                  <button onClick={() => onAdd(i)} className="rounded p-0.5 text-faint opacity-0 hover:text-accent group-hover:opacity-100" title="Adicionar ao canvas">
                    <Plus size={13} />
                  </button>
                </div>
              ))}
            </div>
          )
        })}
      </div>
      <div className="border-t border-line p-3 text-[11px] leading-relaxed text-faint">
        Arraste para o canvas e ligue a porta direita de um nó à porta esquerda de outro.
      </div>
      </>}
    </aside>
  )
}

function sentenceFor(edge: VerbEdge, nodes: NexusNode[]) {
  const s = nodes.find((n) => n.id === edge.source)
  const t = nodes.find((n) => n.id === edge.target)
  if (!s || !t || !edge.data || edge.data.verb === '?') return ''
  return verbSentence[edge.data.verb](s.data.label, t.data.label)
}

/** Bases que uma pessoa alcança através de um agente (conexões USA → CONSULTA não conflitantes). */
function reachThroughAgent(agentNodeId: string, nodes: NexusNode[], edges: VerbEdge[]) {
  return edges
    .filter((e) => e.source === agentNodeId && e.data?.verb === 'CONSULTA')
    .map((e) => ({ node: nodes.find((n) => n.id === e.target)!, blocked: e.data?.status === 'conflito' }))
    .filter((r) => r.node)
}

function NodeInspector({ node }: { node: NexusNode }) {
  const { nodes, edges, commit } = useNexus()
  const state = useNodeState(node.id, node.data.status)
  const meta = kindMeta[node.data.kind]
  const Icon = kindIcon[node.data.kind]
  const related = edges.filter((e) => e.source === node.id || e.target === node.id)
  const link = node.data.kind === 'agente' ? '/agentes' : node.data.kind === 'base' ? '/dados' : node.data.kind === 'pessoa' ? '/pessoas' : node.data.kind === 'rotina' ? '/rotinas' : node.data.kind === 'tarefa' ? '/tarefas' : undefined
  const SIcon = stateMeta[state].icon

  return (
    <div className="space-y-5">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border" style={{ color: meta.color, borderColor: `${meta.color}40`, background: `${meta.color}14` }}>
          <Icon size={18} />
        </div>
        <div className="min-w-0">
          <div className="text-[10px] uppercase tracking-[0.12em]" style={{ color: meta.color }}>{meta.label}</div>
          <div className="text-[15px] font-semibold leading-tight">{node.data.label}</div>
          <div className="text-[12px] text-faint">{node.data.subtitle}</div>
        </div>
      </div>
      <div className={cx('flex items-center gap-1.5 text-[12px]', stateMeta[state].cls)}>
        <SIcon size={13} /> {stateMeta[state].label}
      </div>
      {describe(node) && <p className="text-[13px] leading-relaxed text-muted">{describe(node)}</p>}

      <div>
        <div className="mb-2 text-[11px] font-medium uppercase tracking-[0.1em] text-faint">Conexões ({related.length})</div>
        {related.length === 0 && (
          <div className="rounded-lg border border-warning/25 bg-warning/[0.06] p-3 text-[12px] text-warning">
            Este elemento ainda não tem conexões e não terá efeito ao publicar.
          </div>
        )}
        <ul className="space-y-1.5">
          {related.map((e) => {
            const cat = categoryMeta[e.data?.status === 'conflito' ? 'indefinida' : e.data?.category ?? 'indefinida']
            return (
              <li key={e.id} className="rounded-lg border border-line bg-surface/60 p-2.5 text-[12px] leading-relaxed text-muted">
                <span className="mr-1.5 font-mono text-[10px] font-medium" style={{ color: cat.color }}>{e.data?.verb}</span>
                {sentenceFor(e, nodes)}
              </li>
            )
          })}
        </ul>
      </div>

      <div className="flex gap-2">
        {link && (
          <Link to={link} className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-line-strong px-3 text-[13px] hover:bg-white/[0.04]">
            Abrir detalhe <ArrowRight size={14} />
          </Link>
        )}
        <Button
          variant="ghost"
          icon={Trash2}
          onClick={() => commit({ nodes: nodes.filter((n) => n.id !== node.id), edges: edges.filter((e) => e.source !== node.id && e.target !== node.id) })}
        >
          Remover
        </Button>
      </div>
    </div>
  )
}

function EdgeInspector({ edge }: { edge: VerbEdge }) {
  const { nodes, edges, commit, notify } = useNexus()
  const s = nodes.find((n) => n.id === edge.source)!
  const t = nodes.find((n) => n.id === edge.target)!
  const data = edge.data!
  const conflict = data.status === 'conflito'
  const cat = categoryMeta[conflict ? 'indefinida' : data.category]
  const base = t.data.kind === 'base' && t.data.refId ? baseById(t.data.refId) : undefined
  const reach = data.verb === 'USA' ? reachThroughAgent(t.id, nodes, edges) : []

  return (
    <div className="space-y-5">
      <div>
        <div className="mb-2 flex items-center gap-2">
          <span className="rounded-md border px-2 py-0.5 font-mono text-[11px] font-semibold tracking-wider" style={{ color: cat.color, borderColor: `${cat.color}66` }}>
            {data.verb}
          </span>
          <Badge tone={conflict ? 'warning' : data.category === 'acesso' ? 'accent' : data.category === 'fluxo' ? 'violet' : 'neutral'}>
            {conflict ? 'Conflito de acesso' : categoryMeta[data.category].label}
          </Badge>
          <Badge tone={data.status === 'publicado' ? 'success' : 'neutral'}>{data.status === 'publicado' ? 'Publicado' : data.status === 'rascunho' ? 'Rascunho' : 'Bloqueado'}</Badge>
        </div>
        <div className="text-[13px] text-faint">
          {s.data.label} <ArrowRight size={12} className="inline" /> {t.data.label}
        </div>
      </div>

      <div className="rounded-xl border border-line bg-surface/70 p-3.5">
        <div className="mb-1 text-[11px] font-medium uppercase tracking-[0.1em] text-faint">Significado</div>
        <p className="text-[13.5px] leading-relaxed text-fg">{sentenceFor(edge, nodes)}</p>
      </div>

      {conflict && data.note && (
        <div className="flex gap-2 rounded-xl border border-warning/30 bg-warning/[0.07] p-3 text-[12.5px] leading-relaxed text-warning">
          <AlertTriangle size={15} className="mt-0.5 shrink-0" />
          <div>
            {data.note}
            <div className="mt-2">
              <Button
                variant="outline"
                className="h-7 border-warning/40 text-[12px] text-warning"
                onClick={() => {
                  commit({ edges: edges.map((e) => (e.id === edge.id ? { ...e, data: { ...data, status: 'rascunho', note: 'Aprovação solicitada ao responsável pela base. Aguardando resposta.' } } : e)) })
                  notify('Solicitação de aprovação registrada (simulada).')
                }}
              >
                Solicitar aprovação
              </Button>
            </div>
          </div>
        </div>
      )}
      {!conflict && data.note && <div className="rounded-lg border border-line bg-surface/60 p-3 text-[12px] text-muted">{data.note}</div>}

      <div>
        <div className="mb-2 text-[11px] font-medium uppercase tracking-[0.1em] text-faint">Alcance</div>
        <ul className="space-y-1.5 text-[12.5px] text-muted">
          {base && (
            <>
              <li>Base com {base.items}, sensibilidade <b className="font-medium text-fg">{base.sensitivity}</b>.</li>
              <li>Responsável: {nameOf(base.owner)}.</li>
              <li>O agente recupera trechos com referência à origem; não altera a base.</li>
            </>
          )}
          {data.verb === 'USA' && (
            <>
              <li>Por meio deste agente, {s.data.label} alcança:</li>
              {reach.length === 0 && <li className="text-faint">Nenhuma base conectada ao agente.</li>}
              {reach.map((r) => (
                <li key={r.node.id} className={cx('ml-3 flex items-center gap-1.5', r.blocked && 'text-warning')}>
                  {r.blocked ? <AlertTriangle size={12} /> : <span className="h-1 w-1 rounded-full bg-accent" />}
                  {r.node.data.label} {r.blocked && '(bloqueada até aprovação)'}
                </li>
              ))}
              <li className="text-faint">O uso fica registrado na tarefa ou rotina em que ocorrer.</li>
            </>
          )}
          {data.verb === 'RECEBE' && <li>A tarefa aparece no Kanban com {s.data.label} como responsável.</li>}
          {data.verb === 'REVISA' && <li>A saída só é concluída após aprovação de {s.data.label}.</li>}
          {data.verb === 'ACIONA' && <li>Cada disparo da rotina gera um registro de execução rastreável.</li>}
          {data.verb === 'PRODUZ' && <li>A saída fica marcada como conteúdo gerado por IA até a revisão humana.</li>}
          {data.verb === 'UTILIZA' && <li>A skill opera somente sobre as bases autorizadas ao agente.</li>}
          {data.verb === 'PARTICIPA DE' && <li>Permissões da equipe passam a valer para a pessoa.</li>}
        </ul>
      </div>

      <div className="rounded-lg border border-line p-3 text-[11.5px] leading-relaxed text-faint">
        <Info size={12} className="mb-0.5 mr-1 inline" />
        Desenhar uma conexão registra uma intenção de configuração. O acesso só vale após publicação e, quando exigido, aprovação do responsável.
      </div>

      <Button variant="ghost" icon={Trash2} onClick={() => commit({ edges: edges.filter((e) => e.id !== edge.id) })}>
        Remover conexão
      </Button>
    </div>
  )
}

function FlowSummary() {
  const { nodes, edges } = useNexus()
  const conflicts = edges.filter((e) => e.data?.status === 'conflito')
  const linked = new Set(edges.flatMap((e) => [e.source, e.target]))
  const loose = nodes.filter((n) => !linked.has(n.id))
  return (
    <div className="space-y-5">
      <div>
        <div className="text-[15px] font-semibold">Avaliação de fornecedores</div>
        <p className="mt-1 text-[12.5px] leading-relaxed text-muted">
          Define quem pode usar o Agente de Pesquisa de Fornecedores, quais bases ele consulta e quem revisa o parecer.
        </p>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {[
          ['Elementos', nodes.length],
          ['Conexões', edges.length],
          ['Pendências', conflicts.length + loose.length],
        ].map(([l, v]) => (
          <div key={l} className="rounded-lg border border-line bg-surface/70 p-2.5">
            <div className="text-lg font-semibold">{v}</div>
            <div className="text-[11px] text-faint">{l}</div>
          </div>
        ))}
      </div>
      <div>
        <div className="mb-2 text-[11px] font-medium uppercase tracking-[0.1em] text-faint">Tipos de conexão</div>
        <ul className="space-y-2 text-[12px] text-muted">
          {(['acesso', 'fluxo', 'estrutura'] as EdgeCategory[]).map((c) => (
            <li key={c} className="flex items-center gap-2.5">
              <svg width="34" height="6"><line x1="0" y1="3" x2="34" y2="3" stroke={categoryMeta[c].color} strokeWidth="1.6" strokeDasharray={categoryMeta[c].dash} /></svg>
              <span className="text-fg">{categoryMeta[c].label}</span>
              <span className="text-faint">{c === 'acesso' ? 'USA · CONSULTA · UTILIZA' : c === 'fluxo' ? 'RECEBE · ACIONA · PRODUZ · REVISA' : 'PARTICIPA DE'}</span>
            </li>
          ))}
        </ul>
      </div>
      {(conflicts.length > 0 || loose.length > 0) && (
        <div>
          <div className="mb-2 text-[11px] font-medium uppercase tracking-[0.1em] text-faint">Pendências antes de publicar</div>
          <ul className="space-y-1.5 text-[12px]">
            {conflicts.map((e) => (
              <li key={e.id} className="flex gap-2 rounded-lg border border-warning/25 bg-warning/[0.06] p-2.5 text-warning">
                <AlertTriangle size={13} className="mt-0.5 shrink-0" />
                {sentenceFor(e, nodes).replace(/\.$/, '')} — sem acesso aprovado.
              </li>
            ))}
            {loose.map((n) => (
              <li key={n.id} className="rounded-lg border border-line bg-surface/60 p-2.5 text-muted">
                {n.data.label}: conexão incompleta.
              </li>
            ))}
          </ul>
        </div>
      )}
      <p className="text-[11.5px] text-faint">Selecione um nó ou uma conexão para ver propriedades, alcance e efeitos.</p>
    </div>
  )
}

function CanvasInner() {
  const { nodes, edges, onNodesChange, onEdgesChange, commit, notify } = useNexus()
  const rf = useReactFlow()
  const [inspectorOpen, setInspectorOpen] = usePersistentState('canvas.inspectorOpen', true)
  const { libraryCollapsed } = useOutletContext<CanvasLayoutContext>()

  const selectedNode = nodes.find((n) => n.selected)
  const selectedEdge = edges.find((e) => e.selected)

  const addNode = useCallback(
    (item: LibraryItem, position?: { x: number; y: number }) => {
      const pos = position ?? rf.screenToFlowPosition({ x: window.innerWidth / 2, y: window.innerHeight / 2 })
      const id = `n-${Date.now()}`
      commit({
        nodes: [
          ...nodes.map((n) => ({ ...n, selected: false })),
          { id, type: 'nexus', position: pos, selected: true, data: { kind: item.kind, label: item.label, subtitle: item.subtitle, refId: item.refId, status: 'rascunho' } },
        ],
      })
      setInspectorOpen(true)
    },
    [commit, nodes, rf],
  )

  const onDrop = useCallback(
    (e: DragEvent) => {
      e.preventDefault()
      const raw = e.dataTransfer.getData('application/nexus')
      if (!raw) return
      const item = JSON.parse(raw) as LibraryItem
      const pos = rf.screenToFlowPosition({ x: e.clientX - 114, y: e.clientY - 30 })
      addNode(item, pos)
    },
    [addNode, rf],
  )

  const onConnect = useCallback(
    (c: Connection) => {
      const s = nodes.find((n) => n.id === c.source)
      const t = nodes.find((n) => n.id === c.target)
      if (!s || !t || s.id === t.id) return
      const rule = resolveVerb(s.data.kind, t.data.kind)
      if (!rule) {
        notify(`Não há verbo para ligar ${kindMeta[s.data.kind].label} a ${kindMeta[t.data.kind].label}. Ex.: Pessoa USA Agente, Agente CONSULTA Base.`)
        return
      }
      const [src, tgt] = rule.reversed ? [t, s] : [s, t]
      if (edges.some((e) => e.source === src.id && e.target === tgt.id)) {
        notify('Essa conexão já existe.')
        return
      }
      let status: 'rascunho' | 'conflito' = 'rascunho'
      let note: string | undefined
      if (rule.verb === 'CONSULTA' && tgt.data.refId) {
        const base = baseById(tgt.data.refId)
        const agent = src.data.refId ? agentById(src.data.refId) : undefined
        if (base && agent && !agent.bases.includes(base.id) && (base.sensitivity === 'Restrita' || base.sensitivity === 'Confidencial')) {
          status = 'conflito'
          note = `Base ${base.sensitivity.toLowerCase()}. A conexão exige aprovação de ${nameOf(base.owner)} (responsável pela base).`
        }
      }
      commit({
        edges: [
          ...edges.map((e) => ({ ...e, selected: false })),
          { id: `e-${Date.now()}`, source: src.id, target: tgt.id, type: 'verb', selected: true, data: { verb: rule.verb, category: rule.category, status, note } },
        ],
        nodes: nodes.map((n) => ({ ...n, selected: false })),
      })
      setInspectorOpen(true)
    },
    [commit, edges, nodes, notify],
  )

  const minimapColor = useMemo(() => (n: { data?: unknown }) => kindMeta[((n.data as { kind?: NodeKind })?.kind ?? 'tarefa')].color, [])

  return (
    <div className="flex h-full flex-col">
      <div className="flex min-h-0 flex-1">
        <Library onAdd={(i) => addNode(i)} collapsed={libraryCollapsed} />
        <div className="relative min-w-0 flex-1" onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move' }} onDrop={onDrop}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            connectionMode={ConnectionMode.Loose}
            fitView
            fitViewOptions={{ padding: 0.15 }}
            minZoom={0.3}
            maxZoom={1.8}
            proOptions={{ hideAttribution: false }}
            deleteKeyCode={['Backspace', 'Delete']}
          >
            <Background variant={BackgroundVariant.Dots} gap={22} size={1} color="rgba(148,173,207,0.16)" />
            <Controls position="bottom-left" showInteractive={false} />
            <MiniMap position="bottom-right" pannable zoomable nodeColor={minimapColor} maskColor="rgba(6,10,17,0.7)" style={{ width: 160, height: 100, marginRight: inspectorOpen ? 372 : 16 }} />
          </ReactFlow>

          {inspectorOpen ? (
            <aside className="glass slide-in absolute bottom-3 right-3 top-3 flex w-[356px] flex-col overflow-hidden rounded-2xl">
              <header className="flex items-center justify-between border-b border-line px-4 py-3">
                <span className="text-[11px] font-medium uppercase tracking-[0.12em] text-faint">
                  {selectedEdge ? 'Conexão' : selectedNode ? 'Propriedades' : 'Resumo do fluxo'}
                </span>
                <button onClick={() => setInspectorOpen(false)} className="rounded p-1 text-muted hover:bg-white/5 hover:text-fg" aria-label="Fechar inspetor">
                  <X size={15} />
                </button>
              </header>
              <div className="min-h-0 flex-1 overflow-y-auto p-4">
                {selectedEdge ? <EdgeInspector edge={selectedEdge} /> : selectedNode ? <NodeInspector node={selectedNode} /> : <FlowSummary />}
              </div>
            </aside>
          ) : (
            <button onClick={() => setInspectorOpen(true)} className="glass absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] text-muted hover:text-fg">
              <PanelRightOpen size={14} /> Inspetor
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default function CanvasPage() {
  return (
    <ReactFlowProvider>
      <CanvasInner />
    </ReactFlowProvider>
  )
}
