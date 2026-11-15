import { useCallback } from 'react'
import { create } from 'zustand'
import { applyEdgeChanges, applyNodeChanges, type EdgeChange, type NodeChange } from '@xyflow/react'
import { routines as initialRoutines, tasks as initialTasks } from './data/mock'
import type { ColumnId, Routine, Task } from './data/types'
import { initialEdges, initialNodes, type NexusNode, type VerbEdge } from './canvas/model'

// Estado local da demonstração. A parte persistente é salva em arquivo local (ver persistence.ts).

export type FindingAction = 'marcado' | 'complemento' | 'incorporado'

interface Snapshot {
  nodes: NexusNode[]
  edges: VerbEdge[]
}

interface NexusState {
  routines: Routine[]
  moveRoutine: (id: string, state: Routine['state']) => void
  tasks: Task[]
  moveTask: (id: string, column: ColumnId) => void

  nodes: NexusNode[]
  edges: VerbEdge[]
  flowState: 'rascunho' | 'publicado'
  history: Snapshot[]
  onNodesChange: (changes: NodeChange<NexusNode>[]) => void
  onEdgesChange: (changes: EdgeChange<VerbEdge>[]) => void
  commit: (next: Partial<Snapshot>) => void
  undo: () => void
  publish: () => void

  findingActions: Record<string, FindingAction[]>
  toggleFinding: (id: string, action: FindingAction) => void

  /** Preferências de interface (painéis, filtros, posições) gravadas por chave. */
  ui: Record<string, unknown>
  setUi: (key: string, value: unknown) => void

  toast: string | null
  notify: (msg: string) => void
}

let toastTimer: ReturnType<typeof setTimeout> | undefined

export const useNexus = create<NexusState>((set, get) => ({
  routines: initialRoutines,
  moveRoutine: (id, state) => set((s) => ({ routines: s.routines.map((routine) => routine.id === id ? { ...routine, state } : routine) })),
  tasks: initialTasks,
  moveTask: (id, column) =>
    set((s) => ({ tasks: s.tasks.map((t) => (t.id === id ? { ...t, column } : t)) })),

  nodes: initialNodes,
  edges: initialEdges,
  flowState: 'rascunho',
  history: [],
  onNodesChange: (changes) => {
    // Remoções entram no histórico de desfazer; arrastar e selecionar não.
    if (changes.some((c) => c.type === 'remove')) {
      const { nodes, edges, history } = get()
      set({ history: [...history.slice(-30), { nodes, edges }], flowState: 'rascunho' })
    }
    set((s) => ({ nodes: applyNodeChanges(changes, s.nodes) }))
  },
  onEdgesChange: (changes) => {
    if (changes.some((c) => c.type === 'remove')) {
      const { nodes, edges, history } = get()
      set({ history: [...history.slice(-30), { nodes, edges }], flowState: 'rascunho' })
    }
    set((s) => ({ edges: applyEdgeChanges(changes, s.edges) }))
  },
  commit: (next) => {
    const { nodes, edges, history } = get()
    set({ history: [...history.slice(-30), { nodes, edges }], flowState: 'rascunho', ...next })
  },
  undo: () => {
    const { history } = get()
    const prev = history[history.length - 1]
    if (!prev) return
    set({ nodes: prev.nodes, edges: prev.edges, history: history.slice(0, -1) })
  },
  publish: () =>
    set((s) => ({
      flowState: 'publicado',
      nodes: s.nodes.map((n) => ({ ...n, data: { ...n.data, status: 'publicado' } })),
      edges: s.edges.map((e) =>
        e.data && e.data.status === 'rascunho' ? { ...e, data: { ...e.data, status: 'publicado' } } : e,
      ),
    })),

  findingActions: {},
  toggleFinding: (id, action) =>
    set((s) => {
      const current = s.findingActions[id] ?? []
      const next = current.includes(action) ? current.filter((a) => a !== action) : [...current, action]
      return { findingActions: { ...s.findingActions, [id]: next } }
    }),

  ui: {},
  setUi: (key, value) => set((s) => ({ ui: { ...s.ui, [key]: value } })),

  toast: null,
  notify: (msg) => {
    clearTimeout(toastTimer)
    set({ toast: msg })
    toastTimer = setTimeout(() => set({ toast: null }), 3200)
  },
}))

/** Como useState, mas o valor fica no store e é persistido junto com o restante da interface. */
export function usePersistentState<T>(key: string, initial: T) {
  const value = useNexus((s) => (key in s.ui ? (s.ui[key] as T) : initial))
  const setValue = useCallback(
    (next: T | ((prev: T) => T)) => {
      const { ui, setUi } = useNexus.getState()
      const prev = key in ui ? (ui[key] as T) : initial
      setUi(key, typeof next === 'function' ? (next as (prev: T) => T)(prev) : next)
    },
    // `initial` só é usado enquanto não há valor salvo; não precisa recriar o setter.
    [key],
  )
  return [value, setValue] as const
}
