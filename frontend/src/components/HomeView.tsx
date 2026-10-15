import { motion } from 'framer-motion'
import { ArrowRight, ArrowUpRight, BookOpen, CircleCheck, Info, Layers, Scale, ShieldCheck, TriangleAlert } from 'lucide-react'
import { CATEGORIES, CATEGORY_HINT, SUGGESTIONS, categoryOf } from '../lib/docs'
import type { DocumentItem } from '../types'
import { Composer } from './Composer'

type Props = {
  docs: DocumentItem[]
  loading: boolean
  busy: boolean
  onAsk: (q: string, docIds: string[]) => void
  onExplore: () => void
}

const SUGGESTION_ICON = { shield: ShieldCheck, alert: TriangleAlert, scale: Scale }
const CATEGORY_ICON = { 'Normas técnicas': BookOpen, 'Legislação': Scale, 'Boas práticas': ShieldCheck }

export function HomeView({ docs, loading, busy, onAsk, onExplore }: Props) {
  const ready = docs.filter(d => d.status === 'pronto')
  const indexing = docs.filter(d => d.status === 'processando').length
  const counts = CATEGORIES.map(c => ({ c, n: docs.filter(d => categoryOf(d.name) === c).length }))
  const canAsk = ready.length > 0

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}
      className="mx-auto w-full max-w-[1100px] px-6 pb-10 pt-14 lg:px-10">
      <p className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-brand">
        <Layers className="h-[18px] w-[18px]" strokeWidth={1.6} aria-hidden /> Seu assistente de conhecimento
      </p>
      <h2 className="mt-3 text-4xl font-semibold tracking-tight text-ink">O que você precisa esclarecer?</h2>
      <p className="mt-4 max-w-3xl text-lg leading-relaxed text-ink-soft">
        Consulte normas, legislação e boas práticas de segurança da informação. Receba uma resposta fundamentada e veja o trecho que sustenta cada orientação.
      </p>

      <div className="mt-9">
        <Composer docs={docs} busy={busy} large placeholder="Ex.: como devo reagir a um incidente de segurança?" onSend={onAsk} />
      </div>

      {!loading && !canAsk && (
        <p role="status" className="mt-4 rounded-xl bg-amber-soft px-4 py-3 text-sm text-amber-ink">
          {indexing > 0 ? 'Os documentos ainda estão sendo indexados. Você poderá perguntar assim que o primeiro ficar pronto.'
            : 'Nenhum documento disponível. Adicione documentos na Base de documentos para começar.'}
        </p>
      )}

      <h3 className="mt-10 text-[15px] font-semibold text-ink">Comece por uma destas perguntas</h3>
      <div className="mt-3 grid gap-4 md:grid-cols-3">
        {SUGGESTIONS.map(s => {
          const Icon = SUGGESTION_ICON[s.icon]
          return (
            <button key={s.q} disabled={!canAsk || busy} onClick={() => onAsk(s.q, [])}
              className="group flex flex-col rounded-2xl border border-surface-line bg-white p-5 text-left transition-all hover:border-brand/50 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50">
              <span className="flex items-center justify-between text-brand">
                <Icon className="h-5 w-5" strokeWidth={1.6} aria-hidden />
                <ArrowUpRight className="h-4 w-4 text-ink-mute transition-colors group-hover:text-brand" aria-hidden />
              </span>
              <span className="mt-3 text-[11px] font-semibold uppercase tracking-wide text-ink-soft">{s.tag}</span>
              <span className="mt-1.5 text-[15px] font-medium leading-snug text-ink">{s.q}</span>
            </button>
          )
        })}
      </div>

      <div className="mt-10 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-ink">Uma base organizada para sua consulta</h3>
        <button onClick={onExplore} className="flex items-center gap-1.5 text-sm font-medium text-brand hover:underline">
          Explorar documentos <ArrowRight className="h-4 w-4" aria-hidden />
        </button>
      </div>
      <div className="mt-3 grid divide-y divide-surface-line rounded-2xl border border-surface-line bg-white md:grid-cols-3 md:divide-x md:divide-y-0">
        {counts.map(({ c, n }) => {
          const Icon = CATEGORY_ICON[c]
          return (
            <div key={c} className="p-5">
              <p className="flex items-baseline gap-3 text-brand">
                <Icon className="h-5 w-5 self-center" strokeWidth={1.6} aria-hidden />
                <span className="text-3xl font-semibold">{loading ? '–' : n}</span>
                <span className="text-sm text-ink-soft">{n === 1 ? 'documento' : 'documentos'}</span>
              </p>
              <p className="mt-3 font-semibold text-ink">{c}</p>
              <p className="mt-1 text-sm text-ink-soft">{CATEGORY_HINT[c]}</p>
            </div>
          )
        })}
      </div>
      <p className="mt-3 flex items-center gap-2 text-sm text-ink-soft">
        <CircleCheck className="h-4 w-4 text-brand" aria-hidden />
        {ready.length} {ready.length === 1 ? 'documento disponível' : 'documentos disponíveis'} para consulta{indexing > 0 ? ` · ${indexing} em indexação` : ''}
      </p>

      <p className="mt-6 flex items-center gap-3 rounded-xl bg-brand-soft px-5 py-3.5 text-sm text-brand-ink">
        <Info className="h-4 w-4 shrink-0" aria-hidden />
        Sem evidência suficiente, o NormaSec informa o limite da busca, em vez de criar uma resposta.
      </p>
    </motion.div>
  )
}
