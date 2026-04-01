@echo off
echo ========================================
echo Starting SkillBridge AI Application
echo ========================================
echo.

REM Start Backend
echo [1/2] Starting Backend Server...
start "SkillBridge Backend" cmd /k "cd backend && python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000"
timeout /t 3 /nobreak >nul

REM Start Frontend
echo [2/2] Starting Frontend Server...
start "SkillBridge Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo ========================================
echo Application is starting!
echo Backend: http://localhost:8000
echo Frontend: http://localhost:5173
echo ========================================
echo.
echo Press any key to exit this window...
pause >nul
