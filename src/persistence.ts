import { useNexus } from './store'

// Persistência do estado da interface em arquivo local (.nexus/ui-state.json),
// lido e gravado pelo plugin do Vite em vite-plugin-nexus-state.mjs.

const ENDPOINT = '/__nexus/state'
const VERSION = 1
const KEYS = ['routines', 'tasks', 'nodes', 'edges', 'flowState', 'findingActions', 'ui'] as const

type Persisted = Pick<ReturnType<typeof useNexus.getState>, (typeof KEYS)[number]>

const pick = (): Persisted => {
  const s = useNexus.getState()
  return Object.fromEntries(KEYS.map((k) => [k, s[k]])) as Persisted
}

/** Carrega o arquivo salvo, se existir, antes da primeira renderização. */
export async function loadPersistedState() {
  try {
    const res = await fetch(ENDPOINT)
    if (res.status !== 200) return
    const saved = (await res.json()) as { version?: number; state?: Partial<Persisted> }
    if (saved.version !== VERSION || !saved.state) return
    const state = Object.fromEntries(KEYS.filter((k) => k in saved.state!).map((k) => [k, saved.state![k]]))
    useNexus.setState(state)
  } catch (err) {
    console.warn('[nexus] Não foi possível carregar o estado salvo; usando dados iniciais.', err)
  }
}

/** Salva o estado mais recente sempre que uma parte persistente muda. */
export function startPersisting() {
  let timer: ReturnType<typeof setTimeout> | undefined
  let pending = false
  const body = () => JSON.stringify({ version: VERSION, savedAt: new Date().toISOString(), state: pick() })

  const flush = () => {
    clearTimeout(timer)
    if (!pending) return
    pending = false
    fetch(ENDPOINT, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: body() }).catch((err) =>
      console.warn('[nexus] Falha ao salvar o estado da interface.', err),
    )
  }

  useNexus.subscribe((s, prev) => {
    if (!KEYS.some((k) => s[k] !== prev[k])) return
    pending = true
    clearTimeout(timer)
    timer = setTimeout(flush, 400)
  })

  // Ao fechar ou recarregar a aba, envia o que ainda estiver pendente.
  window.addEventListener('pagehide', () => {
    if (!pending) return
    pending = false
    clearTimeout(timer)
    navigator.sendBeacon(ENDPOINT, new Blob([body()], { type: 'application/json' }))
  })
}
