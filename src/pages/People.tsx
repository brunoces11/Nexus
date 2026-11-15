import { useState } from 'react'
import { Link } from 'react-router'
import { agentById, people, teamById, teams } from '../data/mock'
import type { Person } from '../data/types'
import { AgentChip, Avatar, Badge, Chip, Drawer, Field, Meter, PageHeader } from '../components/ui'
import { columns } from './Kanban'
import { useNexus } from '../store'

export default function People() {
  const tasks = useNexus((s) => s.tasks)
  const [team, setTeam] = useState<string | null>(null)
  const [open, setOpen] = useState<Person | null>(null)
  const rows = people.filter((p) => !team || p.team === team)
  const openTasks = (id: string) => tasks.filter((t) => t.assignee === id && t.column !== 'concluido')

  return (
    <div className="pb-10">
      <PageHeader eyebrow="Gestão" title="Pessoas" subtitle="Equipes, funções, carga de trabalho e agentes habilitados para cada pessoa." />
      <div className="flex flex-wrap gap-2 px-6 pb-4">
        <Chip active={!team} onClick={() => setTeam(null)} count={people.length}>Todas</Chip>
        {teams.map((t) => (
          <Chip key={t.id} active={team === t.id} onClick={() => setTeam(t.id)} count={people.filter((p) => p.team === t.id).length}>
            {t.name}
          </Chip>
        ))}
      </div>
      <div className="px-6">
        <div className="overflow-x-auto rounded-xl border border-line bg-surface">
          <table className="w-full min-w-[860px] text-left text-[12.5px]">
            <thead className="border-b border-line text-[11px] uppercase tracking-[0.06em] text-faint">
              <tr>
                {['Pessoa', 'Equipe', 'Carga estimada', 'Tarefas abertas', 'Agentes habilitados'].map((h) => (
                  <th key={h} className="px-4 py-2.5 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.map((p) => (
                <tr key={p.id} onClick={() => setOpen(p)} className="cursor-pointer hover:bg-white/[0.02]">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <Avatar id={p.id} size={30} />
                      <div>
                        <div className="font-medium text-fg">{p.name} {p.isManager && <Badge tone="violet" className="ml-1">gestor</Badge>}</div>
                        <div className="text-[11px] text-faint">{p.role}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted">{teamById(p.team)?.name}</td>
                  <td className="w-44 px-4 py-3">
                    <div className="mb-1 text-[11.5px] text-muted">{p.load}%</div>
                    <Meter value={p.load} />
                  </td>
                  <td className="px-4 py-3 text-muted">{openTasks(p.id).length}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {p.agents.map((a) => <AgentChip key={a} name={agentById(a)!.name} compact />)}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-[11px] text-faint">Carga estimada a partir de tarefas e prazos atribuídos; não mede desempenho individual.</p>
      </div>

      <Drawer open={!!open} onClose={() => setOpen(null)} title={open?.name} subtitle={open?.role}>
        {open && (
          <div className="space-y-5 p-5">
            <div className="flex items-center gap-3">
              <Avatar id={open.id} size={44} />
              <div className="flex-1">
                <Field label="Equipe">{teamById(open.team)?.name}</Field>
                <Field label="Carga">{open.load}%</Field>
              </div>
            </div>
            <div>
              <div className="mb-2 text-[11px] font-medium uppercase tracking-[0.1em] text-faint">Tarefas abertas</div>
              {openTasks(open.id).length === 0 && <div className="text-[12.5px] text-faint">Nenhuma tarefa aberta.</div>}
              {openTasks(open.id).map((t) => (
                <Link key={t.id} to={`/tarefas/${t.id}`} className="mb-1.5 block rounded-lg border border-line bg-surface-2/50 px-3 py-2 hover:border-line-strong">
                  <div className="flex items-center justify-between text-[11px] text-faint">
                    <span className="font-mono">{t.id}</span>
                    <span>{columns.find((c) => c.id === t.column)?.label}</span>
                  </div>
                  <div className="text-[12.5px] text-fg">{t.title}</div>
                </Link>
              ))}
            </div>
            <div>
              <div className="mb-2 text-[11px] font-medium uppercase tracking-[0.1em] text-faint">Agentes habilitados</div>
              {open.agents.map((a) => (
                <div key={a} className="mb-1.5 rounded-lg border border-line bg-surface-2/50 px-3 py-2 text-[12.5px]">
                  <AgentChip name={agentById(a)!.name} />
                  <div className="mt-1 text-[11.5px] text-muted">{agentById(a)!.purpose}</div>
                </div>
              ))}
              <Link to="/canvas" className="text-[12px] text-accent">Ver conexões no canvas</Link>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  )
}
