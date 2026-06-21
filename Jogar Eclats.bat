@echo off
chcp 65001 >nul
title Eclats of Lumiere - Servidor
cd /d "%~dp0"

echo ===============================================
echo   Eclats of Lumiere
echo   Iniciando o servidor do jogo...
echo ===============================================
echo.

REM Sobe o servidor numa janela propria (minimizada).
start "Eclats Server" /min cmd /c node ".claude/dev-server.js"

REM Espera o servidor subir e abre o jogo no navegador.
timeout /t 2 >nul
start "" "http://localhost:4321"

echo Jogo aberto no navegador: http://localhost:4321
echo.
echo Para PARAR o jogo, feche a janela minimizada "Eclats Server".
echo Pode fechar esta janela.
echo.
pause
