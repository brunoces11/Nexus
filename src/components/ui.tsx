import { useEffect, type ReactNode } from 'react'
import {
  Bot,
  Boxes,
  Database,
  FileCheck2,
  ListChecks,
  RefreshCw,
  User,
  Users,
  Wrench,
  X,
  type LucideIcon,
} from 'lucide-react'
import type { NodeKind } from '../canvas/model'
import { personById } from '../data/mock'

export const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(' ')

export const kindIcon: Record<NodeKind, LucideIcon> = {
  pessoa: User,
  equipe: Users,
  agente: Bot,
  skill: Wrench,
  base: Database,
  rotina: RefreshCw,
  tarefa: ListChecks,
  saida: FileCheck2,
}
export const GraphIcon = Boxes

type Tone = 'neutral' | 'accent' | 'violet' | 'success' | 'warning' | 'danger' | 'blue' | 'magenta'

const toneClass: Record<Tone, string> = {
  neutral: 'text-muted border-line-strong bg-white/[0.03]',
  accent: 'text-accent border-accent/30 bg-accent/10',
  violet: 'text-violet border-violet/30 bg-violet/10',
  success: 'text-success border-success/30 bg-success/10',
  warning: 'text-warning border-warning/30 bg-warning/10',
  danger: 'text-danger border-danger/30 bg-danger/10',
  blue: 'text-sky-300 border-sky-400/30 bg-sky-400/10',
  magenta: 'text-magenta border-magenta/30 bg-magenta/10',
}

export function Badge({ tone = 'neutral', children, icon: Icon, className }: { tone?: Tone; children: ReactNode; icon?: LucideIcon; className?: string }) {
  return (
    <span className={cx('inline-flex items-center gap-1 whitespace-nowrap rounded-md border px-1.5 py-0.5 text-[11px] font-medium leading-4', toneClass[tone], className)}>
      {Icon && <Icon size={11} strokeWidth={2} />}
      {children}
    </span>
  )
}

export function Dot({ tone = 'neutral', pulse }: { tone?: Tone; pulse?: boolean }) {
  const color: Record<Tone, string> = {
    neutral: 'bg-faint', accent: 'bg-accent', violet: 'bg-violet', success: 'bg-success', warning: 'bg-warning',
    danger: 'bg-danger', blue: 'bg-sky-400', magenta: 'bg-magenta',
  }
  return (
    <span className="relative inline-flex h-2 w-2 shrink-0">
      {pulse && <span className={cx('absolute inline-flex h-full w-full animate-ping rounded-full opacity-50', color[tone])} />}
      <span className={cx('relative inline-flex h-2 w-2 rounded-full', color[tone])} />
    </span>
  )
}

export function Avatar({ id, size = 24, ring }: { id: string; size?: number; ring?: boolean }) {
  const p = personById(id)
  return (
    <span
      title={p?.name}
      className={cx('inline-flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-slate-600 to-slate-800 font-semibold text-slate-100', ring && 'ring-2 ring-bg')}
      style={{ width: size, height: size, fontSize: size * 0.38 }}
    >
      {p?.initials ?? '?'}
    </span>
  )
}

export function AgentChip({ name, compact }: { name: string; compact?: boolean }) {
  return (
    <span className="inline-flex max-w-full items-center gap-1 rounded-md border border-accent/25 bg-accent/[0.07] px-1.5 py-0.5 text-[11px] text-accent">
      <Bot size={11} className="shrink-0" />
      <span className="truncate">{compact ? name.replace('Agente de ', '').replace('Agente ', '') : name}</span>
    </span>
  )
}

export function Button({
  children,
  onClick,
  variant = 'ghost',
  icon: Icon,
  disabled,
  className,
  title,
  type = 'button',
}: {
  children?: ReactNode
  onClick?: () => void
  variant?: 'ghost' | 'primary' | 'outline' | 'subtle'
  icon?: LucideIcon
  disabled?: boolean
  className?: string
  title?: string
  type?: 'button' | 'submit'
}) {
  const v = {
    primary: 'bg-accent/15 text-accent border-accent/40 hover:bg-accent/25 hover:shadow-[0_0_16px_rgba(34,211,238,0.25)]',
    outline: 'border-line-strong text-fg hover:bg-white/[0.04]',
    ghost: 'border-transparent text-muted hover:text-fg hover:bg-white/[0.05]',
    subtle: 'border-line bg-surface-2 text-fg hover:bg-surface-3',
  }[variant]
  return (
    <button
      type={type}
      title={title}
      disabled={disabled}
      onClick={onClick}
      className={cx(
        'inline-flex h-8 items-center justify-center gap-1.5 rounded-lg border px-3 text-[13px] font-medium transition disabled:cursor-not-allowed disabled:opacity-40',
        v,
        className,
      )}
    >
      {Icon && <Icon size={15} strokeWidth={1.8} />}
      {children}
    </button>
  )
}

export function Chip({ active, children, onClick, count }: { active?: boolean; children: ReactNode; onClick?: () => void; count?: number }) {
  return (
    <button
      onClick={onClick}
      className={cx(
        'inline-flex h-7 items-center gap-1.5 rounded-full border px-3 text-xs transition',
        active ? 'border-accent/40 bg-accent/10 text-accent' : 'border-line-strong text-muted hover:text-fg',
      )}
    >
      {children}
      {count !== undefined && <span className="text-[10px] opacity-70">{count}</span>}
    </button>
  )
}

export function Card({ children, className, title, action }: { children: ReactNode; className?: string; title?: ReactNode; action?: ReactNode }) {
  return (
    <section className={cx('panel rounded-xl', className)}>
      {title && (
        <header className="flex items-center justify-between gap-2 border-b border-line px-4 py-3">
          <h3 className="text-[13px] font-semibold text-fg">{title}</h3>
          {action}
        </header>
      )}
      {children}
    </section>
  )
}

export function Meter({ value, tone }: { value: number; tone?: 'auto' | 'accent' }) {
  const color = tone === 'accent' ? 'bg-accent' : value >= 85 ? 'bg-warning' : value >= 70 ? 'bg-sky-400' : 'bg-success'
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
      <div className={cx('h-full rounded-full', color)} style={{ width: `${value}%` }} />
    </div>
  )
}

export function PageHeader({ title, subtitle, actions, eyebrow }: { title: string; subtitle?: string; actions?: ReactNode; eyebrow?: string }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4 px-6 pb-4 pt-6">
      <div>
        {eyebrow && <div className="mb-1 text-[11px] font-medium uppercase tracking-[0.14em] text-accent/80">{eyebrow}</div>}
        <h1 className="text-xl font-semibold tracking-tight text-fg">{title}</h1>
        {subtitle && <p className="mt-1 max-w-2xl text-[13px] text-muted">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  )
}

/** Painel lateral em overlay: abre e fecha sem tirar o usuário da tela atual. */
export function Drawer({ open, onClose, title, subtitle, children, width = 440 }: { open: boolean; onClose: () => void; title: ReactNode; subtitle?: ReactNode; children: ReactNode; width?: number }) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])
  if (!open) return null
  return (
    <div className="fixed inset-0 z-40 flex justify-end" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <aside className="glass slide-in relative m-2 flex max-w-[calc(100vw-1rem)] flex-col overflow-hidden rounded-2xl" style={{ width }}>
        <header className="flex items-start justify-between gap-3 border-b border-line px-5 py-4">
          <div className="min-w-0">
            <div className="text-[15px] font-semibold text-fg">{title}</div>
            {subtitle && <div className="mt-0.5 text-xs text-muted">{subtitle}</div>}
          </div>
          <button onClick={onClose} className="rounded-md p-1 text-muted hover:bg-white/5 hover:text-fg" aria-label="Fechar">
            <X size={16} />
          </button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
      </aside>
    </div>
  )
}

export function Modal({ open, onClose, title, children, footer }: { open: boolean; onClose: () => void; title: ReactNode; children: ReactNode; footer?: ReactNode }) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/55" onClick={onClose} />
      <div className="glass fade-in relative flex max-h-[85vh] w-full max-w-xl flex-col overflow-hidden rounded-2xl">
        <header className="flex items-center justify-between border-b border-line px-5 py-4">
          <div className="text-[15px] font-semibold">{title}</div>
          <button onClick={onClose} className="rounded-md p-1 text-muted hover:bg-white/5 hover:text-fg" aria-label="Fechar">
            <X size={16} />
          </button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footer && <footer className="flex justify-end gap-2 border-t border-line px-5 py-3">{footer}</footer>}
      </div>
    </div>
  )
}

export function Tabs<T extends string>({ tabs, value, onChange }: { tabs: { id: T; label: string; count?: number }[]; value: T; onChange: (v: T) => void }) {
  return (
    <div className="flex gap-1 border-b border-line" role="tablist">
      {tabs.map((t) => (
        <button
          key={t.id}
          role="tab"
          aria-selected={value === t.id}
          onClick={() => onChange(t.id)}
          className={cx(
            '-mb-px border-b-2 px-3 py-2.5 text-[13px] transition',
            value === t.id ? 'border-accent text-fg' : 'border-transparent text-muted hover:text-fg',
          )}
        >
          {t.label}
          {t.count !== undefined && <span className="ml-1.5 text-[11px] text-faint">{t.count}</span>}
        </button>
      ))}
    </div>
  )
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[120px_1fr] gap-3 py-1.5 text-[13px]">
      <div className="text-faint">{label}</div>
      <div className="min-w-0 text-fg">{children}</div>
    </div>
  )
}

export function SimulatedNote({ children }: { children: ReactNode }) {
  return <p className="text-[11px] italic text-faint">{children}</p>
}
