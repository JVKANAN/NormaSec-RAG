import type { AssistantAnswer } from '../types'
import { http } from './http'

export type Hit = { chunkId: string; score: number }
const json = (body: unknown): RequestInit => ({
  method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
})

/** Etapa 1: busca vetorial (similaridade de cosseno), opcionalmente restrita a alguns documentos */
export const searchChunks = (question: string, topK: number, docIds: string[] = []) =>
  http<Hit[]>('/api/search', json({ question, top_k: topK, doc_ids: docIds.length ? docIds : null }))

/** Etapa 2: geração da resposta com base apenas nos trechos recuperados */
export const generateAnswer = (question: string, hits: Hit[]) =>
  http<AssistantAnswer>('/api/answer', json({
    question, chunk_ids: hits.map(h => h.chunkId), scores: hits.map(h => h.score),
  }))
