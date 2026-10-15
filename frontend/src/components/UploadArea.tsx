import { Upload } from 'lucide-react'
import { useRef, useState } from 'react'

type Props = { onFiles: (files: File[]) => void }

export function UploadArea({ onFiles }: Props) {
  const input = useRef<HTMLInputElement>(null)
  const [over, setOver] = useState(false)

  return (
    <div
      onDragOver={e => { e.preventDefault(); setOver(true) }}
      onDragLeave={() => setOver(false)}
      onDrop={e => { e.preventDefault(); setOver(false); onFiles(Array.from(e.dataTransfer.files)) }}
      className={`flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-dashed px-5 py-4 transition-colors ${over ? 'border-brand bg-brand-soft' : 'border-[#c5d3d3] bg-white'}`}
    >
      <input ref={input} type="file" multiple accept=".pdf,.txt,.md" hidden aria-label="Selecionar arquivos"
        onChange={e => { onFiles(Array.from(e.target.files ?? [])); e.target.value = '' }} />
      <p className="text-sm text-ink-soft">Arraste arquivos aqui ou adicione manualmente · PDF, TXT, MD · até 25 MB</p>
      <button onClick={() => input.current?.click()}
        className="inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-dark">
        <Upload className="h-4 w-4" aria-hidden /> Adicionar documentos
      </button>
    </div>
  )
}
