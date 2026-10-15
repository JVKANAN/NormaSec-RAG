import { motion } from 'framer-motion'
import { AlertCircle, ArrowUpRight, Check, Copy, Layers, Loader2, PanelRight, RotateCw, ThumbsDown, ThumbsUp, TriangleAlert } from 'lucide-react'
import { Fragment, useEffect, useMemo, useRef, useState } from 'react'
import type { Stage } from '../hooks/useChat'
import { SUGGESTIONS, timeOf } from '../lib/docs'
import type { Conversation, DocumentItem, Message } from '../types'
import { Citation } from './Citation'
import { Composer } from './Composer'
import { EvidencePanel } from './EvidencePanel'

type Props = {
  conversation: Conversation
  docs: DocumentItem[]
  stage: Stage
  onAsk: (q: string, docIds: string[]) => void
  onRetry: (messageId: string, question: string, docIds: string[]) => void
}

const STAGE_LABEL = { buscando: 'Buscando trechos relevantes…', gerando: 'Gerando resposta…' }

/** Markdown mínimo: **negrito**, listas e marcadores [n] clicáveis. */
function RichText({ text, onCite }: { text: string; onCite: (n: number) => void }) {
  const inline = (s: string) =>
    s.split(/(\*\*[^*]+\*\*|\[\d+\])/g).map((part, i) => {
      const cite = part.match(/^\[(\d+)\]$/)
      if (cite) return <Citation key={i} n={+cite[1]} onClick={onCite} />
      if (part.startsWith('**') && part.endsWith('**')) return <strong key={i} className="font-semibold text-ink">{part.slice(2, -2)}</strong>
      return <Fragment key={i}>{part}</Fragment>
    })
  return (
    <div className="space-y-3 text-[16px] leading-[1.7] text-ink-soft">
      {text.split('\n').filter(l => l.trim()).map((line, i) => {
        const li = line.match(/^\s*(?:[-*•]|\d+[.)])\s+(.*)/)
        return li
          ? <p key={i} className="flex gap-3 pl-1"><span aria-hidden className="text-brand">•</span><span>{inline(li[1])}</span></p>
          : <p key={i}>{inline(line)}</p>
      })}
    </div>
  )
}

function Feedback() {
  const [vote, setVote] = useState<'up' | 'down' | null>(null)
  const btn = (v: 'up' | 'down', label: string, Icon: typeof ThumbsUp) => (
    <button onClick={() => setVote(c => c === v ? null : v)} aria-label={label} aria-pressed={vote === v}
      className={`rounded-md p-1.5 transition-colors ${vote === v ? 'bg-brand-soft text-brand' : 'hover:bg-surface hover:text-brand'}`}>
      <Icon className="h-[18px] w-[18px]" strokeWidth={1.6} aria-hidden />
    </button>
  )
  return <span className="flex items-center gap-1">Foi útil? {btn('up', 'Resposta útil', ThumbsUp)}{btn('down', 'Resposta não útil', ThumbsDown)}</span>
}

type ItemProps = {
  message: Message
  onCite: (messageId: string, n: number | null) => void
  onRetry: (messageId: string, question: string, docIds: string[]) => void
  onAsk: (q: string, docIds: string[]) => void
  canAsk: boolean
}

function MessageItem({ message, onCite, onRetry, onAsk, canAsk }: ItemProps) {
  const [copied, setCopied] = useState(false)
  const enter = { initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.22, ease: 'easeOut' as const } }

  if (message.role === 'user') {
    return (
      <motion.div {...enter} className="rounded-2xl bg-[#eef2f2] px-6 py-5">
        <div className="flex items-center justify-between text-sm"><span className="font-semibold text-ink">Você</span><span className="text-ink-mute">{timeOf(message.at)}</span></div>
        <p className="mt-2 whitespace-pre-wrap text-[16px] leading-relaxed text-ink">{message.text}</p>
      </motion.div>
    )
  }

  const head = (badge: React.ReactNode) => (
    <div className="flex items-center justify-between">
      <span className="flex items-center gap-3 text-sm">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-soft text-brand"><Layers className="h-4 w-4" aria-hidden /></span>
        <span className="font-semibold text-ink">NormaSec</span><span className="text-ink-mute">{timeOf(message.at)}</span>
      </span>
      {badge}
    </div>
  )

  if (message.error) {
    return (
      <motion.div {...enter} role="alert" className="px-1">
        {head(null)}
        <div className="mt-4 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <div className="flex-1">
            <p>{message.error}</p>
            <button onClick={() => onRetry(message.id, message.question, message.docIds ?? [])} className="mt-2 inline-flex items-center gap-1.5 font-medium underline-offset-2 hover:underline">
              <RotateCw className="h-3.5 w-3.5" aria-hidden /> Tentar novamente
            </button>
          </div>
        </div>
      </motion.div>
    )
  }

  const a = message.answer!
  const copy = async () => {
    try { await navigator.clipboard.writeText(a.answer.replace(/\[\d+\]/g, '').replace(/\s+([.,;])/g, '$1')) } catch { return }
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }
  const actions = (
    <div className="mt-6 flex items-center justify-between border-t border-surface-line pt-4 text-sm text-ink-soft">
      <button onClick={copy} className="flex items-center gap-2 transition-colors hover:text-brand">
        {copied ? <Check className="h-[18px] w-[18px]" aria-hidden /> : <Copy className="h-[18px] w-[18px]" strokeWidth={1.6} aria-hidden />}
        {copied ? 'Copiado' : 'Copiar resposta'}
      </button>
      <Feedback />
    </div>
  )

  if (a.insufficientContext) {
    const retry = SUGGESTIONS.slice(0, 2)
    return (
      <motion.div {...enter} className="px-1">
        {head(<span className="rounded-md bg-amber-soft px-2.5 py-1 text-xs font-semibold text-amber-ink">Evidência insuficiente</span>)}
        <h2 className="mt-5 text-[26px] font-semibold leading-tight tracking-tight text-ink">Não encontrei evidência suficiente nesta base.</h2>
        <p className="mt-3 text-[16px] leading-[1.7] text-ink-soft">{a.answer}</p>
        <div className="mt-5 flex items-start gap-3 rounded-xl bg-amber-soft px-5 py-4 text-amber-ink">
          <TriangleAlert className="mt-0.5 h-5 w-5 shrink-0" strokeWidth={1.6} aria-hidden />
          <div className="text-sm"><p className="font-semibold">Não interprete a ausência de resposta como confirmação.</p>
            <p className="mt-1 text-ink">Consulte a área responsável pelo tema antes de agir.</p></div>
        </div>
        <p className="mt-6 text-[15px] font-semibold text-ink">Você pode reformular a pergunta</p>
        <div className="mt-3 space-y-3">
          {retry.map(s => (
            <button key={s.q} disabled={!canAsk} onClick={() => onAsk(s.q, [])}
              className="flex w-full items-center justify-between gap-4 rounded-xl border border-surface-line bg-white px-4 py-3 text-left text-sm text-brand transition-colors hover:border-brand/50 disabled:opacity-50">
              {s.q} <ArrowUpRight className="h-4 w-4 shrink-0" aria-hidden />
            </button>
          ))}
        </div>
        {actions}
      </motion.div>
    )
  }

  const n = a.sources.length
  return (
    <motion.div {...enter} className="px-1">
      {head(<span className="rounded-md bg-brand-soft px-2.5 py-1 text-xs font-semibold text-brand">Resposta com fontes</span>)}
      <div className="mt-5"><RichText text={a.answer} onCite={c => onCite(message.id, c)} /></div>
      {n > 0 && (
        <button onClick={() => onCite(message.id, null)} className="mt-5 flex items-center gap-2 text-sm font-medium text-brand hover:underline">
          <PanelRight className="h-4 w-4" strokeWidth={1.6} aria-hidden />
          Confira {n === 1 ? 'o trecho [1]' : `os trechos ${a.sources.map((_, i) => `[${i + 1}]`).join(', ').replace(/, (\[\d+\])$/, ' e $1')}`} no painel de evidências.
        </button>
      )}
      {actions}
    </motion.div>
  )
}

export function ConversationView({ conversation, docs, stage, onAsk, onRetry }: Props) {
  const endRef = useRef<HTMLDivElement>(null)
  const [selected, setSelected] = useState<{ id: string; n: number | null } | null>(null)
  const [panelOpen, setPanelOpen] = useState(false)
  const msgs = conversation.messages

  useEffect(() => { setSelected(null); setPanelOpen(false) }, [conversation.id])
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }) }, [msgs.length, stage])

  const lastAssistant = useMemo(() => [...msgs].reverse().find(m => m.role === 'assistant') ?? null, [msgs])
  const shown = (selected && msgs.find(m => m.id === selected.id)) || lastAssistant
  const cite = (id: string, n: number | null) => { setSelected({ id, n }); setPanelOpen(true) }
  const canAsk = docs.some(d => d.status === 'pronto')

  return (
    <div className="flex min-h-0 flex-1">
      <section className="flex min-w-0 flex-1 flex-col" aria-label="Conversa">
        <div className="flex-1 overflow-y-auto px-6 py-7 lg:px-10" aria-live="polite">
          <div className="mx-auto max-w-[820px] space-y-8">
            {msgs.map(m => <MessageItem key={m.id} message={m} onCite={cite} onRetry={onRetry} onAsk={onAsk} canAsk={canAsk} />)}
            {stage && (
              <p className="flex items-center gap-2 px-1 text-sm text-ink-soft"><Loader2 className="h-4 w-4 animate-spin" aria-hidden /> {STAGE_LABEL[stage]}</p>
            )}
            <div ref={endRef} />
          </div>
        </div>
        <div className="px-6 pb-5 pt-2 lg:px-10">
          <div className="mx-auto max-w-[820px]">
            <Composer docs={docs} busy={stage !== null} placeholder="Faça uma pergunta de acompanhamento…" onSend={onAsk} />
          </div>
        </div>
      </section>
      <EvidencePanel message={shown} loading={stage !== null} highlight={selected?.n ?? null}
        indexedDocs={docs.filter(d => d.status === 'pronto').length} open={panelOpen} onClose={() => setPanelOpen(false)} />
    </div>
  )
}
