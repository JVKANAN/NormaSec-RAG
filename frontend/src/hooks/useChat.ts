import { useCallback, useState } from 'react'
import type { Conversation, Message } from '../types'
import { generateAnswer, searchChunks } from '../services/assistant'

export type Stage = 'buscando' | 'gerando' | null

/** Conversas da sessão (ficam em memória) e a execução de perguntas na conversa ativa. */
export function useChat(topK: number) {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [stage, setStage] = useState<Stage>(null)

  const active = conversations.find(c => c.id === activeId) ?? null

  const run = useCallback(async (question: string, docIds: string[], convId?: string, replaceId?: string) => {
    let cid = convId
    if (!cid) {
      cid = crypto.randomUUID()
      const first: Conversation = { id: cid, title: question, createdAt: Date.now(), messages: [] }
      setConversations(cs => [first, ...cs])
      setActiveId(cid)
    }
    const target = cid
    const patch = (fn: (m: Message[]) => Message[]) =>
      setConversations(cs => cs.map(c => c.id === target ? { ...c, messages: fn(c.messages) } : c))

    const id = replaceId ?? crypto.randomUUID()
    if (!replaceId) patch(m => [...m, { id: crypto.randomUUID(), role: 'user', text: question, at: Date.now() }])
    const put = (msg: Message) => patch(m => replaceId ? m.map(x => x.id === replaceId ? msg : x) : [...m, msg])
    try {
      setStage('buscando')
      const hits = await searchChunks(question, topK, docIds)
      setStage('gerando')
      const answer = await generateAnswer(question, hits)
      put({ id, role: 'assistant', answer, question, docIds, at: Date.now() })
    } catch (e) {
      put({ id, role: 'assistant', error: (e as Error).message, question, docIds, at: Date.now() })
    } finally { setStage(null) }
  }, [topK])

  const ask = useCallback((q: string, docIds: string[]) => run(q, docIds, activeId ?? undefined), [run, activeId])
  const retry = useCallback((msgId: string, q: string, docIds: string[]) => run(q, docIds, activeId ?? undefined, msgId), [run, activeId])
  const newChat = useCallback(() => setActiveId(null), [])
  const open = useCallback((id: string) => setActiveId(id), [])

  return { conversations, active, stage, ask, retry, newChat, open }
}
