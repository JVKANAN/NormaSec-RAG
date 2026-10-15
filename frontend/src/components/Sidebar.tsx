import { FlaskConical, Layers, MessageSquare, Plus, Search, Files } from 'lucide-react'
import { useState } from 'react'
import type { Conversation } from '../types'

export type View = 'assistant' | 'documents'

type Props = {
  view: View
  conversations: Conversation[]
  activeId: string | null
  onView: (v: View) => void
  onNew: () => void
  onOpen: (id: string) => void
}

export function Logo({ size = 'md' }: { size?: 'md' | 'sm' }) {
  const box = size === 'md' ? 'h-10 w-10' : 'h-7 w-7'
  return (
    <span className={`flex ${box} shrink-0 items-center justify-center rounded-xl bg-brand text-white`} aria-hidden>
      <Layers className={size === 'md' ? 'h-5 w-5' : 'h-4 w-4'} />
    </span>
  )
}

function dayLabel(ts: number) {
  const d = new Date(ts); const now = new Date()
  const days = Math.round((new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime() -
    new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()) / 86_400_000)
  return days <= 0 ? 'Hoje' : days === 1 ? 'Ontem' : 'Anteriores'
}

export function Sidebar({ view, conversations, activeId, onView, onNew, onOpen }: Props) {
  const [searching, setSearching] = useState(false)
  const [term, setTerm] = useState('')
  const shown = conversations.filter(c => c.title.toLowerCase().includes(term.trim().toLowerCase()))
  const groups = ['Hoje', 'Ontem', 'Anteriores']
    .map(g => ({ g, items: shown.filter(c => dayLabel(c.createdAt) === g) }))
    .filter(x => x.items.length)

  const nav = (v: View, label: string, Icon: typeof Files) => (
    <button onClick={() => onView(v)} aria-current={view === v ? 'page' : undefined}
      className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[15px] font-medium transition-colors ${view === v ? 'bg-brand-soft text-brand' : 'text-ink-soft hover:bg-white/70'}`}>
      <Icon className="h-5 w-5" strokeWidth={1.6} aria-hidden /> {label}
    </button>
  )

  return (
    <aside className="flex h-full w-[270px] shrink-0 flex-col border-r border-surface-line bg-surface-side" aria-label="Navegação">
      <div className="flex items-center gap-3 px-5 pb-5 pt-6">
        <Logo />
        <div className="leading-tight">
          <p className="text-xl font-semibold tracking-tight text-ink">NormaSec</p>
          <p className="text-[11px] font-medium uppercase tracking-wide text-ink-soft">Conhecimento interno</p>
        </div>
      </div>

      <div className="px-5">
        <button onClick={() => { onNew(); onView('assistant') }}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand px-4 py-3 text-[15px] font-medium text-white transition-colors hover:bg-brand-dark">
          <Plus className="h-4 w-4" aria-hidden /> Nova conversa
        </button>
      </div>

      <nav className="mt-6 space-y-1 px-5">
        {nav('assistant', 'Assistente', MessageSquare)}
        {nav('documents', 'Base de documentos', Files)}
      </nav>

      <div className="mt-7 flex items-center justify-between px-6">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-soft">Conversas recentes</p>
        <button onClick={() => { setSearching(s => !s); setTerm('') }} aria-label="Buscar conversas" aria-pressed={searching}
          className="rounded-md p-1 text-ink-soft hover:bg-white/70"><Search className="h-4 w-4" aria-hidden /></button>
      </div>
      {searching && (
        <div className="px-5 pt-2">
          <input autoFocus value={term} onChange={e => setTerm(e.target.value)} placeholder="Buscar conversa…" aria-label="Buscar conversa"
            className="w-full rounded-lg border border-surface-line bg-white px-3 py-1.5 text-sm outline-none focus:border-brand" />
        </div>
      )}

      <div className="mt-2 min-h-0 flex-1 overflow-y-auto px-5">
        {conversations.length === 0 && <p className="px-3 py-3 text-sm text-ink-mute">Suas conversas desta sessão aparecem aqui.</p>}
        {conversations.length > 0 && shown.length === 0 && <p className="px-3 py-3 text-sm text-ink-mute">Nenhuma conversa encontrada.</p>}
        {groups.map(({ g, items }) => (
          <div key={g} className="mb-2">
            <p className="px-1 pb-1 pt-2 text-xs text-ink-mute">{g}</p>
            {items.map(c => (
              <button key={c.id} onClick={() => { onOpen(c.id); onView('assistant') }} title={c.title}
                className={`flex w-full items-start gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm transition-colors ${view === 'assistant' && c.id === activeId ? 'bg-white text-ink shadow-sm' : 'text-ink-soft hover:bg-white/70'}`}>
                <MessageSquare className="mt-0.5 h-4 w-4 shrink-0 text-ink-mute" strokeWidth={1.6} aria-hidden />
                <span className="line-clamp-2">{c.title}</span>
              </button>
            ))}
          </div>
        ))}
      </div>

      <div className="m-5 rounded-xl border border-surface-line bg-white/60 p-3.5">
        <p className="flex items-center gap-2 text-sm font-semibold text-ink"><FlaskConical className="h-4 w-4" strokeWidth={1.6} aria-hidden /> Respostas por IA</p>
        <p className="mt-1.5 text-xs leading-snug text-ink-soft">Geradas apenas a partir dos documentos indexados. Confira sempre as fontes.</p>
      </div>
    </aside>
  )
}
