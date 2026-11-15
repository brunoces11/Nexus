import { memo } from 'react'
import { BaseEdge, EdgeLabelRenderer, getBezierPath, type EdgeProps } from '@xyflow/react'
import { AlertTriangle } from 'lucide-react'
import { categoryMeta, type VerbEdge } from './model'

function VerbEdgeView({ id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, data, selected }: EdgeProps<VerbEdge>) {
  const [path, labelX, labelY] = getBezierPath({ sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition })
  const conflict = data?.status === 'conflito'
  const cat = categoryMeta[conflict ? 'indefinida' : data?.category ?? 'indefinida']
  const color = cat.color
  const draft = data?.status === 'rascunho'

  return (
    <>
      {selected && <path d={path} fill="none" stroke={color} strokeOpacity={0.18} strokeWidth={8} />}
      <BaseEdge
        id={id}
        path={path}
        style={{
          stroke: color,
          strokeOpacity: selected ? 1 : draft ? 0.45 : 0.6,
          strokeWidth: selected ? 1.8 : 1.2,
          strokeDasharray: cat.dash,
          filter: selected ? `drop-shadow(0 0 4px ${color})` : undefined,
        }}
      />
      <circle cx={targetX} cy={targetY} r={3} fill={color} fillOpacity={selected ? 1 : 0.7} />
      {selected && (
        <circle r={2.6} fill="#fff" className="edge-pulse" style={{ color }}>
          <animateMotion dur="1.8s" repeatCount="indefinite" path={path} />
        </circle>
      )}
      <EdgeLabelRenderer>
        <div
          className="nodrag nopan pointer-events-none absolute"
          style={{ transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)` }}
        >
          <span
            className="inline-flex items-center gap-1 rounded-md border px-1.5 py-[1px] font-mono text-[9.5px] font-medium tracking-wider"
            style={{
              color,
              borderColor: `${color}${selected ? '88' : '40'}`,
              background: 'rgba(10,16,26,0.92)',
              boxShadow: selected ? `0 0 12px ${color}44` : undefined,
            }}
          >
            {conflict && <AlertTriangle size={10} />}
            {data?.verb}
          </span>
        </div>
      </EdgeLabelRenderer>
    </>
  )
}

export default memo(VerbEdgeView)
