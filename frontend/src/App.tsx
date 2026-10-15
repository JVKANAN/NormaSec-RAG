import { useState } from 'react'
import { ConversationView } from './components/ConversationView'
import { DocumentsView } from './components/DocumentsView'
import { HomeView } from './components/HomeView'
import { PageHeader } from './components/PageHeader'
import { Sidebar, type View } from './components/Sidebar'
import { timeOf } from './lib/docs'
import { useChat } from './hooks/useChat'
import { useDocuments } from './hooks/useDocuments'

export default function App() {
  const documents = useDocuments()
  const chat = useChat(documents.params.topK)
  const [view, setView] = useState<View>('assistant')
  const [drawer, setDrawer] = useState(false)

  const ready = documents.docs.filter(d => d.status === 'pronto').length
  const inConversation = view === 'assistant' && chat.active

  const header = view === 'documents'
    ? { title: 'Base de documentos', subtitle: 'Catálogo de fontes do assistente' }
    : inConversation
      ? { title: chat.active!.title, subtitle: `Conversa de hoje · ${timeOf(chat.active!.createdAt)}` }
      : { title: 'Assistente', subtitle: 'Conhecimento interno, com fontes verificáveis' }

  const go = (v: View) => { setView(v); setDrawer(false) }

  return (
    <div className="flex h-screen overflow-hidden">
      <div className={`fixed inset-y-0 left-0 z-40 transition-transform duration-200 lg:static lg:translate-x-0 ${drawer ? 'translate-x-0' : '-translate-x-full'}`}>
        <Sidebar view={view} conversations={chat.conversations} activeId={chat.active?.id ?? null}
          onView={go} onNew={chat.newChat} onOpen={chat.open} />
      </div>
      {drawer && <div className="fixed inset-0 z-30 bg-black/20 lg:hidden" onClick={() => setDrawer(false)} aria-hidden />}

      <div className="flex min-w-0 flex-1 flex-col">
        <PageHeader title={header.title} subtitle={header.subtitle} badge={`${ready} ${ready === 1 ? 'documento indexado' : 'documentos indexados'}`} onMenu={() => setDrawer(true)} />
        <main className="flex min-h-0 flex-1 flex-col bg-surface">
          {view === 'documents' ? (
            <div className="flex-1 overflow-y-auto">
              <DocumentsView docs={documents.docs} loading={documents.loading} error={documents.error}
                params={documents.params} onParams={documents.setParams}
                onUpload={documents.upload} onRemove={documents.remove}
                onRefresh={documents.retry} onDismissError={documents.dismissError} />
            </div>
          ) : chat.active ? (
            <ConversationView conversation={chat.active} docs={documents.docs} stage={chat.stage}
              onAsk={chat.ask} onRetry={chat.retry} />
          ) : (
            <div className="flex-1 overflow-y-auto">
              <HomeView docs={documents.docs} loading={documents.loading} busy={chat.stage !== null}
                onAsk={chat.ask} onExplore={() => go('documents')} />
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
