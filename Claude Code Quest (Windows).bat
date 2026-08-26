@echo off
REM Double-click this file to play Claude Code Quest offline.
REM
REM Starts the local game server on this computer only (nothing leaves
REM your machine) and opens it in your default browser. Your progress is
REM saved in that browser via localStorage, tied to this launcher's port -
REM always start the game from this file so your save is where you left it.

title Claude Code Quest - Offline
set "PORT=8899"

REM ---------------------------------------------------------------- unzipped?
REM The game itself lives in the claude-code-quest subfolder, so this launcher
REM can sit alone at the top level. Windows also lets you double-click a .bat
REM straight out of a zip via Explorer's built-in zip viewer, which extracts
REM only that one file to a temp folder - the subfolder won't be there either.
cd /d "%~dp0claude-code-quest" 2>nul
if errorlevel 1 goto :nogame
if not exist "save_server.py" goto :nogame
goto :havegame

:nogame
echo.
echo   Claude Code Quest can't find its game files.
echo.
echo   This launcher needs to sit next to the "claude-code-quest" folder
echo   that came with it. If you double-clicked it from inside the zip,
echo   right-click the downloaded zip instead, choose "Extract All...",
echo   open the folder it creates, and run the launcher in there.
echo.
echo   Launcher folder: %~dp0
echo.
pause
exit /b 1

:havegame

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
