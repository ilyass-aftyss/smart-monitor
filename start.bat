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

REM --- Verifier que Node.js est installe ---
node --version >nul 2>&1
if errorlevel 1 (
    echo [ERREUR] Node.js n'est pas installe.
    echo Telechargez-le sur https://nodejs.org  (version 18 ou superieure)
    pause
    exit /b 1
)

echo [1/3] Demarrage de PostgreSQL + Backend via Docker...
docker-compose up -d --build
if errorlevel 1 (
    echo [ERREUR] Echec du demarrage Docker.
    pause
    exit /b 1
)

echo.
echo [2/3] Attente que le backend soit pret (30 secondes max)...
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
echo [3/3] Demarrage du frontend React...
cd frontend

if not exist node_modules (
    echo   Installation des dependances npm (premiere fois uniquement)...
    npm install
    if errorlevel 1 (
        echo [ERREUR] npm install a echoue. Verifiez votre connexion internet.
        cd ..
        pause
        exit /b 1
    )
)

echo.
echo ============================================
echo   Application disponible sur :
echo   http://localhost:5173
echo.
echo   Identifiants :  admin / admin
echo   Ctrl+C pour arreter le frontend
echo ============================================
echo.

npm run dev
