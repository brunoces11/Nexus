import { useEffect, useRef, useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router'
import {
  Bot,
  ChevronLeft,
  ChevronRight,
  ChevronsUpDown,
  Database,
  Home,
  KanbanSquare,
  LogOut,
  Network,
  RefreshCw,
  Search,
  Settings,
  Share2,
  User,
  Users,
  type LucideIcon,
} from 'lucide-react'
import { Avatar, cx } from './ui'
import { CURRENT_USER, personById, teams } from '../data/mock'
import { useNexus, usePersistentState } from '../store'

const primary: { to: string; label: string; icon: LucideIcon }[] = [
  { to: '/', label: 'Início', icon: Home },
  { to: '/canvas', label: 'Canvas de conexões', icon: Share2 },
  { to: '/tarefas', label: 'Kanban operacional', icon: KanbanSquare },
]

const management: { to: string; label: string; icon: LucideIcon }[] = [
  { to: '/dados', label: 'Dados e conhecimento', icon: Database },
  { to: '/grafo', label: 'Grafo de conhecimento', icon: Network },
  { to: '/pessoas', label: 'Pessoas', icon: Users },
  { to: '/agentes', label: 'Agentes e skills', icon: Bot },
  { to: '/rotinas', label: 'Rotinas', icon: RefreshCw },
]

const titles: Record<string, string> = {
  '': 'Início',
  canvas: 'Fluxo · Avaliação de fornecedores',
  tarefas: 'Kanban operacional',
  dados: 'Dados e conhecimento',
  grafo: 'Grafo de conhecimento',
  pessoas: 'Pessoas',
  agentes: 'Agentes e skills',
  rotinas: 'Rotinas',
}

export type CanvasLayoutContext = { libraryCollapsed: boolean }

function NavItem({ to, label, icon: Icon, collapsed }: { to: string; label: string; icon: LucideIcon; collapsed: boolean }) {
  return (
    <NavLink
      to={to}
      end={to === '/'}
      title={label}
      className={({ isActive }) =>
        cx(
          'group relative flex h-9 items-center gap-3 rounded-lg px-2.5 text-[13px] transition',
          collapsed && 'justify-center px-0',
          isActive ? 'bg-accent/10 text-fg' : 'text-muted hover:bg-white/[0.04] hover:text-fg',
        )
      }
    >
      {({ isActive }) => (
        <>
          {isActive && <span className="absolute left-0 top-2 h-5 w-[2px] rounded-full bg-accent shadow-[0_0_8px_var(--accent)]" />}
          <Icon size={17} strokeWidth={1.7} className={cx('shrink-0', isActive && 'text-accent')} />
          {!collapsed && <span className="truncate">{label}</span>}
        </>
      )}
    </NavLink>
  )
}

/** Item do usuário na base da sidebar; abre o painel do usuário em popup. */
function UserMenu({ collapsed }: { collapsed: boolean }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const notify = useNexus((s) => s.notify)
  const me = personById(CURRENT_USER)!
  const team = teams.find((t) => t.id === me.team)

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && setOpen(false)
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('mousedown', onDown)
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('mousedown', onDown)
      window.removeEventListener('keydown', onKey)
    }
  }, [open])

  const items: { label: string; icon: LucideIcon }[] = [
    { label: 'Meu perfil', icon: User },
    { label: 'Preferências', icon: Settings },
    { label: 'Sair', icon: LogOut },
  ]

  return (
    <div ref={ref} className="relative mt-3">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        title={collapsed ? `${me.name} · ${me.role}` : 'Painel do usuário'}
        className={cx(
          'flex h-11 w-full items-center rounded-lg text-left transition hover:bg-white/[0.04]',
          collapsed ? 'justify-center px-0' : 'gap-2.5 px-1.5',
          open && 'bg-white/[0.04]',
        )}
      >
        <Avatar id={me.id} size={30} />
        {!collapsed && (
          <>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[12px] text-fg">{me.name}</span>
              <span className="block truncate text-[10px] text-faint">{me.role}</span>
            </span>
            <ChevronsUpDown size={14} className="shrink-0 text-faint" />
          </>
        )}
      </button>

      {open && (
        <div role="menu" className={cx('glass fade-in absolute bottom-full z-50 mb-2 w-60 overflow-hidden rounded-xl', collapsed ? 'left-0' : 'left-0 right-0 w-auto')}>
          <div className="flex items-center gap-3 border-b border-line px-3 py-3">
            <Avatar id={me.id} size={36} />
            <div className="min-w-0">
              <div className="truncate text-[13px] font-medium text-fg">{me.name}</div>
              <div className="truncate text-[11px] text-muted">{me.role}</div>
              {team && <div className="truncate text-[10px] text-faint">{team.name}</div>}
            </div>
          </div>
          <div className="p-1">
            {items.map(({ label, icon: Icon }) => (
              <button
                key={label}
                type="button"
                role="menuitem"
                onClick={() => {
                  setOpen(false)
                  notify(`${label}: ainda não implementado nesta demonstração.`)
                }}
                className="flex h-8 w-full items-center gap-2.5 rounded-lg px-2.5 text-[13px] text-muted transition hover:bg-white/[0.05] hover:text-fg"
              >
                <Icon size={15} strokeWidth={1.7} />
                {label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default function Shell() {
  const [sidebarCollapsed, setSidebarCollapsed] = usePersistentState('shell.sidebarCollapsed', false)
  const [libraryCollapsed, setLibraryCollapsed] = usePersistentState('canvas.libraryCollapsed', false)
  const loc = useLocation()
  const seg = loc.pathname.split('/')[1] ?? ''
  const isTask = seg === 'tarefas' && loc.pathname.split('/')[2]
  const isKanban = seg === 'tarefas' && !isTask
  const title = isTask ? `Tarefa ${loc.pathname.split('/')[2]}` : titles[seg] ?? 'NEXUS'
  const toast = useNexus((s) => s.toast)
  const notify = useNexus((s) => s.notify)
  const running = useNexus((s) => s.tasks.filter((t) => t.column === 'aguardando').length)
  const review = useNexus((s) => s.tasks.filter((t) => t.column === 'revisao').length)

  return (
    <div className="flex h-full">
      <aside className={cx('flex shrink-0 flex-col border-r border-line bg-bg-elev py-4 transition-[width] duration-200 ease-in-out', sidebarCollapsed ? 'w-16 px-2' : 'w-60 px-3')}>
        <button
          type="button"
          onClick={() => setSidebarCollapsed((collapsed) => !collapsed)}
          aria-label={sidebarCollapsed ? 'Expandir menu lateral' : 'Recolher menu lateral'}
          title={sidebarCollapsed ? 'Expandir menu lateral' : 'Recolher menu lateral'}
          className={cx('relative mb-6 flex h-10 w-full items-center rounded-lg text-left hover:bg-white/[0.04]', sidebarCollapsed ? 'justify-center px-0' : 'gap-2.5 px-1.5')}
        >
          <span className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-accent/40 bg-accent/10 shadow-[0_0_14px_rgba(34,211,238,0.25)]">
            <Network size={16} className="text-accent" />
          </span>
          {!sidebarCollapsed && (
            <>
              <span className="min-w-0 flex-1">
                <span className="block text-[13px] font-semibold tracking-[0.2em] text-fg">NEXUS</span>
                <span className="block truncate text-[10px] text-faint">Enterprise Knowledge System</span>
              </span>
              <ChevronLeft size={15} className="shrink-0 text-faint" />
            </>
          )}
          {sidebarCollapsed && <ChevronRight size={13} className="absolute bottom-0 right-0 rounded-full bg-bg-elev text-faint" />}
        </button>

        <nav className="flex flex-col gap-0.5">
          {primary.map((i) => (
            <NavItem key={i.to} {...i} collapsed={sidebarCollapsed} />
          ))}
        </nav>
        {!sidebarCollapsed && <div className="mb-2 mt-6 px-2.5 text-[10px] font-medium uppercase tracking-[0.14em] text-faint">Gestão</div>}
        {sidebarCollapsed && <div className="my-4 h-px bg-line" />}
        <nav className="flex flex-col gap-0.5">
          {management.map((i) => (
            <NavItem key={i.to} {...i} collapsed={sidebarCollapsed} />
          ))}
        </nav>

        <div className="mt-auto">
          <UserMenu collapsed={sidebarCollapsed} />
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 shrink-0 items-center gap-4 border-b border-line bg-bg/80 px-4 backdrop-blur md:px-6">
          {seg === 'canvas' && (
            <button
              type="button"
              onClick={() => setLibraryCollapsed((collapsed) => !collapsed)}
              aria-label={libraryCollapsed ? 'Expandir biblioteca' : 'Recolher biblioteca'}
              aria-expanded={!libraryCollapsed}
              aria-controls="canvas-library"
              title={libraryCollapsed ? 'Expandir biblioteca' : 'Recolher biblioteca'}
              className="shrink-0 rounded-md p-1 text-muted transition hover:bg-white/[0.06] hover:text-fg"
            >
              {libraryCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
            </button>
          )}
          <div className="min-w-0">
            <div className="text-[11px] text-faint">Distribuição · Operações Sul</div>
            <div className="truncate text-[14px] font-medium text-fg">{title}</div>
          </div>
          <form
            className="ml-auto hidden h-8 w-80 items-center gap-2 rounded-lg border border-line bg-surface px-3 text-muted focus-within:border-accent/40 md:flex"
            onSubmit={(e) => {
              e.preventDefault()
              notify('Busca global ainda não implementada nesta demonstração.')
            }}
          >
            <Search size={14} />
            <input placeholder="Buscar pessoas, agentes, tarefas, documentos…" className="w-full bg-transparent text-[13px] text-fg outline-none placeholder:text-faint" />
            <kbd className="rounded border border-line px-1 font-mono text-[10px] text-faint">⏎</kbd>
          </form>
          {isKanban && (
            <div className="flex shrink-0 gap-2 whitespace-nowrap text-[12px]">
              <div className="rounded-lg border border-line bg-surface px-3 py-1.5">
                <span className="text-accent">{running}</span> <span className="text-faint">aguardando agente</span>
              </div>
              <div className="rounded-lg border border-line bg-surface px-3 py-1.5">
                <span className="text-warning">{review}</span> <span className="text-faint">em revisão</span>
              </div>
            </div>
          )}
        </header>
        <main className="min-h-0 flex-1 overflow-y-auto">
          <Outlet context={{ libraryCollapsed } satisfies CanvasLayoutContext} />
        </main>
      </div>

      {toast && (
        <div className="glass fade-in fixed bottom-5 left-1/2 z-[60] -translate-x-1/2 rounded-xl px-4 py-2.5 text-[13px] text-fg" role="status">
          {toast}
        </div>
      )}
    </div>
  )
}
