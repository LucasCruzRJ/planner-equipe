@echo off
setlocal
cd /d "%~dp0"

echo Criando atalho do Planner de Equipe na sua Area de Trabalho...

set "SCRIPT=%TEMP%\criar_atalho.vbs"
set "TARGET=%~dp0iniciar_planner.bat"
set "SHORTCUT=%USERPROFILE%\Desktop\Planner de Equipe.lnk"

echo Set oWS = WScript.CreateObject("WScript.Shell") > "%SCRIPT%"
echo sLinkFile = "%SHORTCUT%" >> "%SCRIPT%"
echo Set oLink = oWS.CreateShortcut(sLinkFile) >> "%SCRIPT%"
echo oLink.TargetPath = "%TARGET%" >> "%SCRIPT%"
echo oLink.WorkingDirectory = "%~dp0" >> "%SCRIPT%"
echo oLink.Description = "Iniciar Planner de Equipe em Tempo Real" >> "%SCRIPT%"
echo oLink.Save >> "%SCRIPT%"

cscript /nologo "%SCRIPT%"
del "%SCRIPT%"

echo.
echo ============================================================
echo  Pronto! O atalho "Planner de Equipe" foi criado na sua
echo  Area de Trabalho com sucesso!
echo ============================================================
echo.
pause
