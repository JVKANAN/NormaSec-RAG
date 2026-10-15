@echo off
rem Inicia o Assistente de Documentos acessivel na rede interna (porta 8000).
rem Usa o .env desta pasta (OPENAI_API_KEY). Para recompilar o frontend: cd frontend ^&^& npm run build
cd /d "%~dp0backend"
python -m pip install -q -r requirements.txt
python main.py
pause
