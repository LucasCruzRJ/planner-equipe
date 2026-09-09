@echo off
setlocal enabledelayedexpansion
title Planner de Equipe - Servidor em Tempo Real

:: Garantir que o diretorio de execucao seja a pasta do script
cd /d "%~dp0"

echo ============================================================
echo      PLANNER DE EQUIPE - SERVIDOR EM TEMPO REAL
echo ============================================================
echo.

:: Verificar Node.js no PATH ou no caminho padrao
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
        echo [ERRO] Node.js nao foi encontrado no sistema.
        echo Baixe e instale o Node.js em: https://nodejs.org
        echo.
        pause
        exit /b 1
    )
)

:: Abrir navegador automaticamente
start http://localhost:3000

:: Iniciar servidor
echo Iniciando servidor e sincronizacao da equipe...
echo.
"%NODE_CMD%" server/index.js

if %errorlevel% neq 0 (
    echo.
    echo O servidor foi encerrado com codigo de erro %errorlevel%.
    pause
)
