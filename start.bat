@echo off
title Smart Monitor - Demarrage
color 0A

echo ============================================
echo   Smart Environmental Monitoring Platform
echo ============================================
echo.

REM --- Verifier que Docker est lance ---
docker info >nul 2>&1
if errorlevel 1 (
    echo [ERREUR] Docker n'est pas lance. Demarrez Docker Desktop et relancez.
    pause
    exit /b 1
)

echo [1/2] Demarrage de PostgreSQL + Backend + Frontend via Docker...
docker-compose up -d --build
if errorlevel 1 (
    echo [ERREUR] Echec du demarrage Docker.
    pause
    exit /b 1
)

echo.
echo [2/2] Attente que le backend soit pret (30 secondes max)...
set /a count=0
:wait_loop
timeout /t 2 /nobreak >nul
curl -s http://localhost:8000/api/health >nul 2>&1
if not errorlevel 1 goto backend_ready
set /a count+=1
if %count% geq 15 (
    echo [AVERTISSEMENT] Backend lent au demarrage - continuons quand meme...
    goto backend_ready
)
echo   Attente... (%count%/15)
goto wait_loop

:backend_ready
echo [OK] Backend pret sur http://localhost:8000

echo.
echo ============================================
echo   Application disponible sur :
echo   http://localhost:3000
echo.
echo   Frontend, backend et base de donnees tournent dans Docker
echo   Pour arreter : docker-compose down
echo ============================================
echo.
