# semantic_search_rag.py
import os
import streamlit as st
import numpy as np
from dotenv import load_dotenv
from openai import OpenAI
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity

load_dotenv()
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
embed_model = SentenceTransformer('all-MiniLM-L6-v2')

st.title("📚 Busca Semântica em Documentos (RAG Simples)")
doc = st.text_area("Cole o conteúdo do documento:", "A política de devolução permite trocas em até 30 dias...")
query = st.text_input("Faça uma pergunta sobre o documento:")

if st.button("Buscar Resposta"):
    if not doc.strip() or not query.strip():
        st.warning("Preencha o documento e a pergunta.")
        st.stop()

    chunks = [c.strip() for c in doc.split(".") if len(c.strip()) > 10]
    if not chunks:
        st.error("Documento muito curto ou sem frases válidas.")
        st.stop()

    doc_embs = embed_model.encode(chunks)
    query_emb = embed_model.encode([query])
    sims = cosine_similarity(query_emb, doc_embs)[0]
    top_idx = np.argsort(sims)[-3:][::-1]

    st.subheader("📖 Trechos mais relevantes:")
    context = ""
    for i in top_idx:
        st.success(f"Trecho {i+1} (Similaridade: {sims[i]:.2f}): {chunks[i]}")
        context += f"- {chunks[i]}\n"

    with st.spinner("Gerando resposta com OpenAI..."):
        resp = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "Responda apenas com base nos trechos fornecidos. Cite a fonte."},
                {"role": "user", "content": f"Contexto:\n{context}\nPergunta: {query}"}
            ]
        )
        st.info("🤖 **Resposta:**\n" + resp.choices[0].message.content)