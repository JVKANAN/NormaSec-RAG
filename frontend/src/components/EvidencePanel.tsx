import { ChevronUp, FileSearch, FileText, Info, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { displayName } from '../lib/docs'
import type { Message, Source } from '../types'

type Props = {
  message: Message | null
  loading: boolean
  highlight: number | null
  indexedDocs: number
  open: boolean
  onClose: () => void
}

function SourceCard({ s, n, active, innerRef }: { s: Source; n: number; active: boolean; innerRef: (el: HTMLElement | null) => void }) {
  const [open, setOpen] = useState(true)
  useEffect(() => { if (active) setOpen(true) }, [active])
  return (
    <article ref={innerRef} className={`rounded-2xl border bg-white p-4 transition-colors duration-300 ${active ? 'border-brand shadow-sm' : 'border-surface-line'}`}>
      <button onClick={() => setOpen(o => !o)} aria-expanded={open} className="flex w-full items-start gap-3 text-left">
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-brand-soft text-xs font-semibold text-brand">{n}</span>
        <span className="min-w-0 flex-1">
          <span className="block text-[15px] font-semibold leading-snug text-ink">{displayName(s.documentName)}</span>
          <span className="mt-0.5 block text-xs text-ink-soft">{s.location} · relevância {s.score.toFixed(2)}</span>
        </span>
        <ChevronUp className={`mt-1 h-4 w-4 shrink-0 text-ink-mute transition-transform ${open ? '' : 'rotate-180'}`} aria-hidden />
      </button>
      {open && (
        <div className="mt-3 border-l-[3px] border-brand bg-brand-tint px-4 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-ink-soft">Trecho recuperado · [{n}]</p>
          <p className="mt-1.5 whitespace-pre-wrap text-[13.5px] leading-relaxed text-ink">{s.text}</p>
        </div>
      )}
    </article>
  )
}

export function EvidencePanel({ message, loading, highlight, indexedDocs, open, onClose }: Props) {
  const refs = useRef<(HTMLElement | null)[]>([])
  const answer = message?.role === 'assistant' ? message.answer : undefined
  const sources = answer?.sources ?? []
  const insufficient = !!answer?.insufficientContext

  useEffect(() => {
    if (highlight) refs.current[highlight - 1]?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, [highlight, message?.id])

  const chip = insufficient
    ? <span className="rounded-md bg-amber-soft px-2.5 py-1 text-xs font-semibold text-amber-ink">Sem suporte suficiente</span>
    : sources.length > 0
      ? <span className="rounded-md bg-brand-soft px-2.5 py-1 text-xs font-semibold text-brand">{sources.length} {sources.length === 1 ? 'fonte' : 'fontes'}</span>
      : null

  return (
    <>
      {open && <div className="fixed inset-0 z-30 bg-black/20 xl:hidden" onClick={onClose} aria-hidden />}
      <aside aria-label="Evidências"
        className={`${open ? 'fixed inset-y-0 right-0 z-40 flex w-full max-w-md' : 'hidden'} flex-col overflow-y-auto border-l border-surface-line bg-surface-side px-6 py-6 xl:static xl:z-auto xl:flex xl:w-[400px] xl:max-w-none xl:shrink-0`}>
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-xl font-semibold text-ink">Evidências</h2>
          <div className="flex items-center gap-2">
            {chip}
            <button onClick={onClose} aria-label="Fechar evidências" className="rounded-md p-1 text-ink-mute hover:bg-white xl:hidden"><X className="h-4 w-4" aria-hidden /></button>
          </div>
        </div>

        {loading && <p className="mt-6 text-sm text-ink-soft">Buscando trechos nos documentos…</p>}

        {!loading && !message && <p className="mt-4 text-sm leading-relaxed text-ink-soft">As evidências da resposta aparecem aqui.</p>}

        {!loading && message && sources.length > 0 && (
          <>
            <p className="mt-3 text-sm leading-relaxed text-ink-soft">Cada número conecta uma orientação ao trecho original que a fundamenta.</p>
            <div className="mt-5 space-y-4">
              {sources.map((s, i) => <SourceCard key={s.id} s={s} n={i + 1} active={highlight === i + 1} innerRef={el => { refs.current[i] = el }} />)}
            </div>
            <p className="mt-5 flex items-start gap-2 text-xs text-ink-soft"><Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden /> Trechos extraídos dos documentos indexados, sem edição.</p>
          </>
        )}

        {!loading && insufficient && (
          <>
            <div className="mt-5 rounded-2xl border border-surface-line bg-white p-5">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-soft text-amber-ink"><FileSearch className="h-5 w-5" strokeWidth={1.6} aria-hidden /></span>
              <p className="mt-4 text-lg font-semibold leading-snug text-ink">Nenhum trecho fundamenta uma resposta.</p>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">A busca não encontrou, nos documentos consultados, conteúdo que sustente esta pergunta.</p>
              <div className="mt-4 border-t border-surface-line pt-4">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-ink-soft">Escopo consultado</p>
                <p className="mt-1 text-sm font-medium text-ink">{indexedDocs} {indexedDocs === 1 ? 'documento indexado' : 'documentos indexados'}</p>
              </div>
            </div>
            <div className="mt-5 rounded-2xl bg-brand-soft p-5">
              <p className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wide text-brand"><FileText className="h-3.5 w-3.5" aria-hidden /> Próximo passo</p>
              <p className="mt-2 text-sm leading-relaxed text-brand-ink">Reformule a pergunta com os termos do documento ou consulte a área responsável pelo tema.</p>
            </div>
          </>
        )}

        {!loading && message?.role === 'assistant' && message.error && (
          <p className="mt-4 text-sm text-ink-soft">Não foi possível recuperar as evidências desta pergunta.</p>
        )}
      </aside>
    </>
  )
}
