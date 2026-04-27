@echo off
cd /d "%~dp0..\backend"
uvicorn app.main:app --reload --port 8001
