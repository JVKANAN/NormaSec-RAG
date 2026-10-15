"""API + servidor do frontend. Roda em 0.0.0.0 para ficar acessível na rede interna."""
import re
import socket
import threading
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

ROOT = Path(__file__).resolve().parent.parent
load_dotenv(ROOT / ".env")  # usa o .env interno do projeto

from rag import DEFAULT_CHUNK, DEFAULT_OVERLAP, DEFAULT_TOP_K, RagIndex  # noqa: E402

KB_DIR = ROOT / "base de conhecimento"
UPLOAD_DIR = ROOT / "uploads"
DIST = ROOT / "frontend" / "dist"
# PDFs de referência de interface que estão na pasta mas não são conteúdo da base.
IGNORED = {"Base de documentos.pdf", "Conversa com evidncias.pdf",
           "Conversa sem evidncia suficiente.pdf", "Incio do assistente.pdf"}
ALLOWED = {".pdf", ".txt", ".md"}
MAX_UPLOAD = 25 * 1024 * 1024

app = FastAPI(title="Assistente de Documentos", docs_url=None, redoc_url=None)
index = RagIndex(ROOT / ".cache")
UPLOAD_DIR.mkdir(exist_ok=True)


def _bootstrap() -> None:
    for folder in (KB_DIR, UPLOAD_DIR):
        if not folder.exists():
            continue
        for p in sorted(folder.iterdir()):
            if p.suffix.lower() in ALLOWED and p.name not in IGNORED:
                doc = index.register(p)
                threading.Thread(target=index.index, args=(doc, p), daemon=True).start()


@app.on_event("startup")
def startup() -> None:
    _bootstrap()


def _doc_json(d) -> dict:
    return {"id": d.id, "name": d.name, "type": d.type, "chunks": len(d.chunks),
            "status": d.status, "error": d.error}


@app.get("/api/documents")
def list_documents():
    return [_doc_json(d) for d in index.docs.values()]


@app.post("/api/documents")
async def upload_document(file: UploadFile = File(...), chunk_size: int = DEFAULT_CHUNK,
                          overlap: int = DEFAULT_OVERLAP):
    name = re.sub(r"[^\w.\- ()]", "_", Path(file.filename or "").name)
    if Path(name).suffix.lower() not in ALLOWED:
        raise HTTPException(400, "Formato não suportado. Use PDF, TXT ou MD.")
    if not 200 <= chunk_size <= 4000 or not 0 <= overlap < chunk_size // 2:
        raise HTTPException(400, "Parâmetros de trecho inválidos.")
    data = await file.read(MAX_UPLOAD + 1)
    if len(data) > MAX_UPLOAD:
        raise HTTPException(413, "Arquivo maior que 25 MB.")
    dest = UPLOAD_DIR / name
    dest.write_bytes(data)
    doc = index.register(dest)
    threading.Thread(target=index.index, args=(doc, dest, chunk_size, overlap), daemon=True).start()
    return _doc_json(doc)


@app.delete("/api/documents/{doc_id}")
def delete_document(doc_id: str):
    doc = index.docs.get(doc_id)
    if not doc or not index.remove(doc_id):
        raise HTTPException(404, "Documento não encontrado.")
    (UPLOAD_DIR / doc.name).unlink(missing_ok=True)  # só apaga cópias enviadas; a base original é preservada
    return {"ok": True}


class SearchReq(BaseModel):
    question: str = Field(min_length=1, max_length=1500)
    top_k: int = Field(DEFAULT_TOP_K, ge=1, le=10)
    doc_ids: list[str] | None = Field(None, max_length=100)


class AnswerReq(BaseModel):
    question: str = Field(min_length=1, max_length=1500)
    chunk_ids: list[str] = Field(max_length=10)
    scores: list[float] = Field(max_length=10)


@app.post("/api/search")
def search(req: SearchReq):
    try:
        hits = index.search(req.question.strip(), req.top_k, req.doc_ids)
    except Exception:
        raise HTTPException(502, "Falha ao buscar trechos. Tente novamente.")
    return [{"chunkId": c.id, "score": s} for c, s in hits]


@app.post("/api/answer")
def answer(req: AnswerReq):
    hits = [(index.chunk_by_id[i], s) for i, s in zip(req.chunk_ids, req.scores) if i in index.chunk_by_id]
    try:
        return index.answer(req.question.strip(), hits)
    except Exception:
        raise HTTPException(502, "Falha ao gerar a resposta. Tente novamente.")


# Frontend compilado (build do Vite), servido na mesma porta.
if DIST.exists():
    app.mount("/assets", StaticFiles(directory=DIST / "assets"), name="assets")

    @app.get("/{path:path}")
    def spa(path: str):
        f = (DIST / path).resolve()
        if path and f.is_file() and DIST.resolve() in f.parents:
            return FileResponse(f)
        return FileResponse(DIST / "index.html")


def lan_ip() -> str:
    try:
        with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as s:
            s.connect(("10.255.255.255", 1))
            return s.getsockname()[0]
    except OSError:
        return "127.0.0.1"


if __name__ == "__main__":
    import uvicorn
    port = 8000
    print(f"\n  Acesse na rede interna: http://{lan_ip()}:{port}\n")
    uvicorn.run(app, host="0.0.0.0", port=port)
