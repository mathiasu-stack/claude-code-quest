@echo off
REM Double-click this file to play Claude Code Quest offline.
REM
REM Starts the local game server on this computer only (nothing leaves
REM your machine) and opens it in your default browser. Your progress is
REM saved in that browser via localStorage, tied to this launcher's port -
REM always start the game from this file so your save is where you left it.

title Claude Code Quest - Offline
cd /d "%~dp0"
set "PORT=8899"

REM ---------------------------------------------------------------- unzipped?
REM Windows lets you double-click a .bat straight out of a zip via Explorer's
REM built-in zip viewer. It extracts only that one file to a temp folder, so
REM the game is not next to it and the server cannot start.
if not exist "save_server.py" (
  echo.
  echo   Claude Code Quest can't find its game files.
  echo.
  echo   This usually means the launcher is being run from INSIDE the zip.
  echo   Right-click the downloaded zip, choose "Extract All...", open the
  echo   folder it creates, and double-click this launcher in there.
  echo.
  echo   Current folder: %CD%
  echo.
  pause
  exit /b 1
)

REM ------------------------------------------------------------------ python?
REM Each candidate is actually RUN, not just located: Windows ships a
REM Microsoft Store stub at python.exe that resolves fine and then opens the
REM Store instead of starting Python, so a `where python` check passes while
REM the server never comes up.
set "PYCMD="

py -3 -c "import sys" >nul 2>nul
if %errorlevel% equ 0 (
  set "PYCMD=py -3"
  goto :gotserver
)

python -c "import sys" >nul 2>nul
if %errorlevel% equ 0 (
  set "PYCMD=python"
  goto :gotserver
)

python3 -c "import sys" >nul 2>nul
if %errorlevel% equ 0 (
  set "PYCMD=python3"
  goto :gotserver
)

REM No Python: fall back to the bundled PowerShell server, which every
REM Windows has out of the box. Read-only (no room editor, no cloud
REM narration) but it serves the whole game.
if not exist "offline_server.ps1" goto :noserver
where powershell >nul 2>nul
if errorlevel 1 goto :noserver
echo.
echo   Python isn't installed - using the built-in Windows server instead.
goto :gotserver

:noserver
echo.
echo   Claude Code Quest couldn't start a game server on this computer.
echo.
echo   It needs either Python 3 (https://www.python.org/downloads/ - tick
echo   "Add python.exe to PATH" during setup) or Windows PowerShell, which
echo   is normally built in. Installing Python will fix this.
echo.
pause
exit /b 1

:gotserver

REM ---------------------------------------------------------------- port free?
REM Catch a copy that's already running before starting a second server, so
REM the duplicate can't bind-fail while the older instance keeps answering.
where powershell >nul 2>nul
if errorlevel 1 goto :portchecked
powershell -NoProfile -Command "try{$c=New-Object Net.Sockets.TcpClient;$c.Connect('127.0.0.1',%PORT%);$c.Close();exit 1}catch{exit 0}" >nul 2>nul
if %errorlevel% equ 0 goto :portchecked
echo.
echo   Claude Code Quest is already running in another window on port %PORT%.
echo.
echo   Switch to that window (and its browser tab) instead of this one - your
echo   progress lives there. Close it first if you'd rather start fresh here.
echo.
pause
exit /b 1

:portchecked

REM ------------------------------------------------------------------ browser
REM Wait for the port to actually accept connections before opening the
REM browser, so the first page load can't beat the server to it.
where powershell >nul 2>nul
if errorlevel 1 goto :simpleopen
start "" /min powershell -NoProfile -Command "for($i=0;$i -lt 60;$i++){try{$c=New-Object Net.Sockets.TcpClient;$c.Connect('127.0.0.1',%PORT%);$c.Close();Start-Process 'http://localhost:%PORT%/';break}catch{Start-Sleep -Seconds 1}}"
goto :runserver

:simpleopen
start "" cmd /c "timeout /t 3 /nobreak >nul & start http://localhost:%PORT%/"

:runserver
echo.
echo   Starting Claude Code Quest...
echo   If your browser doesn't open by itself, go to:  http://localhost:%PORT%/
echo.
echo   Keep this window open while you play. Close it when you're done.
echo.
if defined PYCMD (
  %PYCMD% save_server.py %PORT% 127.0.0.1
) else (
  powershell -NoProfile -ExecutionPolicy Bypass -File "offline_server.ps1" -Port %PORT%
)

REM Reached when the server stops - including when it fails to start. Hold the
REM window open so the reason above stays readable instead of flashing past.
echo.
echo   The game server has stopped.
echo   (If it stopped immediately, the message above says why. "Address already
echo    in use" means a copy is already running - check your other windows.)
echo.
pause
