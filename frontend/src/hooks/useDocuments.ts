import { useCallback, useEffect, useState } from 'react'
import type { DocumentItem, Params } from '../types'
import { listDocuments, removeDocument, uploadDocument } from '../services/documents'

export const DEFAULT_PARAMS: Params = { chunkSize: 1000, overlap: 150, topK: 5 }

export function useDocuments() {
  const [docs, setDocs] = useState<DocumentItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [params, setParams] = useState<Params>(DEFAULT_PARAMS)

  const refresh = useCallback(async () => {
    try { setDocs(await listDocuments()); setError(null) }
    catch (e) { setError((e as Error).message) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { refresh() }, [refresh])

  // Enquanto algum documento estiver sendo processado, atualiza o status periodicamente.
  const processing = docs.some(d => d.status === 'processando')
  useEffect(() => {
    if (!processing) return
    const t = setInterval(refresh, 1500)
    return () => clearInterval(t)
  }, [processing, refresh])

  const upload = useCallback(async (files: File[]) => {
    for (const f of files) {
      try { await uploadDocument(f, params) }
      catch (e) { setError(`${f.name}: ${(e as Error).message}`) }
    }
    await refresh()
  }, [params, refresh])

  const remove = useCallback(async (id: string) => {
    try { await removeDocument(id); setDocs(d => d.filter(x => x.id !== id)) }
    catch (e) { setError((e as Error).message) }
  }, [])

  return { docs, loading, error, dismissError: () => setError(null), retry: refresh, params, setParams, upload, remove }
}
