import { useState } from 'react'
import { DndContext, DragOverlay, PointerSensor, useDraggable, useDroppable, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core'
import { Bot, ChevronRight, Clock3, GripVertical, ListChecks, ShieldCheck, Zap } from 'lucide-react'
import { agentById, nameOf } from '../data/mock'
import type { Routine } from '../data/types'
import { AgentChip, Avatar, Drawer, PageHeader, cx } from '../components/ui'
import { useNexus } from '../store'

const columns: { id: Routine['state']; label: string; description: string; color: string }[] = [
  { id: 'rascunho', label: 'Rascunhos', description: 'Em preparação', color: 'bg-sky-400' },
  { id: 'ativa', label: 'Ativas', description: 'Rotinas em operação', color: 'bg-success' },
  { id: 'pausada', label: 'Pausadas', description: 'Temporariamente suspensas', color: 'bg-warning' },
]

function RoutineCard({ routine, onOpen, overlay = false }: { routine: Routine; onOpen?: () => void; overlay?: boolean }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: routine.id, disabled: overlay })
  return (
    <article ref={setNodeRef} className={cx('rounded-xl border border-line bg-surface-2 p-4 shadow-sm transition hover:border-line-strong', isDragging && 'opacity-30', overlay && 'rotate-1 border-accent/50 shadow-[0_0_24px_rgba(34,211,238,0.2)]')}>
      <div className="mb-3 flex items-start justify-between gap-2">
        <span className="rounded-md border border-accent/20 bg-accent/[0.07] px-2 py-1 text-[10px] font-medium uppercase tracking-wider text-accent">Rotina</span>
        {!overlay && <button type="button" {...attributes} {...listeners} aria-label={`Arrastar ${routine.name}`} className="touch-none cursor-grab rounded p-1 text-faint hover:bg-white/5 hover:text-fg active:cursor-grabbing"><GripVertical size={16} /></button>}
      </div>
      <button type="button" onClick={onOpen} className="block w-full text-left text-[14px] font-semibold leading-snug text-fg hover:text-accent">{routine.name}</button>
      <div className="mt-3 space-y-2 text-[12px] text-muted">
        <div className="flex items-start gap-2"><Zap size={13} className="mt-0.5 shrink-0 text-warning" /><span>{routine.trigger}</span></div>
        <div className="flex items-start gap-2"><Clock3 size={13} className="mt-0.5 shrink-0 text-faint" /><span>{routine.frequency}</span></div>
      </div>
      <div className="mt-4 flex flex-wrap gap-1">{routine.agents.map((id) => <AgentChip key={id} name={agentById(id)?.name ?? id} compact />)}</div>
      <div className="mt-4 flex items-center justify-between border-t border-line pt-3">
        <div className="flex -space-x-1.5">{routine.owners.map((id) => <Avatar key={id} id={id} size={25} ring />)}</div>
        <span className="inline-flex items-center gap-1.5 text-[11px] text-faint"><ListChecks size={13} /> {routine.steps.length} etapas</span>
      </div>
    </article>
  )
}

function Column({ column, routines, onOpen }: { column: typeof columns[number]; routines: Routine[]; onOpen: (id: string) => void }) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id })
  return (
    <section className="flex w-[310px] shrink-0 flex-col rounded-2xl border border-line bg-white/[0.025] p-3">
      <div className="flex items-start justify-between px-1 pb-4 pt-1">
        <div><div className="flex items-center gap-2 text-[13px] font-semibold"><span className={cx('h-2 w-2 rounded-full', column.color)} />{column.label}<span className="rounded-md bg-white/[0.06] px-1.5 py-0.5 text-[11px] font-normal text-muted">{routines.length}</span></div><p className="ml-4 mt-1 text-[11px] text-faint">{column.description}</p></div>
      </div>
      <div ref={setNodeRef} className={cx('flex min-h-[220px] flex-1 flex-col gap-2.5 rounded-xl transition', isOver && 'bg-accent/[0.06] ring-1 ring-accent/30')}>
        {routines.map((routine) => <RoutineCard key={routine.id} routine={routine} onOpen={() => onOpen(routine.id)} />)}
        {routines.length === 0 && <div className="rounded-xl border border-dashed border-line-strong px-4 py-7 text-center text-[12px] text-faint">Arraste uma rotina para cá</div>}
      </div>
    </section>
  )
}

export default function Routines() {
  const { routines, moveRoutine, notify } = useNexus()
  const [activeId, setActiveId] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }))
  const active = routines.find((routine) => routine.id === activeId)
  const selected = routines.find((routine) => routine.id === selectedId)
  const move = (id: string, state: Routine['state']) => {
    const routine = routines.find((item) => item.id === id)
    if (!routine || routine.state === state) return
    moveRoutine(id, state)
    notify(`Rotina movida para “${columns.find((column) => column.id === state)?.label}” (alteração local da demonstração).`)
  }
  const onDragEnd = (event: DragEndEvent) => {
    setActiveId(null)
    const column = columns.find((item) => item.id === event.over?.id)
    if (column) move(String(event.active.id), column.id)
  }
  return (
    <div className="flex min-h-full flex-col pb-6">
      <PageHeader eyebrow="Gestão" title="Rotinas" subtitle="Organize processos recorrentes e acompanhe seus responsáveis, agentes e etapas." />
      <div className="flex flex-wrap items-center justify-between gap-3 px-6 pb-5">
        <div className="flex items-center gap-2 text-[12px] text-muted"><span className="rounded-lg border border-accent/25 bg-accent/[0.07] px-3 py-1.5 text-accent">Quadro de rotinas</span><span className="text-faint">{routines.length} rotinas</span></div>
        <span className="text-[11px] text-faint">Arraste os cartões entre as colunas · alterações locais</span>
      </div>
      <DndContext sensors={sensors} onDragStart={(event) => setActiveId(String(event.active.id))} onDragEnd={onDragEnd} onDragCancel={() => setActiveId(null)}>
        <div className="flex flex-1 items-stretch gap-3 overflow-x-auto px-6 pb-2">{columns.map((column) => <Column key={column.id} column={column} routines={routines.filter((routine) => routine.state === column.id)} onOpen={setSelectedId} />)}</div>
        <DragOverlay>{active && <RoutineCard routine={active} overlay />}</DragOverlay>
      </DndContext>
      <Drawer open={!!selected} onClose={() => setSelectedId(null)} title={selected?.name} subtitle="Detalhes da rotina · demonstração" width={500}>
        {selected && <div className="space-y-6 p-5 text-[13px]">
          <div><label htmlFor="routine-state" className="mb-2 block text-[11px] uppercase tracking-wider text-faint">Status</label><select id="routine-state" value={selected.state} onChange={(event) => move(selected.id, event.target.value as Routine['state'])} className="rounded-lg border border-line-strong bg-surface-2 px-3 py-2 text-fg">{columns.map((column) => <option key={column.id} value={column.id}>{column.label}</option>)}</select></div>
          <div className="grid gap-3 rounded-xl border border-line bg-surface-2 p-4 text-muted"><div><span className="text-faint">Gatilho: </span>{selected.trigger}</div><div><span className="text-faint">Frequência: </span>{selected.frequency}</div><div><span className="text-faint">Última execução: </span>{selected.lastRun}</div></div>
          <div><h3 className="mb-3 font-semibold">Responsáveis e agentes</h3><div className="mb-3 flex flex-wrap gap-3">{selected.owners.map((id) => <span key={id} className="flex items-center gap-2 text-muted"><Avatar id={id} size={24} />{nameOf(id)}</span>)}</div><div className="flex flex-wrap gap-1">{selected.agents.map((id) => <AgentChip key={id} name={agentById(id)?.name ?? id} />)}</div></div>
          <div><h3 className="mb-3 font-semibold">Etapas do processo</h3><div className="space-y-2">{selected.steps.map((step, index) => <div key={index} className="flex gap-3 rounded-lg border border-line bg-surface-2 p-3"><span className="text-accent">{String(index + 1).padStart(2, '0')}</span><div><div>{step.label}</div><div className="mt-1 text-[11px] capitalize text-faint">{step.actor}{step.ref && ` · ${nameOf(step.ref)}`}</div></div><ChevronRight size={14} className="ml-auto self-center text-faint" /></div>)}</div></div>
          <div className="space-y-2 border-t border-line pt-4 text-muted"><div><span className="text-faint">Saída: </span>{selected.output}</div><div className="flex items-start gap-2"><ShieldCheck size={14} className="mt-0.5 shrink-0 text-violet" />{selected.review}</div></div>
          <p className="flex items-center gap-1.5 text-[11px] text-faint"><Bot size={13} /> As alterações neste quadro são apenas locais e não executam rotinas.</p>
        </div>}
      </Drawer>
    </div>
  )
}
