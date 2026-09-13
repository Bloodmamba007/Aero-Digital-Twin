@echo off
title DRDO MALE UAV Aero Piston Engine Digital Twin Launcher
echo =========================================================================
echo    AI-ENABLED REAL-TIME DIGITAL TWIN SYSTEM FOR AERO PISTON ENGINES
echo               MALE UAV PROPULSION HEALTH MONITORING SYSTEM
echo            DRDO / Department of Defence Production (IDEX)
echo =========================================================================
echo.

cd /d "%~dp0"

echo [1/2] Launching Python FastAPI Backend Server on port 8000...
start "DRDO Digital Twin Backend (FastAPI)" cmd /k "cd /d "%~dp0backend" && python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload"

timeout /t 2 /nobreak >nul

echo [2/2] Launching React Vite GCS Tactical Frontend on port 5173...
start "DRDO Digital Twin Frontend (Vite)" cmd /k "cd /d "%~dp0frontend" && npm run dev"

echo.
echo =========================================================================
echo  Digital Twin System online!
echo  Tactical GCS Cockpit UI : http://localhost:5173
echo  FastAPI REST API Docs   : http://localhost:8000/docs
echo  WebSocket Telemetry Hub : ws://localhost:8000/ws/telemetry
echo =========================================================================
echo.
pause
