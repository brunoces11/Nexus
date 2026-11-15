import { useState } from 'react'
import { Link } from 'react-router'
import { ArrowDown, Bot, Network, Search } from 'lucide-react'
import { agents, bases, nameOf } from '../data/mock'
import type { KnowledgeBase, ProcessingState, Sensitivity } from '../data/types'
import { AgentChip, Badge, Chip, Dot, Drawer, Field, Meter, PageHeader } from '../components/ui'

const stateMeta: Record<ProcessingState, { label: string; tone: 'success' | 'accent' | 'blue' | 'danger' }> = {
  processado: { label: 'Processado', tone: 'success' },
  processando: { label: 'Processando', tone: 'accent' },
  atualizando: { label: 'Atualização contínua', tone: 'blue' },
  erro: { label: 'Falha na validação', tone: 'danger' },
}

const sensTone: Record<Sensitivity, 'neutral' | 'blue' | 'warning' | 'danger'> = {
  'Pública interna': 'neutral',
  Interna: 'neutral',
  Confidencial: 'warning',
  Restrita: 'danger',
}

const usedBy = (id: string) => agents.filter((a) => a.bases.includes(id))

function Layers({ b }: { b: KnowledgeBase }) {
  const layers = [
    { title: 'Fonte original', body: `${b.origin} · ${b.items}`, tone: 'border-line-strong' },
    { title: 'Pré-processamento e regras', body: b.preprocessing.join(' · '), tone: 'border-violet/30' },
    { title: 'Representação organizada', body: `Versão ${b.version} · qualidade ${b.quality}% · atualizado ${b.updatedAt.toLowerCase()}`, tone: 'border-accent/30' },
    { title: 'Entidades e relações', body: b.entities.join(' · '), tone: 'border-teal/30' },
  ]
  return (
    <div className="space-y-1">
      {layers.map((l, i) => (
        <div key={l.title}>
          <div className={`rounded-xl border bg-surface-2/60 p-3 ${l.tone}`}>
            <div className="text-[11px] font-medium uppercase tracking-[0.08em] text-faint">{l.title}</div>
            <div className="mt-1 text-[12.5px] leading-relaxed text-fg">{l.body}</div>
          </div>
          {i < layers.length - 1 && <ArrowDown size={13} className="mx-auto my-0.5 text-faint" />}
        </div>
      ))}
    </div>
  )
}

export default function DataPage() {
  const [q, setQ] = useState('')
  const [sens, setSens] = useState<Sensitivity | null>(null)
  const [open, setOpen] = useState<KnowledgeBase | null>(null)
  const rows = bases.filter((b) => b.name.toLowerCase().includes(q.toLowerCase()) && (!sens || b.sensitivity === sens))

  return (
    <div className="pb-10">
      <PageHeader
        eyebrow="Gestão"
        title="Dados e conhecimento"
        subtitle="Fontes corporativas, estado de processamento, qualidade, sensibilidade e onde cada base é usada. Nenhuma fonte real está conectada."
        actions={
          <Link to="/grafo" className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-line-strong px-3 text-[13px] hover:bg-white/[0.04]">
            <Network size={14} /> Explorar grafo
          </Link>
        }
      />
      <div className="flex flex-wrap items-center gap-2 px-6 pb-4">
        <div className="flex h-8 w-64 items-center gap-2 rounded-lg border border-line bg-surface px-2.5 focus-within:border-accent/40">
          <Search size={13} className="text-faint" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar fonte" className="w-full bg-transparent text-[12.5px] outline-none placeholder:text-faint" />
        </div>
        <Chip active={!sens} onClick={() => setSens(null)}>Todas</Chip>
        {(['Interna', 'Confidencial', 'Restrita'] as Sensitivity[]).map((s) => (
          <Chip key={s} active={sens === s} onClick={() => setSens(s)}>{s}</Chip>
        ))}
      </div>
      <div className="px-6">
        <div className="overflow-x-auto rounded-xl border border-line bg-surface">
          <table className="w-full min-w-[920px] text-left text-[12.5px]">
            <thead className="border-b border-line text-[11px] uppercase tracking-[0.06em] text-faint">
              <tr>
                {['Fonte', 'Estado', 'Versão', 'Qualidade', 'Sensibilidade', 'Responsável', 'Usada por'].map((h) => (
                  <th key={h} className="px-4 py-2.5 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.map((b) => (
                <tr key={b.id} onClick={() => setOpen(b)} className="cursor-pointer hover:bg-white/[0.02]">
                  <td className="px-4 py-3">
                    <div className="font-medium text-fg">{b.name}</div>
                    <div className="text-[11px] text-faint">{b.kind} · {b.items}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Dot tone={stateMeta[b.state].tone} pulse={b.state === 'processando'} />
                      <span className="text-muted">{stateMeta[b.state].label}</span>
                    </div>
                    <div className="mt-0.5 text-[11px] text-faint">{b.updatedAt}</div>
                  </td>
                  <td className="px-4 py-3 font-mono text-[11.5px] text-muted">{b.version}</td>
                  <td className="w-36 px-4 py-3">
                    <div className="mb-1 text-[11.5px] text-muted">{b.quality}%</div>
                    <Meter value={b.quality} tone="accent" />
                  </td>
                  <td className="px-4 py-3"><Badge tone={sensTone[b.sensitivity]}>{b.sensitivity}</Badge></td>
                  <td className="px-4 py-3 text-muted">{nameOf(b.owner)}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {usedBy(b.id).map((a) => <AgentChip key={a.id} name={a.name} compact />)}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Drawer open={!!open} onClose={() => setOpen(null)} title={open?.name} subtitle={open && `${open.kind} · ${open.origin}`} width={460}>
        {open && (
          <div className="space-y-5 p-5">
            <div>
              <Field label="Estado"><Badge tone={stateMeta[open.state].tone}>{stateMeta[open.state].label}</Badge></Field>
              <Field label="Sensibilidade"><Badge tone={sensTone[open.sensitivity]}>{open.sensitivity}</Badge></Field>
              <Field label="Responsável">{nameOf(open.owner)}</Field>
              <Field label="Atualização">{open.updatedAt}</Field>
            </div>
            <div>
              <div className="mb-2 text-[11px] font-medium uppercase tracking-[0.1em] text-faint">Proveniência em camadas</div>
              <Layers b={open} />
            </div>
            <div>
              <div className="mb-2 text-[11px] font-medium uppercase tracking-[0.1em] text-faint">Onde é usada</div>
              {usedBy(open.id).map((a) => (
                <div key={a.id} className="mb-1.5 flex items-center gap-2 rounded-lg border border-line bg-surface-2/50 px-3 py-2 text-[12.5px]">
                  <Bot size={13} className="text-accent" /> {a.name}
                  <span className="ml-auto text-[11px] text-faint">{a.users.length} usuários</span>
                </div>
              ))}
            </div>
            {open.state === 'erro' && (
              <div className="rounded-xl border border-danger/30 bg-danger/[0.06] p-3 text-[12.5px] text-danger">
                3 registros com código de ativo inválido foram retidos no pré-processamento e não alimentam a base. Tarefa T-1056 aberta para correção.
              </div>
            )}
            <Link to="/grafo" className="inline-flex items-center gap-1.5 text-[12.5px] text-accent">
              <Network size={13} /> Ver entidades desta base no grafo
            </Link>
          </div>
        )}
      </Drawer>
    </div>
  )
}
