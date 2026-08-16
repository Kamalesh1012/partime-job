@echo off
title WorkMate Chennai - Dev Server Launcher
echo ===================================================
echo   Starting WorkMate Chennai Backend and Frontend
echo ===================================================

echo Starting Backend API on http://127.0.0.1:8001 ...
start "WorkMate Backend (FastAPI)" cmd /k "cd /d C:\Users\KAMALESH\Desktop\job portal\backend && python -m uvicorn main:app --host 127.0.0.1 --port 8001 --reload"

timeout /t 3 /nobreak >nul

echo Starting Frontend Web App on http://127.0.0.1:5173 ...
start "WorkMate Frontend (React/Vite)" cmd /k "cd /d C:\Users\KAMALESH\Desktop\job portal\frontend && npm run dev"

echo.
echo ===================================================
echo   Both servers launched successfully!
echo   Frontend: http://127.0.0.1:5173
echo   Backend:  http://127.0.0.1:8001
echo   API Docs: http://127.0.0.1:8001/docs
echo ===================================================
timeout /t 5
