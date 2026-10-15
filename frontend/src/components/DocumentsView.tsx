import { AlertCircle, ArrowDownUp, Check, ChevronDown, ChevronLeft, ChevronRight, CircleCheck, FileText, Files, Info, Loader2, RefreshCw, Search, SlidersHorizontal, Trash2, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import { CATEGORIES, TYPE_LABEL, categoryOf, displayName } from '../lib/docs'
import type { DocumentItem, Params } from '../types'
import { UploadArea } from './UploadArea'

type Props = {
  docs: DocumentItem[]
  loading: boolean
  error: string | null
  params: Params
  onParams: (p: Params) => void
  onUpload: (files: File[]) => void
  onRemove: (id: string) => void
  onRefresh: () => void
  onDismissError: () => void
}

const PAGE = 6
type StatusFilter = 'todos' | DocumentItem['status']
type Sort = 'padrao' | 'nome' | 'trechos'

function Badge({ status }: { status: DocumentItem['status'] }) {
  if (status === 'pronto') return <span className="inline-flex items-center gap-1.5 rounded-md bg-[#e1f1e8] px-3 py-1 text-xs font-semibold text-[#1d6b45]">Indexado</span>
  if (status === 'erro') return <span className="inline-flex items-center gap-1.5 rounded-md bg-red-50 px-3 py-1 text-xs font-semibold text-red-700">Erro</span>
  return <span className="inline-flex items-center gap-1.5 rounded-md bg-amber-soft px-3 py-1 text-xs font-semibold text-amber-ink"><Loader2 className="h-3 w-3 animate-spin" aria-hidden /> Indexando</span>
}

function Stat({ value, label, hint, icon, tone }: { value: number; label: string; hint: string; icon: React.ReactNode; tone: string }) {
  return (
    <div className="rounded-2xl border border-surface-line bg-white p-5">
      <div className="flex items-center gap-3">
        <span className={`text-4xl font-semibold ${tone}`}>{value}</span>
        <div><p className="font-semibold text-ink">{label}</p><p className="mt-0.5 text-xs text-ink-soft">{hint}</p></div>
      </div>
      <div className={`mt-2 ${tone}`}>{icon}</div>
    </div>
  )
}

function Field({ label, value, min, max, onChange }: { label: string; value: number; min: number; max: number; onChange: (n: number) => void }) {
  return (
    <label className="flex items-center justify-between gap-3 text-sm text-ink-soft">
      {label}
      <input type="number" value={value} min={min} max={max}
        onChange={e => onChange(Math.min(max, Math.max(min, Number(e.target.value) || min)))}
        className="w-24 rounded-lg border border-surface-line bg-white px-3 py-1.5 text-right text-ink" />
    </label>
  )
}

export function DocumentsView({ docs, loading, error, params, onParams, onUpload, onRemove, onRefresh, onDismissError }: Props) {
  const [q, setQ] = useState('')
  const [status, setStatus] = useState<StatusFilter>('todos')
  const [sort, setSort] = useState<Sort>('padrao')
  const [cat, setCat] = useState<string>('todas')
  const [page, setPage] = useState(1)
  const [confirm, setConfirm] = useState<string | null>(null)
  const [advanced, setAdvanced] = useState(false)

  const ready = docs.filter(d => d.status === 'pronto').length
  const indexing = docs.filter(d => d.status === 'processando').length
  const failed = docs.filter(d => d.status === 'erro').length

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase()
    const list = docs.filter(d =>
      (status === 'todos' || d.status === status) &&
      (cat === 'todas' || categoryOf(d.name) === cat) &&
      (!term || d.name.toLowerCase().includes(term) || categoryOf(d.name).toLowerCase().includes(term)))
    if (sort === 'nome') list.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
    if (sort === 'trechos') list.sort((a, b) => b.chunks - a.chunks)
    return list
  }, [docs, q, status, cat, sort])

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE))
  const cur = Math.min(page, pages)
  const rows = filtered.slice((cur - 1) * PAGE, cur * PAGE)
  const reset = <T,>(set: (v: T) => void) => (v: T) => { set(v); setPage(1) }

  const chip = (value: string, label: string, n: number) => (
    <button key={value} onClick={() => reset(setCat)(value)} aria-pressed={cat === value}
      className={`rounded-lg px-3.5 py-2 text-sm transition-colors ${cat === value ? 'bg-brand-soft font-semibold text-brand' : 'border border-surface-line bg-white text-ink-soft hover:border-brand/40'}`}>
      {label} · {n}
    </button>
  )
  const select = <T extends string>(value: T, onChange: (v: T) => void, options: [T, string][], Icon: typeof ChevronDown, label: string) => (
    <label className="relative">
      <span className="sr-only">{label}</span>
      <Icon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft" aria-hidden />
      <select value={value} onChange={e => onChange(e.target.value as T)}
        className="h-12 cursor-pointer appearance-none rounded-xl border border-surface-line bg-white pl-10 pr-4 text-sm font-medium text-ink outline-none focus:border-brand">
        {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>
    </label>
  )

  return (
    <div className="mx-auto w-full max-w-[1200px] px-6 pb-10 pt-8 lg:px-10">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-4xl font-semibold tracking-tight text-ink">Base de documentos</h2>
          <p className="mt-2 text-ink-soft">Consulte as fontes e a disponibilidade de cada uma para o assistente.</p>
        </div>
        <button onClick={onRefresh} className="flex items-center gap-2 rounded-xl border border-surface-line bg-white px-5 py-3 text-sm font-medium text-ink transition-colors hover:border-brand/40">
          <RefreshCw className="h-4 w-4" aria-hidden /> Atualizar lista
        </button>
      </div>

      {error && (
        <div role="alert" className="mt-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <p className="flex-1">{error}</p>
          <button onClick={onDismissError} aria-label="Dispensar aviso"><X className="h-4 w-4" aria-hidden /></button>
        </div>
      )}

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <Stat value={docs.length} label="Documentos na base" hint={CATEGORIES.map(c => `${docs.filter(d => categoryOf(d.name) === c).length} ${c.toLowerCase()}`).join(' · ')} tone="text-brand" icon={<Files className="h-5 w-5" strokeWidth={1.6} aria-hidden />} />
        <Stat value={ready} label="Disponíveis para consulta" hint="Trechos prontos para recuperação" tone="text-brand" icon={<CircleCheck className="h-5 w-5" strokeWidth={1.6} aria-hidden />} />
        <Stat value={indexing + failed} label={failed && !indexing ? 'Com erro' : 'Em indexação'} hint={failed ? `${failed} com falha no processamento` : 'Disponíveis após concluir o processamento'} tone="text-amber-ink" icon={<Loader2 className={`h-5 w-5 ${indexing ? 'animate-spin' : ''}`} strokeWidth={1.6} aria-hidden />} />
      </div>

      <div className="mt-6"><UploadArea onFiles={onUpload} /></div>

      <div className="mt-5 flex flex-wrap gap-3">
        <label className="relative min-w-[240px] flex-1">
          <span className="sr-only">Buscar documentos</span>
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft" aria-hidden />
          <input value={q} onChange={e => reset(setQ)(e.target.value)} placeholder="Buscar por nome ou categoria…"
            className="h-12 w-full rounded-xl border border-surface-line bg-white pl-11 pr-4 text-sm outline-none focus:border-brand" />
        </label>
        {select<StatusFilter>(status, reset(setStatus), [['todos', 'Todos os estados'], ['pronto', 'Indexado'], ['processando', 'Indexando'], ['erro', 'Com erro']], ChevronDown, 'Filtrar por estado')}
        {select<Sort>(sort, reset(setSort), [['padrao', 'Ordem padrão'], ['nome', 'Nome (A–Z)'], ['trechos', 'Mais trechos']], ArrowDownUp, 'Ordenar')}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {chip('todas', 'Todos', docs.length)}
        {CATEGORIES.map(c => chip(c, c, docs.filter(d => categoryOf(d.name) === c).length))}
      </div>

      <div className="mt-5 overflow-hidden rounded-2xl border border-surface-line bg-white">
        <div className="hidden grid-cols-[minmax(0,1fr)_160px_90px_130px_44px] gap-4 border-b border-surface-line bg-surface px-6 py-4 text-[11px] font-semibold uppercase tracking-wide text-ink-soft md:grid">
          <span>Documento</span><span>Categoria</span><span>Trechos</span><span>Indexação</span><span />
        </div>
        {loading && <p className="px-6 py-10 text-center text-sm text-ink-soft">Carregando…</p>}
        {!loading && rows.length === 0 && (
          <p className="px-6 py-10 text-center text-sm text-ink-soft">{docs.length === 0 ? 'Nenhum documento adicionado ainda.' : 'Nenhum documento corresponde aos filtros.'}</p>
        )}
        {rows.map(d => (
          <div key={d.id} className="border-b border-surface-line last:border-0">
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-2 px-6 py-4 md:grid-cols-[minmax(0,1fr)_160px_90px_130px_44px]">
              <div className="flex min-w-0 items-center gap-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-surface text-ink-soft"><FileText className="h-5 w-5" strokeWidth={1.5} aria-hidden /></span>
                <div className="min-w-0">
                  <p className="truncate font-semibold text-ink" title={d.name}>{displayName(d.name)}</p>
                  <p className="mt-0.5 truncate text-xs text-ink-soft">{TYPE_LABEL[d.type]} · {d.name}</p>
                  {d.status === 'erro' && d.error && <p className="mt-1 text-xs text-red-700">{d.error}</p>}
                </div>
              </div>
              <span className="hidden text-sm text-ink-soft md:block">{categoryOf(d.name)}</span>
              <span className="hidden text-sm tabular-nums text-ink-soft md:block">{d.status === 'pronto' ? d.chunks : '–'}</span>
              <span className="col-start-1 md:col-start-auto"><Badge status={d.status} /></span>
              <button onClick={() => setConfirm(d.id)} aria-label={`Remover ${displayName(d.name)}`} title="Remover da base"
                className="justify-self-end rounded-md p-2 text-ink-mute transition-colors hover:bg-red-50 hover:text-red-600 md:col-start-auto"><Trash2 className="h-4 w-4" aria-hidden /></button>
            </div>
            {confirm === d.id && (
              <div className="mx-6 mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg bg-red-50 px-4 py-2.5 text-sm text-red-800">
                <span>Remover este documento da base? O arquivo original da base é preservado.</span>
                <span className="flex gap-4">
                  <button onClick={() => { onRemove(d.id); setConfirm(null) }} className="flex items-center gap-1 font-semibold"><Check className="h-4 w-4" aria-hidden /> Remover</button>
                  <button onClick={() => setConfirm(null)} className="text-ink-soft">Cancelar</button>
                </span>
              </div>
            )}
          </div>
        ))}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-surface-line px-6 py-4 text-sm text-ink-soft">
          <span>Exibindo {rows.length} de {filtered.length} {filtered.length === 1 ? 'documento' : 'documentos'}</span>
          {pages > 1 && (
            <nav className="flex items-center gap-1" aria-label="Paginação">
              <button onClick={() => setPage(cur - 1)} disabled={cur === 1} aria-label="Página anterior" className="rounded-md p-2 hover:bg-surface disabled:opacity-40"><ChevronLeft className="h-4 w-4" aria-hidden /></button>
              {Array.from({ length: pages }, (_, i) => i + 1).map(p => (
                <button key={p} onClick={() => setPage(p)} aria-current={p === cur ? 'page' : undefined}
                  className={`h-9 min-w-9 rounded-md px-2 ${p === cur ? 'bg-brand-soft font-semibold text-brand' : 'hover:bg-surface'}`}>{p}</button>
              ))}
              <button onClick={() => setPage(cur + 1)} disabled={cur === pages} aria-label="Próxima página" className="rounded-md p-2 hover:bg-surface disabled:opacity-40"><ChevronRight className="h-4 w-4" aria-hidden /></button>
            </nav>
          )}
        </div>
      </div>

      <div className="mt-5 rounded-2xl border border-surface-line bg-white px-6 py-4">
        <button onClick={() => setAdvanced(a => !a)} aria-expanded={advanced} className="flex w-full items-center justify-between text-sm font-medium text-ink">
          <span className="flex items-center gap-2"><SlidersHorizontal className="h-4 w-4 text-ink-soft" aria-hidden /> Parâmetros avançados</span>
          <ChevronDown className={`h-4 w-4 transition-transform ${advanced ? 'rotate-180' : ''}`} aria-hidden />
        </button>
        {advanced && (
          <div className="mt-4 grid gap-3 md:grid-cols-3 md:gap-8">
            <Field label="Tamanho do trecho" value={params.chunkSize} min={200} max={4000} onChange={chunkSize => onParams({ ...params, chunkSize, overlap: Math.min(params.overlap, Math.floor(chunkSize / 2) - 1) })} />
            <Field label="Sobreposição" value={params.overlap} min={0} max={Math.floor(params.chunkSize / 2) - 1} onChange={overlap => onParams({ ...params, overlap })} />
            <Field label="Trechos por resposta" value={params.topK} min={1} max={10} onChange={topK => onParams({ ...params, topK })} />
            <p className="text-xs text-ink-mute md:col-span-3">Tamanho e sobreposição valem para os próximos documentos adicionados.</p>
          </div>
        )}
      </div>

      <p className="mt-5 flex items-start gap-2.5 text-sm text-ink-soft">
        <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
        O assistente consulta apenas documentos indexados. {indexing > 0 ? 'Os documentos em indexação ainda não serão usados nas respostas.' : 'Todos os documentos prontos estão disponíveis nas respostas.'}
      </p>
    </div>
  )
}
