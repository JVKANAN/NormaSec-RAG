import { HelpCircle, Menu, X } from 'lucide-react'
import { useEffect, useState } from 'react'

type Props = { title: string; subtitle: string; badge: string; onMenu: () => void }

const STEPS = [
  ['Busca', 'Sua pergunta é comparada, por significado, com os trechos dos documentos indexados.'],
  ['Resposta', 'Um modelo de linguagem responde usando somente os trechos encontrados.'],
  ['Evidências', 'Cada número na resposta leva ao trecho original que a sustenta.'],
  ['Limite', 'Sem evidência suficiente, o NormaSec informa o limite da busca em vez de criar uma resposta.'],
]

export function PageHeader({ title, subtitle, badge, onMenu }: Props) {
  const [open, setOpen] = useState(false)
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  return (
    <header className="relative flex h-[84px] shrink-0 items-center justify-between border-b border-surface-line bg-white px-6 lg:px-8">
      <div className="flex min-w-0 items-center gap-3">
        <button onClick={onMenu} aria-label="Abrir menu" className="rounded-lg p-2 text-ink-soft hover:bg-surface lg:hidden"><Menu className="h-5 w-5" aria-hidden /></button>
        <div className="min-w-0">
          <h1 className="truncate text-lg font-semibold text-ink">{title}</h1>
          <p className="truncate text-sm text-ink-soft">{subtitle}</p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-5">
        <span className="hidden rounded-md bg-surface px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-ink-soft sm:block">{badge}</span>
        <button onClick={() => setOpen(o => !o)} aria-expanded={open}
          className="flex items-center gap-2 text-sm text-ink-soft transition-colors hover:text-brand">
          <HelpCircle className="h-[18px] w-[18px]" strokeWidth={1.6} aria-hidden /> <span className="hidden sm:inline">Como funciona</span>
        </button>
      </div>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} aria-hidden />
          <div role="dialog" aria-label="Como funciona" className="absolute right-6 top-[76px] z-50 w-[360px] max-w-[calc(100vw-3rem)] rounded-2xl border border-surface-line bg-white p-5 shadow-xl">
            <div className="flex items-center justify-between">
              <p className="font-semibold text-ink">Como o NormaSec responde</p>
              <button onClick={() => setOpen(false)} aria-label="Fechar" className="rounded-md p-1 text-ink-mute hover:bg-surface"><X className="h-4 w-4" aria-hidden /></button>
            </div>
            <ol className="mt-3 space-y-3">
              {STEPS.map(([t, d], i) => (
                <li key={t} className="flex gap-3 text-sm">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-brand-soft text-xs font-semibold text-brand">{i + 1}</span>
                  <p className="text-ink-soft"><strong className="font-semibold text-ink">{t}.</strong> {d}</p>
                </li>
              ))}
            </ol>
          </div>
        </>
      )}
    </header>
  )
}
