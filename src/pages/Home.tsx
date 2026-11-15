import { useState } from 'react'
import { Link } from 'react-router'
import { AlertTriangle, ArrowRight, Bot, Database, Loader2, ListChecks, SendHorizonal, ShieldCheck, Sparkles, type LucideIcon } from 'lucide-react'
import { activity, agentById, executions, nameOf, teams } from '../data/mock'
import type { ActivityItem } from '../data/types'
import { AgentChip, Avatar, Badge, Card, Chip, Dot, SimulatedNote, cx } from '../components/ui'
import { priorityTone } from './Kanban'
import { useNexus } from '../store'

const SUGGESTION = 'O que precisa da minha atenção hoje?'

const attentionAnswer = [
  { text: 'Parecer de fornecedor da T-1042 aguarda sua revisão. A exploração do agente registrou 2 atrasos do fornecedor que não aparecem na entrega.', link: '/tarefas/T-1042', tone: 'warning' as const },
  { text: 'T-1051 é crítica: vibração 38% acima da média no TR-07. O Agente de Manutenção Preditiva ainda está analisando as leituras.', link: '/tarefas/T-1051', tone: 'danger' as const },
  { text: 'T-1047 está atrasada. A última execução do Agente Regulatório falhou porque a base estava em reindexação.', link: '/tarefas/T-1047', tone: 'warning' as const },
  { text: 'Inventário de Ativos tem 3 registros que falharam na validação e não alimentam a base.', link: '/dados', tone: 'neutral' as const },
]

const kindMeta: Record<ActivityItem['kind'], { icon: LucideIcon; tone: string; label: string }> = {
  agente: { icon: Bot, tone: 'text-accent', label: 'Agentes' },
  tarefa: { icon: ListChecks, tone: 'text-sky-300', label: 'Tarefas' },
  dados: { icon: Database, tone: 'text-teal', label: 'Dados' },
  revisao: { icon: ShieldCheck, tone: 'text-violet', label: 'Revisões' },
  alerta: { icon: AlertTriangle, tone: 'text-warning', label: 'Alertas' },
}

function Kpi({ label, value, hint, tone }: { label: string; value: string | number; hint: string; tone?: string }) {
  return (
    <div className="panel rounded-xl p-4">
      <div className="text-[11.5px] text-faint">{label}</div>
      <div className={cx('mt-1 text-2xl font-semibold tracking-tight', tone)}>{value}</div>
      <div className="mt-0.5 text-[11px] text-muted">{hint}</div>
    </div>
  )
}

function AskAI() {
  const [state, setState] = useState<'idle' | 'thinking' | 'answered' | 'unscripted'>('idle')
  const [q, setQ] = useState('')
  const run = (question = q) => {
    if (!question.trim()) return
    setState('thinking')
    setTimeout(() => setState(question === SUGGESTION ? 'answered' : 'unscripted'), 900)
  }
  return (
    <div className="glass mt-5 max-w-3xl rounded-2xl p-3">
      <form
        onSubmit={(e) => {
          e.preventDefault()
          run()
        }}
        className="flex items-center gap-2 px-1"
      >
        <Sparkles size={16} className="shrink-0 text-accent" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Pergunte à IA sobre a operação…" className="w-full bg-transparent py-1.5 text-[14px] outline-none placeholder:text-faint" />
        <button type="submit" className="text-accent" aria-label="Enviar"><SendHorizonal size={16} /></button>
      </form>
      {state === 'idle' && (
        <div className="mt-2 flex flex-wrap gap-1.5 px-1">
          <button onClick={() => { setQ(SUGGESTION); run(SUGGESTION) }} className="rounded-full border border-accent/25 bg-accent/[0.06] px-2.5 py-1 text-[11.5px] text-accent hover:bg-accent/15">
            {SUGGESTION}
          </button>
        </div>
      )}
      {state === 'unscripted' && (
        <div className="fade-in mt-3 flex items-center justify-between gap-3 border-t border-line px-1 pt-3 text-[12.5px] text-muted">
          <span>Nesta demonstração, apenas a pergunta sugerida tem resposta roteirizada.</span>
          <button onClick={() => { setQ(SUGGESTION); run(SUGGESTION) }} className="shrink-0 text-[12px] text-accent">Usar sugestão</button>
        </div>
      )}
      {state === 'thinking' && (
        <div className="mt-3 flex items-center gap-2 px-1 pb-1 text-[12px] text-accent">
          <Loader2 size={13} className="animate-spin" /> Consultando tarefas, execuções e bases autorizadas…
        </div>
      )}
      {state === 'answered' && (
        <div className="fade-in mt-3 space-y-1.5 border-t border-line px-1 pt-3">
          {attentionAnswer.map((a) => (
            <Link key={a.text} to={a.link} className="group flex items-start gap-2.5 rounded-lg p-2 text-[13px] leading-relaxed hover:bg-white/[0.04]">
              <span className="mt-2"><Dot tone={a.tone} /></span>
              <span className="flex-1 text-fg">{a.text}</span>
              <ArrowRight size={14} className="mt-1 shrink-0 text-faint group-hover:text-accent" />
            </Link>
          ))}
          <div className="flex items-center justify-between px-2 pt-1">
            <SimulatedNote>Resposta simulada a partir dos dados fictícios da demonstração.</SimulatedNote>
            <button onClick={() => { setState('idle'); setQ('') }} className="text-[11px] text-muted hover:text-fg">Limpar</button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function Home() {
  const tasks = useNexus((s) => s.tasks)
  const [kind, setKind] = useState<ActivityItem['kind'] | null>(null)
  const open = tasks.filter((t) => t.column !== 'concluido')
  const critical = open.filter((t) => t.priority === 'crítica' || t.priority === 'alta' || t.overdue)
  const running = executions.filter((e) => e.state === 'em_execucao')
  const failed = executions.filter((e) => e.state === 'falha')
  const feed = activity.filter((a) => !kind || a.kind === kind)
  const usage = [
    { team: 't-sup', runs: 42 },
    { team: 't-man', runs: 67 },
    { team: 't-ops', runs: 118 },
    { team: 't-reg', runs: 19 },
  ]
  const maxRuns = Math.max(...usage.map((u) => u.runs))

  return (
    <div className="pb-10">
      <section className="atmos border-b border-line px-6 pb-8 pt-8">
        <div className="relative z-10">
          <div className="text-[11px] font-medium uppercase tracking-[0.16em] text-accent/80">Visão executiva · terça, 04/11</div>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">Bom dia, Rafael.</h1>
          <p className="mt-1 max-w-2xl text-[13.5px] text-muted">
            {open.length} tarefas abertas, {tasks.filter((t) => t.column === 'revisao').length} entrega aguardando sua revisão e {running.length} agentes em execução agora.
          </p>
          <AskAI />
        </div>
      </section>

      <div className="space-y-5 px-6 pt-6">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
          <Kpi label="Tarefas abertas" value={open.length} hint="em 4 equipes" />
          <Kpi label="Revisões pendentes" value={tasks.filter((t) => t.column === 'revisao').length} hint="entregas aguardando você" tone="text-warning" />
          <Kpi label="Agentes em execução" value={running.length} hint="vinculados a tarefas e rotinas" tone="text-accent" />
          <Kpi label="Execuções com falha" value={failed.length} hint="últimos 7 dias" tone="text-danger" />
          <Kpi label="Tempo médio de ciclo" value="4,2 d" hint="tarefas concluídas em outubro" />
        </div>

        <div className="grid gap-5 xl:grid-cols-3">
          <Card title="Tarefas críticas e atrasadas" action={<Link to="/tarefas" className="text-[12px] text-accent">Kanban</Link>}>
            <ul className="divide-y divide-line">
              {critical.map((t) => (
                <li key={t.id}>
                  <Link to={`/tarefas/${t.id}`} className="flex items-start gap-3 px-4 py-3 hover:bg-white/[0.02]">
                    <Avatar id={t.assignee} size={26} />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[13px] text-fg">{t.title}</div>
                      <div className="mt-0.5 truncate text-[11.5px] text-faint">{t.lastEvent}</div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <Badge tone={priorityTone[t.priority]}>{t.priority}</Badge>
                      {t.overdue && <span className="text-[10.5px] text-danger">atrasada</span>}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </Card>

          <Card title="Agentes em atividade" action={<Link to="/agentes" className="text-[12px] text-accent">Agentes</Link>}>
            <ul className="divide-y divide-line">
              {executions.slice(0, 5).map((e) => {
                const tone = e.state === 'em_execucao' ? 'accent' : e.state === 'falha' ? 'danger' : e.state === 'aprovada' ? 'success' : 'neutral'
                const label = { em_execucao: 'Em execução', concluida: 'Concluída · aguarda aprovação', aprovada: 'Resultado aprovado', falha: 'Falhou' }[e.state]
                return (
                  <li key={e.id} className="px-4 py-3">
                    <div className="flex items-center justify-between gap-2">
                      <AgentChip name={agentById(e.agent)!.name} compact />
                      <span className="font-mono text-[10.5px] text-faint">{e.id}</span>
                    </div>
                    <div className="mt-1.5 text-[12.5px] text-muted">{e.summary}</div>
                    <div className="mt-1.5 flex items-center gap-2 text-[11px]">
                      <Dot tone={tone} pulse={e.state === 'em_execucao'} />
                      <span className="text-muted">{label}</span>
                      <span className="text-faint">· {e.invokedBy.startsWith('p-') ? nameOf(e.invokedBy) : e.invokedBy}</span>
                    </div>
                  </li>
                )
              })}
            </ul>
          </Card>

          <Card title="Uso de agentes por equipe" action={<span className="text-[11px] text-faint">execuções · outubro</span>}>
            <div className="space-y-3.5 p-4">
              {usage.map((u) => (
                <div key={u.team}>
                  <div className="mb-1 flex justify-between text-[12px]">
                    <span className="text-muted">{teams.find((t) => t.id === u.team)?.name}</span>
                    <span className="font-mono text-faint">{u.runs}</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
                    <div className="h-full rounded-full bg-accent/70" style={{ width: `${(u.runs / maxRuns) * 100}%` }} />
                  </div>
                </div>
              ))}
              <p className="pt-1 text-[11px] leading-relaxed text-faint">
                Volume de execuções indica adoção, não desempenho individual. A triagem automática responde pela maior parte do uso no Centro de Operações.
              </p>
            </div>
          </Card>
        </div>

        <Card title="Atividade recente">
          <div className="flex flex-wrap gap-1.5 border-b border-line px-4 py-3">
            <Chip active={!kind} onClick={() => setKind(null)}>Tudo</Chip>
            {(Object.keys(kindMeta) as ActivityItem['kind'][]).map((k) => (
              <Chip key={k} active={kind === k} onClick={() => setKind(k)}>{kindMeta[k].label}</Chip>
            ))}
          </div>
          <div className="p-4">
            {(['Hoje', 'Ontem', 'Esta semana'] as const).map((g) => {
              const items = feed.filter((a) => a.group === g)
              if (!items.length) return null
              return (
                <div key={g} className="mb-4 last:mb-0">
                  <div className="mb-2 text-[11px] font-medium uppercase tracking-[0.1em] text-faint">{g}</div>
                  <div className="space-y-1.5">
                    {items.map((a) => {
                      const m = kindMeta[a.kind]
                      return (
                        <Link key={a.id} to={a.link ?? '#'} className="flex items-center gap-3 rounded-lg border border-line bg-surface-2/50 px-3 py-2.5 hover:border-line-strong">
                          <m.icon size={15} className={cx('shrink-0', m.tone)} />
                          <span className="flex-1 text-[13px] text-fg">{a.text}</span>
                          <span className="font-mono text-[11px] text-faint">{a.at}</span>
                        </Link>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      </div>
    </div>
  )
}
