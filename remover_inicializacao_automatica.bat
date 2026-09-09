@echo off
setlocal

set "STARTUP_FOLDER=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup"
set "SHORTCUT=%STARTUP_FOLDER%\Planner_de_Equipe.lnk"

if exist "%SHORTCUT%" (
    del "%SHORTCUT%"
    echo.
    echo ============================================================
    echo  Inicializacao automatica desativada com sucesso.
    echo ============================================================
) else (
    echo.
    echo A inicializacao automatica nao estava ativada.
)
echo.
pause
