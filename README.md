# NormaSec · Assistente de Documentos (Busca Semântica / RAG)

Assistente que responde perguntas com base em documentos (PDF, TXT e MD), usando RAG: os documentos são divididos em trechos, indexados com embeddings da OpenAI, e os trechos mais relevantes são enviados ao modelo para gerar a resposta com evidências. Quando não há evidência suficiente, o assistente informa isso em vez de inventar uma resposta.

A interface (chamada **NormaSec**) segue o design da pasta `exemplo de frontend/`.

## Funcionalidades

- **Assistente:** tela inicial com perguntas sugeridas e conversa com respostas que citam as fontes por número.
- **Painel de Evidências:** mostra, ao lado da resposta, o trecho original (documento e página) que sustenta cada citação.
- **Evidência insuficiente:** quando a base não sustenta a pergunta, o NormaSec avisa e sugere reformulações.
- **Escopo da consulta:** o seletor "Todos os documentos" restringe a busca a documentos específicos.
- **Conversas recentes:** ficam em memória e somem ao recarregar a página.
- **Base de documentos:** catálogo com busca, filtros por estado e categoria, ordenação, paginação, upload e remoção.
- **Como funciona:** botão no topo com uma explicação curta do fluxo.

A categoria de cada documento (Normas técnicas, Legislação ou Boas práticas) é deduzida pelo nome do arquivo, porque o backend não guarda esse dado.

## Estrutura

```
.
├── backend/                  API FastAPI + servidor do frontend
│   ├── main.py               rotas, upload e inicialização
│   ├── rag.py                extração, chunking, embeddings, busca e resposta
│   └── requirements.txt
├── frontend/                 React + Vite + Tailwind
│   ├── src/
│   │   ├── components/       Sidebar, HomeView, ConversationView, EvidencePanel, DocumentsView...
│   │   ├── hooks/            useChat (conversas) e useDocuments
│   │   ├── services/         chamadas à API
│   │   └── lib/docs.ts       categorias, sugestões e utilitários
│   └── dist/                 build compilado, servido pelo backend
├── base de conhecimento/     documentos indexados ao iniciar (LGPD, OWASP e outros que você adicionar)
├── exemplo de frontend/      PDFs de referência visual da interface
├── uploads/                  arquivos enviados pela interface (criado automaticamente)
├── .cache/                   cache dos índices (criado automaticamente)
├── .env                      variáveis de ambiente (não versionar)
└── busca-semantica-rag-simples.py   versão antiga e simples, em Streamlit
```

## Pré-requisitos

- Python 3.11+
- Node.js 22+ (somente se for alterar o frontend)
- Uma chave de API da OpenAI

## Base de conhecimento e normas ABNT

As normas **ABNT NBR ISO/IEC 27001 e 27002** são obras pagas e **não fazem parte deste repositório** (estão no `.gitignore`). Para usá-las, coloque a sua cópia licenciada em `base de conhecimento/` com nome iniciado em `NBR` (por exemplo `NBR_ISO_IEC_27002_2022.pdf`). Elas são indexadas ao iniciar o servidor, mas nunca vão para o Git. Sem elas, o sistema funciona normalmente com os demais documentos.

## Configuração

Depois de clonar o repositório, copie o modelo e preencha a sua chave (o `.env` nunca vai para o Git):

```powershell
copy .env.example .env
```

Conteúdo do `.env`:

```env
OPENAI_API_KEY=sua-chave-aqui

# Opcionais (valores padrão)
# EMBED_MODEL=text-embedding-3-small
# CHAT_MODEL=gpt-4o-mini
# MIN_SCORE=0.30
```

| Variável         | Descrição                                                              | Padrão                   |
|------------------|------------------------------------------------------------------------|--------------------------|
| `OPENAI_API_KEY` | Chave da API da OpenAI (obrigatória)                                   | n/d                      |
| `EMBED_MODEL`    | Modelo de embeddings                                                   | `text-embedding-3-small` |
| `CHAT_MODEL`     | Modelo usado para gerar as respostas                                   | `gpt-4o-mini`            |
| `MIN_SCORE`      | Similaridade mínima para considerar um trecho relevante                | `0.30`                   |

## Como executar

No PowerShell, na raiz do projeto:

```powershell
# 1. Criar e ativar o ambiente virtual (uma vez)
python -m venv .venv
.\.venv\Scripts\Activate.ps1

# 2. Instalar as dependências (uma vez)
pip install -r backend\requirements.txt

# 3. Iniciar o servidor
python backend\main.py
```

Acesse **http://localhost:8000**. Como atalho no Windows, o `iniciar.bat` instala as dependências e sobe o servidor. O terminal também exibe o endereço para acesso pela rede interna, pois o servidor escuta em `0.0.0.0:8000`.

Ao iniciar, os documentos de `base de conhecimento/` (e de `uploads/`) são indexados em segundo plano. Na primeira execução isso pode levar alguns instantes.

## Desenvolvimento do frontend

O backend serve o build em `frontend/dist`. Só é necessário mexer aqui ao editar `frontend/src`:

```powershell
cd frontend
npm install
npm run dev       # desenvolvimento com hot reload (Vite)
npm run build     # recompila o frontend/dist servido pelo backend
```

No modo `dev` o frontend roda em `http://localhost:5173` e encaminha `/api` para o backend em `localhost:8000`, que precisa estar rodando em paralelo.

Depois de alterar o frontend, rode `npm run build` e recarregue a página com **Ctrl+F5** para limpar o cache.

## API

| Método   | Rota                      | Descrição                                     |
|----------|---------------------------|-----------------------------------------------|
| `GET`    | `/api/documents`          | Lista os documentos e o status da indexação   |
| `POST`   | `/api/documents`          | Envia um documento (PDF, TXT ou MD, até 25 MB)|
| `DELETE` | `/api/documents/{doc_id}` | Remove um documento enviado                   |
| `POST`   | `/api/search`             | Busca semântica de trechos relevantes. Aceita `question`, `top_k` e `doc_ids` (opcional, restringe a busca a esses documentos) |
| `POST`   | `/api/answer`             | Gera a resposta com base nos trechos          |

Parâmetros padrão de indexação: trechos de 1000 caracteres, sobreposição de 150 e 5 trechos retornados por busca.

## Versão simples (Streamlit)

O arquivo `busca-semantica-rag-simples.py` é um protótipo: cole um texto, faça uma pergunta e receba a resposta. Ele usa `sentence-transformers` para os embeddings.

```powershell
pip install streamlit sentence-transformers scikit-learn openai python-dotenv numpy
streamlit run busca-semantica-rag-simples.py
```

## Segurança

- Não versione o `.env`, que contém a chave da OpenAI.
- O servidor fica exposto na rede interna (`0.0.0.0`) e não tem autenticação. Use apenas em rede confiável.
