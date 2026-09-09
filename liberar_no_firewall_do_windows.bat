@echo off
setlocal
title Liberar Porta 3000 no Firewall do Windows

echo ============================================================
echo   LIBERANDO ACESSO AO PLANNER NO FIREWALL DO WINDOWS
echo ============================================================
echo.

:: Verificar privilegios de Administrador
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo Solicitando permissao de Administrador...
    powershell -Command "Start-Process cmd -ArgumentList '/c \"\"%~f0\"\"' -Verb RunAs"
    exit /b
)

echo Adicionando regra de permissao para a Porta 3000 (TCP)...
netsh advfirewall firewall delete rule name="Planner de Equipe (Porta 3000)" >nul 2>&1
netsh advfirewall firewall add rule name="Planner de Equipe (Porta 3000)" dir=in action=allow protocol=TCP localport=3000 profile=any >nul

if %errorlevel% equ 0 (
    echo.
    echo ============================================================
    echo  SUCESSO! A porta 3000 foi liberada no Firewall do Windows.
    echo  Agora os computadores da mesma rede conseguirao acessar.
    echo ============================================================
) else (
    echo.
    echo [AVISO] Nao foi possivel adicionar a regra automaticamente.
)

echo.
pause
