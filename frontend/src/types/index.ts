export type DocumentItem = {
  id: string
  name: string
  type: 'pdf' | 'docx' | 'txt' | 'md'
  chunks: number
  status: 'processando' | 'pronto' | 'erro'
  error?: string
}

export type Source = {
  id: string
  documentName: string
  location: string
  score: number
  text: string
}

export type AssistantAnswer = {
  answer: string // contém marcadores [n]
  sources: Source[]
  insufficientContext: boolean
}

export type Params = { chunkSize: number; overlap: number; topK: number }

export type Message =
  | { id: string; role: 'user'; text: string; at: number }
  | { id: string; role: 'assistant'; answer?: AssistantAnswer; error?: string; question: string; docIds?: string[]; at: number }

export type Conversation = { id: string; title: string; createdAt: number; messages: Message[] }
