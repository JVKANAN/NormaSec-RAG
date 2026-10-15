import type { DocumentItem, Params } from '../types'
import { http } from './http'

export const listDocuments = () => http<DocumentItem[]>('/api/documents')

export function uploadDocument(file: File, p: Params): Promise<DocumentItem> {
  const body = new FormData()
  body.append('file', file)
  return http(`/api/documents?chunk_size=${p.chunkSize}&overlap=${p.overlap}`, { method: 'POST', body })
}

export const removeDocument = (id: string) => http<{ ok: boolean }>(`/api/documents/${id}`, { method: 'DELETE' })
