@echo off
setlocal
cd /d "%~dp0"

set "STARTUP_FOLDER=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup"
set "SHORTCUT=%STARTUP_FOLDER%\Planner_de_Equipe.lnk"
set "TARGET=%~dp0iniciar_planner.bat"
set "SCRIPT=%TEMP%\setup_startup.vbs"

echo Configurando o Planner para iniciar automaticamente com o Windows...

echo Set oWS = WScript.CreateObject("WScript.Shell") > "%SCRIPT%"
echo sLinkFile = "%SHORTCUT%" >> "%SCRIPT%"
echo Set oLink = oWS.CreateShortcut(sLinkFile) >> "%SCRIPT%"
echo oLink.TargetPath = "%TARGET%" >> "%SCRIPT%"
echo oLink.WorkingDirectory = "%~dp0" >> "%SCRIPT%"
echo oLink.Description = "Inicializacao automatica do Planner de Equipe" >> "%SCRIPT%"
echo oLink.Save >> "%SCRIPT%"

cscript /nologo "%SCRIPT%"
del "%SCRIPT%"

echo.
echo ============================================================
echo  Sucesso! O Planner de Equipe agora iniciara automaticamente
echo  sempre que voce ligar ou reiniciar este computador.
echo ============================================================
echo.
pause
