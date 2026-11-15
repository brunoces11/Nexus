import { memo } from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import { AlertTriangle, CircleDashed, PauseCircle, CheckCircle2, PencilLine } from 'lucide-react'
import { kindMeta, type NexusNode } from './model'
import { cx, kindIcon } from '../components/ui'
import { useNexus } from '../store'

export type ComputedState = 'conflito' | 'incompleto' | 'rascunho' | 'publicado' | 'pausado'

/** Estado exibido no nó: conflito e conexão incompleta têm prioridade sobre o estado salvo. */
export function useNodeState(id: string, saved: string): ComputedState {
  return useNexus((s) => {
    let linked = false
    for (const e of s.edges) {
      if (e.source !== id && e.target !== id) continue
      linked = true
      if (e.data?.status === 'conflito') return 'conflito'
    }
    if (!linked) return 'incompleto'
    return saved as ComputedState
  })
}

export const stateMeta: Record<ComputedState, { label: string; cls: string; icon: typeof CheckCircle2 }> = {
  publicado: { label: 'Publicado', cls: 'text-success', icon: CheckCircle2 },
  rascunho: { label: 'Rascunho', cls: 'text-muted', icon: PencilLine },
  incompleto: { label: 'Conexão incompleta', cls: 'text-warning', icon: CircleDashed },
  conflito: { label: 'Conflito de acesso', cls: 'text-warning', icon: AlertTriangle },
  pausado: { label: 'Pausado', cls: 'text-faint', icon: PauseCircle },
}

function NexusNodeView({ id, data, selected }: NodeProps<NexusNode>) {
  const meta = kindMeta[data.kind]
  const Icon = kindIcon[data.kind]
  const state = useNodeState(id, data.status)
  const sm = stateMeta[state]
  const StateIcon = sm.icon

  return (
    <div
      className={cx(
        'group relative w-[228px] rounded-xl border bg-surface-2/95 transition-shadow',
        selected ? 'border-transparent' : 'border-line-strong hover:border-white/25',
      )}
      style={
        selected
          ? { boxShadow: `0 0 0 1px ${meta.color}99, 0 0 22px ${meta.color}33, 0 12px 30px -12px #000` }
          : { boxShadow: '0 10px 26px -14px #000' }
      }
    >
      <div className="absolute inset-x-3 top-0 h-px" style={{ background: `linear-gradient(90deg, transparent, ${meta.color}aa, transparent)` }} />
      <Handle type="target" position={Position.Left} />
      <div className="flex items-start gap-2.5 px-3 pb-2 pt-3">
        <div
          className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border"
          style={{ color: meta.color, borderColor: `${meta.color}40`, background: `${meta.color}14` }}
        >
          <Icon size={15} strokeWidth={1.8} />
        </div>
        <div className="min-w-0">
          <div className="text-[10px] font-medium uppercase tracking-[0.1em]" style={{ color: `${meta.color}cc` }}>
            {meta.label}
          </div>
          <div className="truncate text-[13px] font-medium leading-5 text-fg" title={data.label}>
            {data.label}
          </div>
          <div className="truncate text-[11px] text-faint">{data.subtitle}</div>
        </div>
      </div>
      <div className={cx('flex items-center gap-1 border-t border-line px-3 py-1.5 text-[10.5px]', sm.cls)}>
        <StateIcon size={11} />
        {sm.label}
      </div>
      <Handle type="source" position={Position.Right} />
    </div>
  )
}

export default memo(NexusNodeView)
