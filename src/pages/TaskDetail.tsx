import { useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router'
import {
  ArrowLeft,
  Bot,
  CheckCircle2,
  ClipboardList,
  Database,
  FileText,
  Flag,
  GitCompare,
  Lightbulb,
  Loader2,
  Lock,
  MessageSquare,
  MessageSquarePlus,
  PackageCheck,
  PlusCircle,
  SendHorizonal,
  ShieldCheck,
  Sparkles,
  UserCheck,
  type LucideIcon,
} from 'lucide-react'
import {
  agentById,
  conversationT1042,
  deliveryT1042,
  evidencesT1042,
  executions,
  findingsT1042,
  managerAnswersT1042,
  nameOf,
  personById,
  routineById,
  timelineT1042,
} from '../data/mock'
import type { ScriptedAnswer, Task, TimelineEvent, TimelineKind } from '../data/types'
import { AgentChip, Avatar, Badge, Button, Card, SimulatedNote, Tabs, cx } from '../components/ui'
import { columns, priorityTone } from './Kanban'
import { useNexus, type FindingAction } from '../store'

const kindIcon: Record<TimelineKind, LucideIcon> = {
  solicitacao: ClipboardList,
  atribuicao: UserCheck,
  agente: Bot,
  conversa: MessageSquare,
  dados: Database,
  saida: Sparkles,
  decisao: Flag,
  entrega: PackageCheck,
  revisao: ShieldCheck,
}

function genericTimeline(t: Task): TimelineEvent[] {
  const ev: TimelineEvent[] = [
    { id: 'g1', at: 'Criação', kind: 'solicitacao', actor: 'p-rafael', actorType: 'pessoa', title: t.routine ? `Criada pela rotina “${routineById(t.routine)?.name}”` : 'Tarefa criada', detail: t.context },
    { id: 'g2', at: 'Atribuição', kind: 'atribuicao', actor: 'p-rafael', actorType: 'pessoa', title: `Atribuída a ${nameOf(t.assignee)} · prazo ${t.due}` },
  ]
  if (t.agents.length) ev.push({ id: 'g3', at: 'Execução', kind: 'agente', actor: t.assignee, actorType: 'pessoa', title: `Agentes envolvidos: ${t.agents.map((a) => agentById(a)?.name).join(', ')}` })
  ev.push({ id: 'g4', at: 'Último evento', kind: 'revisao', actor: 'sistema', actorType: 'sistema', title: t.lastEvent })
  return ev
}

function Timeline({ events }: { events: TimelineEvent[] }) {
  return (
    <ol className="relative space-y-1 pl-2">
      {events.map((e, i) => {
        const Icon = kindIcon[e.kind]
        const tone = e.actorType === 'agente' ? 'text-accent border-accent/30 bg-accent/10' : e.actorType === 'pessoa' ? 'text-sky-300 border-sky-400/30 bg-sky-400/10' : 'text-muted border-line-strong bg-white/[0.04]'
        return (
          <li key={e.id} className="relative flex gap-3.5 pb-4">
            {i < events.length - 1 && <span className="absolute left-[13px] top-8 h-[calc(100%-24px)] w-px bg-line-strong" />}
            <span className={cx('relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border', tone)}>
              <Icon size={14} />
            </span>
            <div className="min-w-0 flex-1 pt-0.5">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <span className="text-[13px] font-medium text-fg">{e.title}</span>
                <Badge tone={e.actorType === 'agente' ? 'accent' : e.actorType === 'pessoa' ? 'blue' : 'neutral'}>
                  {e.actorType === 'sistema' ? 'Sistema' : nameOf(e.actor).replace('Agente de ', 'Agente · ')}
                </Badge>
              </div>
              <div className="font-mono text-[10.5px] text-faint">{e.at}</div>
              {e.detail && <p className="mt-1 text-[12.5px] leading-relaxed text-muted">{e.detail}</p>}
              {e.refs && (
                <div className="mt-1.5 flex flex-wrap gap-1">
                  {e.refs.map((r) => (
                    <span key={r} className="rounded border border-line px-1.5 py-0.5 font-mono text-[10px] text-muted">{r}</span>
                  ))}
                </div>
              )}
            </div>
          </li>
        )
      })}
    </ol>
  )
}

function EmployeeConversation({ assignee }: { assignee: string }) {
  return (
    <div className="space-y-4">
      <div className="flex gap-2.5 rounded-xl border border-line bg-surface-2/60 p-3 text-[12px] leading-relaxed text-muted">
        <Lock size={14} className="mt-0.5 shrink-0 text-accent" />
        <div>
          Acesso autorizado porque você é o revisor desta tarefa (política <span className="text-fg">Supervisão de tarefa</span>).
          {' '}{nameOf(assignee)} é notificada e o acesso fica na trilha de auditoria. Conversas fora do contexto da tarefa não aparecem aqui.
        </div>
      </div>
      <div className="space-y-3">
        {conversationT1042.map((m, i) => {
          const human = m.from === 'pessoa'
          return (
            <div key={i} className={cx('flex gap-2.5', human ? '' : 'flex-row-reverse')}>
              {human ? (
                <Avatar id={m.author} size={26} />
              ) : (
                <span className="flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-full border border-accent/30 bg-accent/10 text-accent"><Bot size={13} /></span>
              )}
              <div className={cx('max-w-[78%] rounded-xl border px-3 py-2', human ? 'border-line bg-surface-2' : 'border-accent/20 bg-accent/[0.05]')}>
                <div className="mb-0.5 flex items-center gap-2 text-[10.5px] text-faint">
                  <span>{human ? personById(m.author)?.name : 'Agente de Pesquisa'}</span>
                  <span className="font-mono">{m.at}</span>
                  {m.flag === 'inferencia' && <Badge tone="violet">contém inferência</Badge>}
                  {m.flag === 'nao_verificado' && <Badge tone="warning">não verificado</Badge>}
                </div>
                <p className="text-[13px] leading-relaxed text-fg">{m.text}</p>
                {m.sources && (
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {m.sources.map((s) => (
                      <span key={s} className="inline-flex items-center gap-1 rounded border border-line px-1.5 py-0.5 font-mono text-[10px] text-muted">
                        <FileText size={9} /> {s}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function Evidences() {
  const typeLabel = { documento: 'Documento', registro: 'Registro', saida_agente: 'Saída do agente', entrega: 'Entrega humana' } as const
  const typeTone = { documento: 'neutral', registro: 'neutral', saida_agente: 'accent', entrega: 'blue' } as const
  return (
    <div className="grid gap-2.5 md:grid-cols-2">
      {evidencesT1042.map((e) => (
        <div key={e.id} className="rounded-xl border border-line bg-surface-2/60 p-3.5">
          <div className="mb-1.5 flex items-center justify-between gap-2">
            <Badge tone={typeTone[e.type]}>{typeLabel[e.type]}</Badge>
            <span className="text-[10.5px] text-faint">{e.source}</span>
          </div>
          <div className="text-[13px] font-medium">{e.title}</div>
          <p className="mt-1 text-[12px] leading-relaxed text-muted">{e.excerpt}</p>
          <div className="mt-2 text-[11px] text-faint">Usado por: {e.usedBy}</div>
        </div>
      ))}
    </div>
  )
}

const coverageMeta = {
  incluido: { label: 'Incluído na entrega', tone: 'success' },
  parcial: { label: 'Parcialmente incluído', tone: 'blue' },
  nao_incluido: { label: 'Não incluído na entrega', tone: 'warning' },
} as const

function Comparison() {
  const { findingActions, toggleFinding, notify } = useNexus()
  const counts = {
    incluido: findingsT1042.filter((f) => f.coverage === 'incluido').length,
    parcial: findingsT1042.filter((f) => f.coverage === 'parcial').length,
    nao: findingsT1042.filter((f) => f.coverage === 'nao_incluido').length,
  }
  const actions: { id: FindingAction; label: string; icon: LucideIcon; msg: string }[] = [
    { id: 'marcado', label: 'Marcar achado', icon: Flag, msg: 'Achado marcado para acompanhamento.' },
    { id: 'complemento', label: 'Pedir complemento', icon: MessageSquarePlus, msg: 'Pedido de complemento registrado para Ana Ribeiro (simulado).' },
    { id: 'incorporado', label: 'Incorporar à tarefa', icon: PlusCircle, msg: 'Achado incorporado ao contexto da tarefa (simulado).' },
  ]
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2 text-[12px]">
        <span className="text-muted">5 achados na execução EX-3391:</span>
        <Badge tone="success">{counts.incluido} incluídos</Badge>
        <Badge tone="blue">{counts.parcial} parcial</Badge>
        <Badge tone="warning">{counts.nao} não incluídos</Badge>
      </div>
      <div className="rounded-lg border border-line px-3 py-2 text-[11.5px] leading-relaxed text-faint">
        A comparação mostra diferenças e referências; não indica erro. Um achado pode ter ficado de fora por decisão não registrada.
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        <div>
          <div className="mb-2 flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.1em] text-accent">
            <Bot size={13} /> Exploração do agente
          </div>
          <div className="space-y-2.5">
            {findingsT1042.map((f) => {
              const active = findingActions[f.id] ?? []
              const cm = coverageMeta[f.coverage]
              return (
                <div key={f.id} className={cx('rounded-xl border p-3.5', f.coverage === 'nao_incluido' ? 'border-warning/25 bg-warning/[0.04]' : 'border-line bg-surface-2/60')}>
                  <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
                    <span className="font-mono text-[10.5px] text-faint">{f.id.toUpperCase()}</span>
                    <Badge tone={f.kind === 'fato' ? 'neutral' : 'violet'}>{f.kind === 'fato' ? 'Fato com fonte' : 'Inferência'}</Badge>
                    <Badge tone={cm.tone}>{cm.label}</Badge>
                  </div>
                  <p className="text-[13px] leading-relaxed text-fg">{f.text}</p>
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {f.sources.map((s) => (
                      <span key={s} className="rounded border border-line px-1.5 py-0.5 font-mono text-[10px] text-muted">{s}</span>
                    ))}
                  </div>
                  {f.deliveryRef && <div className="mt-1.5 text-[11px] text-faint">Na entrega: {f.deliveryRef}</div>}
                  {f.coverage !== 'incluido' && (
                    <div className="mt-2.5 flex flex-wrap gap-1.5">
                      {actions.map((a) => {
                        const on = active.includes(a.id)
                        return (
                          <button
                            key={a.id}
                            onClick={() => {
                              toggleFinding(f.id, a.id)
                              if (!on) notify(a.msg)
                            }}
                            className={cx(
                              'inline-flex h-7 items-center gap-1 rounded-md border px-2 text-[11.5px] transition',
                              on ? 'border-accent/40 bg-accent/10 text-accent' : 'border-line-strong text-muted hover:text-fg',
                            )}
                          >
                            {on ? <CheckCircle2 size={12} /> : <a.icon size={12} />} {a.label}
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
        <div>
          <div className="mb-2 flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.1em] text-sky-300">
            <PackageCheck size={13} /> Entrega de Ana Ribeiro
          </div>
          <div className="rounded-xl border border-line bg-surface p-4">
            <div className="flex items-center justify-between">
              <div className="text-[14px] font-semibold">{deliveryT1042.title}</div>
              <span className="font-mono text-[10.5px] text-faint">{deliveryT1042.sentAt}</span>
            </div>
            <div className="mt-3 space-y-3.5">
              {deliveryT1042.sections.map((s, i) => (
                <div key={s.h}>
                  <div className="text-[12px] font-medium text-muted">{s.h}</div>
                  <p className="mt-0.5 text-[13px] leading-relaxed text-fg">
                    {i === 3 ? (
                      <>
                        Recomenda-se a Atlas como fornecedora principal, considerando melhor preço e{' '}
                        <mark className="rounded bg-warning/15 px-0.5 text-warning">histórico de entregas satisfatório</mark>.
                      </>
                    ) : (
                      s.p
                    )}
                  </p>
                  {i === 3 && (
                    <div className="mt-1.5 text-[11.5px] text-warning/90">
                      Afirmação sem fonte correspondente na execução. O C-2024-042 registra 2 atrasos (achado F3).
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

type ChatItem = { role: 'gestor'; text: string } | { role: 'agente'; answer?: ScriptedAnswer; text?: string }

function AnswerBlock({ a }: { a: ScriptedAnswer }) {
  const Section = ({ icon: Icon, title, items, tone }: { icon: LucideIcon; title: string; items: string[]; tone: string }) =>
    items.length ? (
      <div>
        <div className={cx('mb-1 flex items-center gap-1.5 text-[10.5px] font-medium uppercase tracking-[0.08em]', tone)}>
          <Icon size={11} /> {title}
        </div>
        <ul className="space-y-1">
          {items.map((t) => (
            <li key={t} className="text-[12.5px] leading-relaxed text-fg">{t}</li>
          ))}
        </ul>
      </div>
    ) : null
  return (
    <div className="space-y-2.5">
      <Section icon={FileText} title="Evidência registrada" items={a.evidence} tone="text-success" />
      <Section icon={Lightbulb} title="Inferência" items={a.inference} tone="text-violet" />
      <Section icon={Flag} title="Sem informação" items={a.missing} tone="text-warning" />
      <div className="flex flex-wrap gap-1 pt-0.5">
        {a.sources.map((s) => (
          <span key={s} className="rounded border border-line px-1.5 py-0.5 font-mono text-[10px] text-muted">{s}</span>
        ))}
      </div>
    </div>
  )
}

function ManagerChat({ task }: { task: Task }) {
  const exec = executions.find((e) => e.task === task.id)
  const agent = agentById(exec?.agent ?? task.agents[0] ?? '')
  const scripted = task.id === 'T-1042' ? managerAnswersT1042 : []
  const [items, setItems] = useState<ChatItem[]>([])
  const [thinking, setThinking] = useState(false)
  const [input, setInput] = useState('')
  const notify = useNexus((s) => s.notify)
  const end = useRef<HTMLDivElement>(null)

  useEffect(() => end.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }), [items, thinking])

  const ask = (q: string) => {
    if (thinking) return
    const answer = scripted.find((s) => s.question === q)
    setItems((i) => [...i, { role: 'gestor', text: q }])
    setThinking(true)
    setTimeout(() => {
      setThinking(false)
      setItems((i) => [
        ...i,
        answer
          ? { role: 'agente', answer }
          : { role: 'agente', text: 'Nesta demonstração as respostas são roteirizadas. Use uma das perguntas sugeridas para ver como o agente separa evidência, inferência e ausência de informação.' },
      ])
    }, 900)
  }

  if (!agent) {
    return (
      <div className="glass flex h-full flex-col items-center justify-center rounded-2xl p-6 text-center text-[13px] text-muted">
        <Bot size={22} className="mb-2 text-faint" />
        Nenhum agente foi usado nesta tarefa.
      </div>
    )
  }

  const asked = new Set(items.filter((i) => i.role === 'gestor').map((i) => (i as { text: string }).text))

  return (
    <div className="glass flex h-full flex-col overflow-hidden rounded-2xl">
      <header className="border-b border-line px-4 py-3">
        <div className="flex items-center gap-2 text-[13px] font-medium">
          <span className="flex h-6 w-6 items-center justify-center rounded-md border border-accent/30 bg-accent/10 text-accent"><Bot size={13} /></span>
          Conversar sobre a execução
        </div>
        <div className="mt-1 text-[11px] text-faint">
          {agent.name} · {exec ? <span className="font-mono">{exec.id}</span> : 'sem execução registrada'}
        </div>
      </header>
      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4">
        <div className="rounded-lg border border-line bg-surface/60 p-3 text-[11.5px] leading-relaxed text-muted">
          Nova conversa vinculada ao registro da execução e às fontes recuperáveis. Não é uma continuação da conversa de {nameOf(task.assignee).split(' ')[0]}; o agente não lembra de nada além do que foi registrado.
        </div>
        {items.map((it, i) =>
          it.role === 'gestor' ? (
            <div key={i} className="ml-8 rounded-xl border border-line bg-surface-2 px-3 py-2 text-[13px]">{it.text}</div>
          ) : (
            <div key={i} className="mr-4 rounded-xl border border-accent/20 bg-accent/[0.04] px-3 py-2.5">
              {it.answer ? <AnswerBlock a={it.answer} /> : <p className="text-[12.5px] leading-relaxed text-muted">{it.text}</p>}
              <div className="mt-2.5 flex items-center justify-between border-t border-line pt-2">
                <SimulatedNote>Resposta simulada</SimulatedNote>
                <div className="flex gap-1">
                  <button onClick={() => notify('Anotação adicionada à tarefa (simulado).')} className="rounded px-1.5 py-0.5 text-[11px] text-muted hover:bg-white/5 hover:text-fg">Anotar</button>
                  <button onClick={() => notify('Revisão solicitada à responsável (simulado).')} className="rounded px-1.5 py-0.5 text-[11px] text-muted hover:bg-white/5 hover:text-fg">Solicitar revisão</button>
                </div>
              </div>
            </div>
          ),
        )}
        {thinking && (
          <div className="flex items-center gap-2 text-[12px] text-accent">
            <Loader2 size={13} className="animate-spin" /> Consultando o registro da execução…
          </div>
        )}
        <div ref={end} />
      </div>
      <div className="border-t border-line p-3">
        {scripted.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-1.5">
            {scripted.filter((s) => !asked.has(s.question)).map((s) => (
              <button key={s.question} onClick={() => ask(s.question)} className="rounded-full border border-accent/25 bg-accent/[0.06] px-2.5 py-1 text-[11.5px] text-accent hover:bg-accent/15">
                {s.question}
              </button>
            ))}
          </div>
        )}
        <form
          onSubmit={(e) => {
            e.preventDefault()
            if (!input.trim()) return
            ask(input.trim())
            setInput('')
          }}
          className="flex items-center gap-2 rounded-xl border border-line-strong bg-surface px-3 py-2 focus-within:border-accent/40"
        >
          <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Pergunte sobre esta execução…" className="w-full bg-transparent text-[13px] outline-none placeholder:text-faint" />
          <button type="submit" className="text-accent disabled:opacity-40" disabled={!input.trim()} aria-label="Enviar">
            <SendHorizonal size={16} />
          </button>
        </form>
      </div>
    </div>
  )
}

type TabId = 'timeline' | 'conversa' | 'evidencias' | 'comparacao'

export default function TaskDetail() {
  const { id } = useParams()
  const { tasks, moveTask, notify } = useNexus()
  const task = tasks.find((t) => t.id === id)
  const [tab, setTab] = useState<TabId>('timeline')

  if (!task) {
    return (
      <div className="p-10 text-muted">
        Tarefa não encontrada. <Link to="/tarefas" className="text-accent">Voltar ao Kanban</Link>
      </div>
    )
  }

  const rich = task.id === 'T-1042'
  const col = columns.find((c) => c.id === task.column)!
  const tabs: { id: TabId; label: string; count?: number }[] = [
    { id: 'timeline', label: 'Linha do tempo', count: rich ? timelineT1042.length : undefined },
    { id: 'conversa', label: 'Conversa com o agente', count: rich ? conversationT1042.length : undefined },
    { id: 'evidencias', label: 'Evidências', count: rich ? evidencesT1042.length : task.evidences },
    { id: 'comparacao', label: 'Agente × entrega' },
  ]

  return (
    <div className="grid gap-4 p-4 md:p-6 lg:h-full lg:grid-cols-[minmax(0,1fr)_400px] lg:overflow-hidden">
      <div className="min-w-0 space-y-4 lg:overflow-y-auto lg:pr-1">
        <Link to="/tarefas" className="inline-flex items-center gap-1.5 text-[12px] text-muted hover:text-fg">
          <ArrowLeft size={14} /> Kanban operacional
        </Link>
        <Card className="p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="mb-1.5 flex flex-wrap items-center gap-2">
                <span className="font-mono text-[11px] text-faint">{task.id}</span>
                <Badge tone={priorityTone[task.priority]}>{task.priority}</Badge>
                <Badge tone={task.column === 'revisao' ? 'warning' : task.column === 'concluido' ? 'success' : 'neutral'}>{col.label}</Badge>
              </div>
              <h1 className="text-[19px] font-semibold leading-snug">{task.title}</h1>
              <p className="mt-1.5 max-w-3xl text-[13px] leading-relaxed text-muted">{task.context}</p>
            </div>
            {task.column === 'revisao' && (
              <div className="flex gap-2">
                <Button variant="outline" icon={MessageSquarePlus} onClick={() => notify('Pedido de complemento enviado (simulado).')}>
                  Pedir complemento
                </Button>
                <Button
                  variant="primary"
                  icon={CheckCircle2}
                  onClick={() => {
                    moveTask(task.id, 'concluido')
                    notify('Entrega aprovada na demonstração. Tarefa movida para Concluído.')
                  }}
                >
                  Aprovar entrega
                </Button>
              </div>
            )}
          </div>
          <div className="mt-4 grid grid-cols-2 gap-4 border-t border-line pt-4 text-[12px] md:grid-cols-4">
            <div>
              <div className="mb-1 text-faint">Responsável</div>
              <div className="flex items-center gap-2"><Avatar id={task.assignee} size={22} /> {nameOf(task.assignee)}</div>
            </div>
            <div>
              <div className="mb-1 text-faint">Agentes</div>
              <div className="flex flex-wrap gap-1">{task.agents.length ? task.agents.map((a) => <AgentChip key={a} name={agentById(a)!.name} compact />) : <span className="text-muted">Nenhum</span>}</div>
            </div>
            <div>
              <div className="mb-1 text-faint">Prazo</div>
              <div className={cx(task.overdue && 'text-danger')}>{task.due}{task.overdue && ' · atrasada'}</div>
            </div>
            <div>
              <div className="mb-1 text-faint">Rotina</div>
              <div className="text-muted">{task.routine ? routineById(task.routine)?.name : 'Avulsa'}</div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="px-4">
            <Tabs tabs={tabs} value={tab} onChange={setTab} />
          </div>
          <div className="p-5">
            {tab === 'timeline' && <Timeline events={rich ? timelineT1042 : genericTimeline(task)} />}
            {tab === 'conversa' && (rich ? <EmployeeConversation assignee={task.assignee} /> : <Empty icon={MessageSquare} text="Nenhuma conversa vinculada foi registrada nesta tarefa da demonstração." />)}
            {tab === 'evidencias' && (rich ? <Evidences /> : <Empty icon={FileText} text={`${task.evidences} evidências vinculadas. O detalhe está roteirizado apenas para a T-1042.`} />)}
            {tab === 'comparacao' && (rich ? <Comparison /> : <Empty icon={GitCompare} text="Sem entrega final registrada para comparar." />)}
          </div>
        </Card>
      </div>
      <div className="min-h-[560px] lg:min-h-0">
        <ManagerChat task={task} />
      </div>
    </div>
  )
}

function Empty({ icon: Icon, text }: { icon: LucideIcon; text: string }) {
  return (
    <div className="flex flex-col items-center gap-2 py-10 text-center text-[13px] text-muted">
      <Icon size={20} className="text-faint" />
      {text}
      <Link to="/tarefas/T-1042" className="text-[12px] text-accent">Ver exemplo completo na T-1042</Link>
    </div>
  )
}
