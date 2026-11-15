import { useState } from 'react'
import { Link } from 'react-router'
import { Bot, Database, Users, Wrench } from 'lucide-react'
import { agents, baseById, executions, nameOf, routineById, skillById, skills } from '../data/mock'
import type { Agent, AgentStatus, ExecutionState } from '../data/types'
import { Badge, Dot, Drawer, Tabs } from '../components/ui'

const statusMeta: Record<AgentStatus, { label: string; tone: 'accent' | 'success' | 'neutral' }> = {
  em_execucao: { label: 'Em execução', tone: 'accent' },
  disponivel: { label: 'Disponível', tone: 'success' },
  pausado: { label: 'Pausado', tone: 'neutral' },
}

export const execMeta: Record<ExecutionState, { label: string; tone: 'accent' | 'neutral' | 'success' | 'danger' }> = {
  em_execucao: { label: 'Em execução', tone: 'accent' },
  concluida: { label: 'Concluída · aguarda aprovação', tone: 'neutral' },
  aprovada: { label: 'Resultado aprovado', tone: 'success' },
  falha: { label: 'Falhou', tone: 'danger' },
}

function AgentCard({ a, onOpen }: { a: Agent; onOpen: () => void }) {
  const runs = executions.filter((e) => e.agent === a.id)
  const s = statusMeta[a.status]
  return (
    <button onClick={onOpen} className="panel group flex flex-col rounded-xl p-4 text-left transition hover:border-line-strong">
      <div className="flex items-start justify-between gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-accent/30 bg-accent/10 text-accent group-hover:shadow-[0_0_16px_rgba(34,211,238,0.25)]">
          <Bot size={17} />
        </span>
        <span className="flex items-center gap-1.5 text-[11.5px] text-muted">
          <Dot tone={s.tone} pulse={a.status === 'em_execucao'} /> {s.label}
        </span>
      </div>
      <div className="mt-3 text-[14px] font-medium">{a.name}</div>
      <p className="mt-1 text-[12.5px] leading-relaxed text-muted">{a.purpose}</p>
      <div className="mt-3 flex flex-wrap gap-1">
        {a.skills.map((k) => <Badge key={k} tone="violet" icon={Wrench}>{skillById(k)?.name}</Badge>)}
        {a.bases.map((b) => <Badge key={b} tone="neutral" icon={Database}>{baseById(b)?.name}</Badge>)}
      </div>
      <div className="mt-auto flex items-center justify-between border-t border-line pt-3 text-[11.5px] text-faint" style={{ marginTop: 16 }}>
        <span className="inline-flex items-center gap-1"><Users size={12} /> {a.users.length} usuários</span>
        <span>{runs.length} execuções recentes</span>
      </div>
    </button>
  )
}

export default function Agents() {
  const [tab, setTab] = useState<'catalogo' | 'skills' | 'execucoes'>('catalogo')
  const [open, setOpen] = useState<Agent | null>(null)

  return (
    <div className="pb-10">
      <div className="px-6">
        <Tabs
          tabs={[
            { id: 'catalogo', label: 'Catálogo', count: agents.length },
            { id: 'skills', label: 'Skills', count: skills.length },
            { id: 'execucoes', label: 'Execuções', count: executions.length },
          ]}
          value={tab}
          onChange={setTab}
        />
      </div>
      <div className="px-6 pt-5">
        {tab === 'catalogo' && (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {agents.map((a) => <AgentCard key={a.id} a={a} onOpen={() => setOpen(a)} />)}
          </div>
        )}
        {tab === 'skills' && (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {skills.map((s) => (
              <div key={s.id} className="panel rounded-xl p-4">
                <div className="flex items-center gap-2 text-[13.5px] font-medium"><Wrench size={14} className="text-violet" /> {s.name}</div>
                <p className="mt-1.5 text-[12.5px] leading-relaxed text-muted">{s.description}</p>
                <div className="mt-3 text-[11.5px] text-faint">Usada por: {agents.filter((a) => a.skills.includes(s.id)).map((a) => a.name).join(', ')}</div>
              </div>
            ))}
          </div>
        )}
        {tab === 'execucoes' && (
          <div className="overflow-x-auto rounded-xl border border-line bg-surface">
            <table className="w-full min-w-[820px] text-left text-[12.5px]">
              <thead className="border-b border-line text-[11px] uppercase tracking-[0.06em] text-faint">
                <tr>{['Execução', 'Agente', 'Contexto', 'Invocada por', 'Início', 'Estado'].map((h) => <th key={h} className="px-4 py-2.5 font-medium">{h}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-line">
                {executions.map((e) => (
                  <tr key={e.id}>
                    <td className="px-4 py-3 font-mono text-[11.5px] text-muted">{e.id}</td>
                    <td className="px-4 py-3">{nameOf(e.agent)}</td>
                    <td className="px-4 py-3">
                      {e.task ? <Link to={`/tarefas/${e.task}`} className="text-accent">{e.task}</Link> : '—'}
                      <div className="text-[11px] text-faint">{e.summary}</div>
                    </td>
                    <td className="px-4 py-3 text-muted">{e.invokedBy.startsWith('p-') ? nameOf(e.invokedBy) : e.invokedBy}</td>
                    <td className="px-4 py-3 text-muted">{e.startedAt}</td>
                    <td className="px-4 py-3"><span className="flex items-center gap-1.5"><Dot tone={execMeta[e.state].tone} pulse={e.state === 'em_execucao'} /> {execMeta[e.state].label}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Drawer open={!!open} onClose={() => setOpen(null)} title={open?.name} subtitle={open && statusMeta[open.status].label} width={480}>
        {open && (
          <div className="space-y-5 p-5 text-[13px]">
            <div>
              <div className="mb-1 text-[11px] font-medium uppercase tracking-[0.1em] text-faint">Propósito</div>
              <p className="leading-relaxed text-fg">{open.purpose}</p>
            </div>
            <div>
              <div className="mb-1 text-[11px] font-medium uppercase tracking-[0.1em] text-faint">Instruções (conceituais)</div>
              <p className="rounded-lg border border-line bg-surface-2/60 p-3 font-mono text-[11.5px] leading-relaxed text-muted">{open.instructions}</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="mb-1.5 text-[11px] font-medium uppercase tracking-[0.1em] text-faint">Skills</div>
                {open.skills.map((s) => <div key={s} className="text-[12.5px] text-violet">{skillById(s)?.name}</div>)}
              </div>
              <div>
                <div className="mb-1.5 text-[11px] font-medium uppercase tracking-[0.1em] text-faint">Bases autorizadas</div>
                {open.bases.map((b) => <div key={b} className="text-[12.5px] text-teal">{baseById(b)?.name}</div>)}
              </div>
              <div>
                <div className="mb-1.5 text-[11px] font-medium uppercase tracking-[0.1em] text-faint">Usuários</div>
                {open.users.map((u) => <div key={u} className="text-[12.5px] text-muted">{nameOf(u)}</div>)}
              </div>
              <div>
                <div className="mb-1.5 text-[11px] font-medium uppercase tracking-[0.1em] text-faint">Rotinas</div>
                {open.routines.map((r) => <div key={r} className="text-[12.5px] text-muted">{routineById(r)?.name}</div>)}
              </div>
            </div>
            <div>
              <div className="mb-2 text-[11px] font-medium uppercase tracking-[0.1em] text-faint">Execuções</div>
              {executions.filter((e) => e.agent === open.id).map((e) => (
                <div key={e.id} className="mb-1.5 rounded-lg border border-line bg-surface-2/50 px-3 py-2">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-mono text-faint">{e.id} · {e.startedAt}</span>
                    <Badge tone={execMeta[e.state].tone}>{execMeta[e.state].label}</Badge>
                  </div>
                  <div className="mt-1 text-[12.5px] text-muted">{e.summary}</div>
                </div>
              ))}
            </div>
            <Link to="/canvas" className="text-[12px] text-accent">Ver todas as conexões no canvas</Link>
          </div>
        )}
      </Drawer>
    </div>
  )
}
