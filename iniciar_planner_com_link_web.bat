@echo off
setlocal enabledelayedexpansion
title Planner de Equipe - Link Web Global

cd /d "%~dp0"

echo ============================================================
echo      PLANNER DE EQUIPE - INICIANDO LINK WEB GLOBAL
echo ============================================================
echo.

:: Verificar Node.js
set "NODE_CMD=node"
where node >nul 2>&1
if %errorlevel% neq 0 (
    if exist "C:\Program Files\nodejs\node.exe" (
        set "NODE_CMD=C:\Program Files\nodejs\node.exe"
    ) else if exist "C:\Program Files (x86)\nodejs\node.exe" (
        set "NODE_CMD=C:\Program Files (x86)\nodejs\node.exe"
    ) else if exist "%LOCALAPPDATA%\Programs\nodejs\node.exe" (
        set "NODE_CMD=%LOCALAPPDATA%\Programs\nodejs\node.exe"
    ) else (
        echo [ERRO] Node.js nao encontrado.
        pause
        exit /b 1
    )
)

:: 1. Iniciar o servidor local em segundo plano
echo [1/2] Iniciando servidor do Planner...
start "Servidor Planner" /min "%NODE_CMD%" server/index.js

:: Aguardar 2 segundos para o servidor subir
timeout /t 2 /nobreak >nul

:: 2. Iniciar o Tunel Seguro Cloudflare
echo [2/2] Gerando link web seguro para os seus colegas...
echo.

if exist "tunnel.log" del "tunnel.log"

start "Tunel Web" /min "%~dp0cloudflared.exe" tunnel --url http://localhost:3000 --logfile "%~dp0tunnel.log"

:: Aguardar e extrair o link gerado
set "TUNNEL_URL="
for /l %%i in (1,1,15) do (
    if not defined TUNNEL_URL (
        timeout /t 1 /nobreak >nul
        if exist "tunnel.log" (
            for /f "tokens=*" %%a in ('findstr /i "trycloudflare.com" "%~dp0tunnel.log"') do (
                for %%b in (%%a) do (
                    echo %%b | findstr /i "https://.*\.trycloudflare\.com" >nul
                    if !errorlevel! equ 0 (
                        set "TUNNEL_URL=%%b"
                    )
                )
            )
        )
    )
)

:: Abrir navegador no host
start http://localhost:3000

cls
echo ============================================================
echo      🚀 PLANNER DE EQUIPE - ONLINE E SINCRONIZADO!
echo ============================================================
echo.
echo 📌  No SEU Computador:
echo     👉 http://localhost:3000
echo.

if defined TUNNEL_URL (
    :: Copiar o link automaticamente para a Area de Transferencia (Ctrl+V)
    echo !TUNNEL_URL! | clip
    echo 👥  LINK PARA OS SEUS COLEGAS (Funciona em QUALQUER computador ou celular):
    echo     👉 !TUNNEL_URL!
    echo.
    echo 📋  [O link ja foi COPIADO para sua area de transferencia!]
    echo     Basta dar Ctrl+V no WhatsApp, Teams ou Slack da equipe.
) else (
    echo 👥  Para os colegas na mesma rede:
    echo     👉 http://139.82.123.184:3000
    echo.
    echo (Dica: Caso o link local nao funcione, execute o arquivo:
    echo  "liberar_no_firewall_do_windows.bat" nesta pasta).
)

echo.
echo ============================================================
echo  Mantenha esta janela aberta enquanto a equipe estiver usando.
echo ============================================================
echo.

pause
