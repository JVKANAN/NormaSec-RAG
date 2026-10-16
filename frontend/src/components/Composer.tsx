import { ArrowUp, Check, ChevronDown, FileText } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { displayName } from '../lib/docs'
import { fetchModels, getModel, setModel, type ModelOption } from '../services/assistant'
import type { DocumentItem } from '../types'

type Props = {
  docs: DocumentItem[]
  busy: boolean
  placeholder: string
  onSend: (q: string, docIds: string[]) => void
  large?: boolean
}

export function Composer({ docs, busy, placeholder, onSend, large }: Props) {
  const [text, setText] = useState('')
  const [scope, setScope] = useState<string[]>([]) // vazio = todos
  const [menu, setMenu] = useState(false)
  const ref = useRef<HTMLTextAreaElement>(null)
  const box = useRef<HTMLDivElement>(null)
  const [models, setModels] = useState<ModelOption[]>([])
  const [model, setModelState] = useState(getModel())
  useEffect(() => { fetchModels().then(setModels).catch(() => {}) }, [])

  const ready = docs.filter(d => d.status === 'pronto')
  const valid = scope.filter(id => ready.some(d => d.id === id))
  const hasReady = ready.length > 0

  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 192)}px`
  }, [text])

  useEffect(() => {
    if (!menu) return
    const off = (e: MouseEvent) => { if (!box.current?.contains(e.target as Node)) setMenu(false) }
    const key = (e: KeyboardEvent) => { if (e.key === 'Escape') setMenu(false) }
    document.addEventListener('mousedown', off)
    window.addEventListener('keydown', key)
    return () => { document.removeEventListener('mousedown', off); window.removeEventListener('keydown', key) }
  }, [menu])

  const reason = !hasReady ? 'Adicione ao menos um documento pronto' : busy ? 'Aguarde a resposta atual' : !text.trim() ? 'Digite uma pergunta' : ''
  const send = () => {
    if (reason) return
    onSend(text.trim(), valid)
    setText('')
  }
  const toggle = (id: string) => setScope(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id])
  const label = valid.length === 0 ? 'Todos os documentos' : valid.length === 1
    ? displayName(ready.find(d => d.id === valid[0])!.name) : `${valid.length} documentos`

  return (
    <div>
      <div className="rounded-2xl border border-surface-line bg-white shadow-sm transition-colors focus-within:border-brand">
        <textarea ref={ref} rows={large ? 2 : 1} value={text} maxLength={1500}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); send() } }}
          placeholder={placeholder} aria-label="Pergunta"
          className={`block w-full resize-none rounded-t-2xl bg-transparent px-5 text-[15px] outline-none placeholder:text-ink-mute ${large ? 'pt-5' : 'pt-4'}`} />
        <div className="flex items-center justify-between gap-3 px-3 pb-3 pt-2">
          <div ref={box} className="relative min-w-0">
            <button onClick={() => setMenu(m => !m)} aria-expanded={menu} disabled={!hasReady}
              className="flex max-w-[260px] items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-ink-soft transition-colors hover:bg-surface disabled:opacity-50">
              <FileText className="h-4 w-4 shrink-0" strokeWidth={1.6} aria-hidden />
              <span className="truncate">{label}</span>
              <ChevronDown className="h-4 w-4 shrink-0" aria-hidden />
            </button>
            {menu && (
              <div className="absolute bottom-full left-0 z-30 mb-2 max-h-72 w-80 overflow-y-auto rounded-xl border border-surface-line bg-white p-1.5 shadow-xl">
                <button onClick={() => setScope([])} className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm hover:bg-surface">
                  Todos os documentos {valid.length === 0 && <Check className="h-4 w-4 text-brand" aria-hidden />}
                </button>
                <div className="my-1 border-t border-surface-line" />
                {ready.map(d => (
                  <button key={d.id} onClick={() => toggle(d.id)} className="flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-surface">
                    <span className="truncate" title={d.name}>{displayName(d.name)}</span>
                    {valid.includes(d.id) && <Check className="h-4 w-4 shrink-0 text-brand" aria-hidden />}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <select value={model} aria-label="Modelo de IA" onChange={e => { setModel(e.target.value); setModelState(e.target.value) }}
              className="max-w-[170px] rounded-lg border border-surface-line bg-white px-2 py-2 text-sm text-ink-soft">
              {models.map(m => <option key={m.id} value={m.id}>{m.label}</option>)}
            </select>
          <button onClick={send} disabled={!!reason} title={reason || 'Enviar pergunta'}
            className="flex shrink-0 items-center gap-2 rounded-xl bg-brand px-5 py-3 text-[15px] font-medium text-white transition-colors hover:bg-brand-dark disabled:cursor-not-allowed disabled:bg-[#b7c8c9]">
            <ArrowUp className="h-4 w-4" aria-hidden /> Enviar pergunta
          </button>
          </div>
        </div>
      </div>
      <p className="mt-3 text-center text-xs text-ink-soft">Confira sempre as fontes. Não inclua dados pessoais ou informações confidenciais na pergunta.</p>
    </div>
  )
}
