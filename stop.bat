@echo off
title Smart Monitor - Arret
color 0C

echo Arret des conteneurs Docker...
docker-compose down
echo [OK] PostgreSQL et Backend arretes.
echo.
echo Le frontend (fenetre npm) doit etre ferme manuellement avec Ctrl+C
pause
