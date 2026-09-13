# DRDO / IDEX MALE UAV Aero Piston Engine Digital Twin PowerShell Launcher
Write-Host "=========================================================================" -ForegroundColor Cyan
Write-Host "   AI-ENABLED REAL-TIME DIGITAL TWIN SYSTEM FOR AERO PISTON ENGINES" -ForegroundColor Yellow
Write-Host "              MALE UAV PROPULSION HEALTH MONITORING SYSTEM" -ForegroundColor Yellow
Write-Host "           DRDO / Department of Defence Production (IDEX)" -ForegroundColor White
Write-Host "=========================================================================" -ForegroundColor Cyan

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host "`n[1/2] Starting Python FastAPI Backend on http://127.0.0.1:8000..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$scriptDir\backend'; python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload"

Start-Sleep -Seconds 2

Write-Host "[2/2] Starting React Vite Frontend on http://localhost:5173..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$scriptDir\frontend'; npm run dev"

Write-Host "`n=========================================================================" -ForegroundColor Cyan
Write-Host " Digital Twin System online!" -ForegroundColor Green
Write-Host " Tactical GCS UI       : http://localhost:5173" -ForegroundColor White
Write-Host " Backend API Docs      : http://localhost:8000/docs" -ForegroundColor White
Write-Host " WebSocket Telemetry   : ws://localhost:8000/ws/telemetry" -ForegroundColor White
Write-Host "=========================================================================" -ForegroundColor Cyan
