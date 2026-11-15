import { useState } from 'react'
import { useNavigate } from 'react-router'
import { DndContext, DragOverlay, PointerSensor, useDraggable, useDroppable, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core'
import { Bot, CalendarClock, Paperclip } from 'lucide-react'
import { agentById, personById, teams } from '../data/mock'
import type { ColumnId, Priority, Task } from '../data/types'
import { AgentChip, Avatar, Badge, Chip, Dot, cx } from '../components/ui'
import { useNexus, usePersistentState } from '../store'

export const columns: { id: ColumnId; label: string; hint: string }[] = [
  { id: 'entrada', label: 'Entrada', hint: 'Novas solicitações' },
  { id: 'planejado', label: 'Planejado', hint: 'Atribuídas, não iniciadas' },
  { id: 'andamento', label: 'Em andamento', hint: 'Pessoa trabalhando' },
  { id: 'aguardando', label: 'Aguardando agente', hint: 'Execução em curso' },
  { id: 'revisao', label: 'Em revisão', hint: 'Entrega aguardando gestor' },
  { id: 'concluido', label: 'Concluído', hint: 'Aprovadas' },
]

export const priorityTone: Record<Priority, 'danger' | 'warning' | 'neutral' | 'blue'> = {
  crítica: 'danger',
  alta: 'warning',
  média: 'blue',
  baixa: 'neutral',
}

function CardBody({ task, dragging }: { task: Task; dragging?: boolean }) {
  const person = personById(task.assignee)
  const running = task.column === 'aguardando'
  return (
    <div
      className={cx(
        'rounded-xl border bg-surface-2 p-3 transition',
        dragging ? 'rotate-1 border-accent/50 shadow-[0_0_24px_rgba(34,211,238,0.2)]' : 'border-line hover:border-line-strong hover:bg-surface-3/70',
      )}
    >
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <span className="font-mono text-[10.5px] text-faint">{task.id}</span>
        <Badge tone={priorityTone[task.priority]}>{task.priority}</Badge>
      </div>
      <div className="mb-2.5 text-[13px] font-medium leading-snug text-fg">{task.title}</div>
      {task.agents.length > 0 && (
        <div className="mb-2.5 flex flex-wrap gap-1">
          {task.agents.map((a) => (
            <AgentChip key={a} name={agentById(a)!.name} compact />
          ))}
        </div>
      )}
      <div className="flex items-start gap-1.5 border-t border-line pt-2 text-[11px] leading-snug text-muted">
        <span className="mt-1">
          <Dot tone={running ? 'accent' : 'neutral'} pulse={running} />
        </span>
        <span>{task.lastEvent}</span>
      </div>
      <div className="mt-2.5 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Avatar id={task.assignee} size={20} />
          <span className="text-[11.5px] text-muted">{person?.name.split(' ')[0]}</span>
        </div>
        <div className="flex items-center gap-2.5 text-[11px] text-faint">
          <span className="inline-flex items-center gap-1" title="Evidências vinculadas">
            <Paperclip size={11} /> {task.evidences}
          </span>
          <span className={cx('inline-flex items-center gap-1', task.overdue && 'text-danger')}>
            <CalendarClock size={11} /> {task.due}
          </span>
        </div>
      </div>
    </div>
  )
}

function DraggableCard({ task }: { task: Task }) {
  const nav = useNavigate()
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: task.id })
  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      onClick={() => nav(`/tarefas/${task.id}`)}
      onKeyDown={(e) => e.key === 'Enter' && nav(`/tarefas/${task.id}`)}
      className={cx('cursor-pointer outline-none', isDragging && 'opacity-30')}
      aria-label={`${task.id}: ${task.title}`}
    >
      <CardBody task={task} />
    </div>
  )
}

function Column({ id, label, hint, tasks }: { id: ColumnId; label: string; hint: string; tasks: Task[] }) {
  const { setNodeRef, isOver } = useDroppable({ id })
  return (
    <div className="flex w-[280px] shrink-0 flex-col">
      <div className="mb-2.5 flex items-center justify-between px-1">
        <div>
          <div className="flex items-center gap-2 text-[12.5px] font-medium text-fg">
            {id === 'aguardando' && <Bot size={13} className="text-accent" />}
            {label}
            <span className="rounded-full bg-white/[0.06] px-1.5 text-[10.5px] text-muted">{tasks.length}</span>
          </div>
          <div className="text-[10.5px] text-faint">{hint}</div>
        </div>
      </div>
      <div
        ref={setNodeRef}
        className={cx(
          'flex min-h-[200px] flex-1 flex-col gap-2 rounded-xl border p-2 transition',
          isOver ? 'border-accent/40 bg-accent/[0.04]' : 'border-line/60 bg-white/[0.012]',
        )}
      >
        {tasks.map((t) => (
          <DraggableCard key={t.id} task={t} />
        ))}
      </div>
    </div>
  )
}

type Filter = 'todas' | 'agente' | 'prioritarias' | 'atrasadas'

export default function Kanban() {
  const { tasks, moveTask, notify } = useNexus()
  const [filter, setFilter] = usePersistentState<Filter>('kanban.filter', 'todas')
  const [team, setTeam] = usePersistentState<string | null>('kanban.team', null)
  const [activeId, setActiveId] = useState<string | null>(null)
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }))

  const visible = tasks.filter((t) => {
    if (team && personById(t.assignee)?.team !== team) return false
    if (filter === 'agente') return t.agents.length > 0
    if (filter === 'prioritarias') return t.priority === 'crítica' || t.priority === 'alta'
    if (filter === 'atrasadas') return !!t.overdue
    return true
  })

  const onDragEnd = (e: DragEndEvent) => {
    setActiveId(null)
    const to = e.over?.id as ColumnId | undefined
    const task = tasks.find((t) => t.id === e.active.id)
    if (!to || !task || task.column === to) return
    moveTask(task.id, to)
    notify(`${task.id} movida para “${columns.find((c) => c.id === to)!.label}” (alteração local da demonstração).`)
  }

  const active = tasks.find((t) => t.id === activeId)

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-wrap items-center gap-2 px-6 py-4">
        {(
          [
            ['todas', 'Todas'],
            ['agente', 'Com agente'],
            ['prioritarias', 'Críticas e altas'],
            ['atrasadas', 'Atrasadas'],
          ] as [Filter, string][]
        ).map(([id, l]) => (
          <Chip key={id} active={filter === id} onClick={() => setFilter(id)}>
            {l}
          </Chip>
        ))}
        <span className="mx-2 h-4 w-px bg-line-strong" />
        <Chip active={!team} onClick={() => setTeam(null)}>Todas as equipes</Chip>
        {teams.map((t) => (
          <Chip key={t.id} active={team === t.id} onClick={() => setTeam(t.id)}>
            {t.name}
          </Chip>
        ))}
      </div>
      <DndContext sensors={sensors} onDragStart={(e) => setActiveId(String(e.active.id))} onDragEnd={onDragEnd} onDragCancel={() => setActiveId(null)}>
        <div className="flex min-h-0 flex-1 gap-3 overflow-x-auto px-6 pb-6">
          {columns.map((c) => (
            <Column key={c.id} {...c} tasks={visible.filter((t) => t.column === c.id)} />
          ))}
        </div>
        <DragOverlay>{active ? <CardBody task={active} dragging /> : null}</DragOverlay>
      </DndContext>
      <div className="px-6 pb-3 text-[11px] text-faint">
        Colunas configuráveis por rotina. Mover cartões altera apenas esta demonstração.
      </div>
    </div>
  )
}
