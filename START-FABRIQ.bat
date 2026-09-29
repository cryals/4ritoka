@echo off
setlocal EnableExtensions EnableDelayedExpansion
title Fabriq launcher

set "ROOT=%~dp0"
if "%ROOT:~-1%"=="\" set "ROOT=%ROOT:~0,-1%"
set "TEMP_DIR=%ROOT%\.temp"
set "LAUNCH_LOG=%TEMP_DIR%\launcher.log"
set "WEB_DIR=%ROOT%\web"
set "DOCS_DIR=%ROOT%\docs"
set "VENV_PY=%ROOT%\.venv\Scripts\python.exe"

if not exist "%TEMP_DIR%" mkdir "%TEMP_DIR%"

if /I "%~1"=="stop" goto :stop_all
if /I "%~1"=="status" goto :status_only
if /I "%~1"=="logs" goto :open_logs
if not "%~1"=="" if /I not "%~1"=="start" goto :usage

echo.
echo ============================================================
echo   FABRIQ / CHECK, BUILD AND START
echo ============================================================
echo Project: %ROOT%
echo Logs:    %TEMP_DIR%
echo.

>>"%LAUNCH_LOG%" echo.
>>"%LAUNCH_LOG%" echo ============================================================
>>"%LAUNCH_LOG%" echo [%date% %time%] New Fabriq launch

call :detect_python
if errorlevel 1 goto :failed
call :detect_node
if errorlevel 1 goto :failed

echo.
echo [1/5] Python environment
if not exist "%VENV_PY%" (
  echo       Creating .venv...
  >>"%LAUNCH_LOG%" echo Creating .venv with %BOOTSTRAP_PY%
  %BOOTSTRAP_PY% -m venv "%ROOT%\.venv" >>"%LAUNCH_LOG%" 2>&1
  if errorlevel 1 (
    set "FAIL_MESSAGE=Could not create .venv. See %LAUNCH_LOG%"
    goto :failed
  )
) else (
  echo       .venv already exists
)

"%VENV_PY%" -c "import sys; raise SystemExit(0 if sys.version_info >= (3, 11) else 1)" >nul 2>&1
if errorlevel 1 (
  set "FAIL_MESSAGE=The existing .venv uses Python below 3.11. Delete .venv and run this file again."
  goto :failed
)

echo       Installing Python dependencies...
>>"%LAUNCH_LOG%" echo [%date% %time%] pip install -r requirements.txt
"%VENV_PY%" -m pip install --disable-pip-version-check -r "%ROOT%\requirements.txt" >>"%LAUNCH_LOG%" 2>&1
if errorlevel 1 (
  set "FAIL_MESSAGE=Python dependency installation failed. See %LAUNCH_LOG%"
  goto :failed
)
echo       [OK] Python dependencies installed

echo.
echo [2/5] Node.js dependencies
echo       Running npm ci...
>>"%LAUNCH_LOG%" echo [%date% %time%] npm ci
pushd "%WEB_DIR%"
call npm ci >>"%LAUNCH_LOG%" 2>&1
if errorlevel 1 (
  popd
  set "FAIL_MESSAGE=npm ci failed. See %LAUNCH_LOG%"
  goto :failed
)
popd
echo       [OK] Node.js dependencies installed

echo       Running npm ci for documentation...
>>"%LAUNCH_LOG%" echo [%date% %time%] docs npm ci
pushd "%DOCS_DIR%"
call npm ci >>"%LAUNCH_LOG%" 2>&1
if errorlevel 1 (
  popd
  set "FAIL_MESSAGE=Documentation npm ci failed. See %LAUNCH_LOG%"
  goto :failed
)
popd
echo       [OK] Documentation dependencies installed

echo.
echo [3/5] Source checks
echo       Checking Python modules...
>>"%LAUNCH_LOG%" echo [%date% %time%] Python compileall
"%VENV_PY%" -m compileall -q "%ROOT%\domain" "%ROOT%\scenario" "%ROOT%\engine" "%ROOT%\analytics" "%ROOT%\reporting" "%ROOT%\visualization" "%ROOT%\python_service" >>"%LAUNCH_LOG%" 2>&1
if errorlevel 1 (
  set "FAIL_MESSAGE=Python compile check failed. See %LAUNCH_LOG%"
  goto :failed
)

echo       Checking TypeScript...
>>"%LAUNCH_LOG%" echo [%date% %time%] npm run typecheck
pushd "%WEB_DIR%"
call npm run typecheck >>"%LAUNCH_LOG%" 2>&1
if errorlevel 1 (
  popd
  set "FAIL_MESSAGE=TypeScript typecheck failed. See %LAUNCH_LOG%"
  goto :failed
)
popd
echo       [OK] Source checks passed

echo.
echo [4/5] Next.js production build
>>"%LAUNCH_LOG%" echo [%date% %time%] npm run build
pushd "%WEB_DIR%"
call npm run build >>"%LAUNCH_LOG%" 2>&1
if errorlevel 1 (
  popd
  set "FAIL_MESSAGE=Next.js build failed. See %LAUNCH_LOG%"
  goto :failed
)
popd
echo       [OK] Web application built

echo       Building documentation...
>>"%LAUNCH_LOG%" echo [%date% %time%] docs npm run build
pushd "%DOCS_DIR%"
call npm run build >>"%LAUNCH_LOG%" 2>&1
if errorlevel 1 (
  popd
  set "FAIL_MESSAGE=Documentation build failed. See %LAUNCH_LOG%"
  goto :failed
)
popd
echo       [OK] Documentation built

echo.
echo [5/5] Starting services
call :cleanup_stale_pid "python-api"
call :cleanup_stale_pid "web"
call :cleanup_stale_pid "presentation"
call :cleanup_stale_pid "docs"

call :url_ok "http://127.0.0.1:8000/health"
if not errorlevel 1 (
  echo       [OK] Python API is already responding
) else (
  call :ensure_port_free 8000
  if errorlevel 1 goto :failed
  echo       Starting Python API...
  powershell -NoProfile -ExecutionPolicy Bypass -Command "$p = Start-Process -FilePath $env:FABRIQ_PYTHON_EXE -ArgumentList @('-m','uvicorn','python_service.main:app','--host','127.0.0.1','--port','8000') -WorkingDirectory $env:FABRIQ_ROOT -RedirectStandardOutput ($env:FABRIQ_TEMP + '\python-api.log') -RedirectStandardError ($env:FABRIQ_TEMP + '\python-api.error.log') -WindowStyle Hidden -PassThru; Set-Content -Encoding ascii -Path ($env:FABRIQ_TEMP + '\python-api.pid') -Value $p.Id"
  if errorlevel 1 (
    set "FAIL_MESSAGE=Could not start Python API."
    goto :failed
  )
  call :wait_url "http://127.0.0.1:8000/health" 30
  if errorlevel 1 (
    set "FAIL_MESSAGE=Python API did not respond in 30 seconds. See python-api.error.log"
    goto :failed
  )
  echo       [OK] Python API is ready
)

call :url_ok "http://127.0.0.1:3000"
if not errorlevel 1 (
  echo       [OK] Web application is already responding
) else (
  call :ensure_port_free 3000
  if errorlevel 1 goto :failed
  echo       Starting Next.js...
  powershell -NoProfile -ExecutionPolicy Bypass -Command "$p = Start-Process -FilePath $env:FABRIQ_NODE_EXE -ArgumentList @($env:FABRIQ_NEXT_BIN,'start','-H','127.0.0.1','-p','3000') -WorkingDirectory $env:FABRIQ_WEB -RedirectStandardOutput ($env:FABRIQ_TEMP + '\web.log') -RedirectStandardError ($env:FABRIQ_TEMP + '\web.error.log') -WindowStyle Hidden -PassThru; Set-Content -Encoding ascii -Path ($env:FABRIQ_TEMP + '\web.pid') -Value $p.Id"
  if errorlevel 1 (
    set "FAIL_MESSAGE=Could not start Next.js."
    goto :failed
  )
  call :wait_url "http://127.0.0.1:3000" 45
  if errorlevel 1 (
    set "FAIL_MESSAGE=Next.js did not respond in 45 seconds. See web.error.log"
    goto :failed
  )
  echo       [OK] Web application is ready
)

call :url_ok "http://127.0.0.1:8080"
if not errorlevel 1 (
  echo       [OK] Presentation is already responding
) else (
  call :ensure_port_free 8080
  if errorlevel 1 goto :failed
  echo       Starting presentation...
  powershell -NoProfile -ExecutionPolicy Bypass -Command "$p = Start-Process -FilePath $env:FABRIQ_PYTHON_EXE -ArgumentList @('-m','http.server','8080','--bind','127.0.0.1','--directory','PREZA-WEB') -WorkingDirectory $env:FABRIQ_ROOT -RedirectStandardOutput ($env:FABRIQ_TEMP + '\presentation.log') -RedirectStandardError ($env:FABRIQ_TEMP + '\presentation.error.log') -WindowStyle Hidden -PassThru; Set-Content -Encoding ascii -Path ($env:FABRIQ_TEMP + '\presentation.pid') -Value $p.Id"
  if errorlevel 1 (
    set "FAIL_MESSAGE=Could not start the presentation server."
    goto :failed
  )
  call :wait_url "http://127.0.0.1:8080" 20
  if errorlevel 1 (
    set "FAIL_MESSAGE=Presentation did not respond in 20 seconds. See presentation.error.log"
    goto :failed
  )
  echo       [OK] Presentation is ready
)

call :url_ok "http://127.0.0.1:3001"
if not errorlevel 1 (
  echo       [OK] Documentation is already responding
) else (
  call :ensure_port_free 3001
  if errorlevel 1 goto :failed
  echo       Starting documentation...
  powershell -NoProfile -ExecutionPolicy Bypass -Command "$p = Start-Process -FilePath $env:FABRIQ_NODE_EXE -ArgumentList @($env:FABRIQ_DOCS_BIN,'serve','--host','127.0.0.1','--port','3001','--no-open') -WorkingDirectory $env:FABRIQ_DOCS -RedirectStandardOutput ($env:FABRIQ_TEMP + '\docs.log') -RedirectStandardError ($env:FABRIQ_TEMP + '\docs.error.log') -WindowStyle Hidden -PassThru; Set-Content -Encoding ascii -Path ($env:FABRIQ_TEMP + '\docs.pid') -Value $p.Id"
  if errorlevel 1 (
    set "FAIL_MESSAGE=Could not start documentation."
    goto :failed
  )
  call :wait_url "http://127.0.0.1:3001" 30
  if errorlevel 1 (
    set "FAIL_MESSAGE=Documentation did not respond in 30 seconds. See docs.error.log"
    goto :failed
  )
  echo       [OK] Documentation is ready
)

call :show_summary
start "" "http://127.0.0.1:3000"
start "" "http://127.0.0.1:8080"
echo.
echo Stop:   START-FABRIQ.bat stop
echo Status: START-FABRIQ.bat status
echo Logs:   START-FABRIQ.bat logs
echo.
pause
exit /b 0

:detect_python
set "BOOTSTRAP_PY="
where py >nul 2>&1
if not errorlevel 1 set "BOOTSTRAP_PY=py -3"
if not defined BOOTSTRAP_PY (
  where python >nul 2>&1
  if not errorlevel 1 set "BOOTSTRAP_PY=python"
)
if not defined BOOTSTRAP_PY (
  set "FAIL_MESSAGE=Python was not found. Install Python 3.11 or newer and add it to PATH."
  exit /b 1
)
for /f "delims=" %%V in ('%BOOTSTRAP_PY% --version 2^>^&1') do set "PY_VERSION=%%V"
%BOOTSTRAP_PY% -c "import sys; raise SystemExit(0 if sys.version_info >= (3, 11) else 1)" >nul 2>&1
if errorlevel 1 (
  set "FAIL_MESSAGE=Python 3.11 or newer is required. Found: !PY_VERSION!"
  exit /b 1
)
echo [OK] !PY_VERSION!
>>"%LAUNCH_LOG%" echo [OK] !PY_VERSION!
exit /b 0

:detect_node
where node >nul 2>&1
if errorlevel 1 (
  set "FAIL_MESSAGE=Node.js was not found. Install Node.js 20 or newer and add it to PATH."
  exit /b 1
)
where npm >nul 2>&1
if errorlevel 1 (
  set "FAIL_MESSAGE=npm was not found. Reinstall Node.js with npm."
  exit /b 1
)
for /f "delims=" %%V in ('node --version') do set "NODE_VERSION=%%V"
for /f "delims=" %%V in ('npm --version') do set "NPM_VERSION=%%V"
node -e "process.exit(Number(process.versions.node.split('.')[0]) >= 20 ? 0 : 1)" >nul 2>&1
if errorlevel 1 (
  set "FAIL_MESSAGE=Node.js 20 or newer is required. Found: !NODE_VERSION!"
  exit /b 1
)
for /f "delims=" %%I in ('where node 2^>nul') do if not defined NODE_EXE set "NODE_EXE=%%I"
echo [OK] Node.js !NODE_VERSION!
echo [OK] npm !NPM_VERSION!
>>"%LAUNCH_LOG%" echo [OK] Node.js !NODE_VERSION!, npm !NPM_VERSION!
set "FABRIQ_ROOT=%ROOT%"
set "FABRIQ_TEMP=%TEMP_DIR%"
set "FABRIQ_WEB=%WEB_DIR%"
set "FABRIQ_DOCS=%DOCS_DIR%"
set "FABRIQ_PYTHON_EXE=%VENV_PY%"
set "FABRIQ_NODE_EXE=%NODE_EXE%"
set "FABRIQ_NEXT_BIN=node_modules/next/dist/bin/next"
set "FABRIQ_DOCS_BIN=node_modules/@docusaurus/core/bin/docusaurus.mjs"
exit /b 0

:ensure_port_free
powershell -NoProfile -ExecutionPolicy Bypass -Command "$listener = Get-NetTCPConnection -State Listen -LocalPort %~1 -ErrorAction SilentlyContinue; if ($listener) { exit 1 } else { exit 0 }" >nul 2>&1
if errorlevel 1 (
  set "FAIL_MESSAGE=Port %~1 is occupied by an unknown process. Free the port or run START-FABRIQ.bat stop."
  exit /b 1
)
exit /b 0

:url_ok
powershell -NoProfile -ExecutionPolicy Bypass -Command "try { $r = Invoke-WebRequest -UseBasicParsing -Uri '%~1' -TimeoutSec 2; if ($r.StatusCode -ge 200 -and $r.StatusCode -lt 400) { exit 0 }; exit 1 } catch { exit 1 }" >nul 2>&1
exit /b %errorlevel%

:wait_url
set "WAIT_URL=%~1"
set /a "WAIT_LEFT=%~2"
:wait_url_loop
call :url_ok "%WAIT_URL%"
if not errorlevel 1 exit /b 0
if !WAIT_LEFT! LEQ 0 exit /b 1
set /a WAIT_LEFT-=1
powershell -NoProfile -ExecutionPolicy Bypass -Command "Start-Sleep -Seconds 1" >nul 2>&1
goto :wait_url_loop

:cleanup_stale_pid
set "PID_FILE=%TEMP_DIR%\%~1.pid"
if not exist "!PID_FILE!" exit /b 0
set "SAVED_PID="
set /p SAVED_PID=<"!PID_FILE!"
powershell -NoProfile -ExecutionPolicy Bypass -Command "if (Get-Process -Id !SAVED_PID! -ErrorAction SilentlyContinue) { exit 0 } else { exit 1 }" >nul 2>&1
if errorlevel 1 del /q "!PID_FILE!" >nul 2>&1
exit /b 0

:get_pid
set "%~2=existing"
if exist "%TEMP_DIR%\%~1.pid" (
  set /p FOUND_PID=<"%TEMP_DIR%\%~1.pid"
  set "%~2=!FOUND_PID!"
)
exit /b 0

:show_summary
call :get_pid "python-api" API_PID
call :get_pid "web" WEB_PID
call :get_pid "presentation" PREZA_PID
call :get_pid "docs" DOCS_PID
echo.
echo ============================================================
echo   ALL SERVICES ARE RUNNING
echo ============================================================
echo [ONLINE] Python API    PID: !API_PID!
echo          http://127.0.0.1:8000
echo          http://127.0.0.1:8000/docs
echo.
echo [ONLINE] Fabriq Web    PID: !WEB_PID!
echo          http://127.0.0.1:3000
echo.
echo [ONLINE] Presentation  PID: !PREZA_PID!
echo          http://127.0.0.1:8080
echo.
echo [ONLINE] Documentation PID: !DOCS_PID!
echo          http://127.0.0.1:3001/docs/
echo.
echo [LOGS]   %TEMP_DIR%
echo ============================================================
>>"%LAUNCH_LOG%" echo [%date% %time%] ALL SERVICES ARE RUNNING
exit /b 0

:status_only
echo.
echo ============================================================
echo   FABRIQ / SERVICE STATUS
echo ============================================================
call :print_status "Python API" "http://127.0.0.1:8000/health" "python-api"
call :print_status "Fabriq Web" "http://127.0.0.1:3000" "web"
call :print_status "Presentation" "http://127.0.0.1:8080" "presentation"
call :print_status "Documentation" "http://127.0.0.1:3001/docs/" "docs"
echo.
echo Logs: %TEMP_DIR%
echo ============================================================
pause
exit /b 0

:print_status
call :get_pid "%~3" CURRENT_PID
call :url_ok "%~2"
if errorlevel 1 (
  echo [OFFLINE] %~1    PID: !CURRENT_PID!    %~2
) else (
  echo [ONLINE]  %~1    PID: !CURRENT_PID!    %~2
)
exit /b 0

:stop_all
echo.
echo Stopping managed Fabriq processes...
call :stop_service "python-api" "Python API"
call :stop_service "web" "Fabriq Web"
call :stop_service "presentation" "Presentation"
call :stop_service "docs" "Documentation"
echo Done. Logs remain in %TEMP_DIR%
pause
exit /b 0

:stop_service
set "STOP_FILE=%TEMP_DIR%\%~1.pid"
if not exist "!STOP_FILE!" (
  echo [SKIP] %~2: managed PID not found
  exit /b 0
)
set "STOP_PID="
set /p STOP_PID=<"!STOP_FILE!"
taskkill /PID !STOP_PID! /T /F >nul 2>&1
if errorlevel 1 (
  echo [SKIP] %~2: process !STOP_PID! has already stopped
) else (
  echo [OK]   %~2: process !STOP_PID! stopped
)
del /q "!STOP_FILE!" >nul 2>&1
exit /b 0

:open_logs
if not exist "%TEMP_DIR%" mkdir "%TEMP_DIR%"
start "" explorer "%TEMP_DIR%"
exit /b 0

:usage
echo Usage:
echo   START-FABRIQ.bat          install, build and start
echo   START-FABRIQ.bat status   show service status
echo   START-FABRIQ.bat stop     stop managed services
echo   START-FABRIQ.bat logs     open the log directory
pause
exit /b 1

:failed
echo.
echo ============================================================
echo   STARTUP FAILED
echo ============================================================
echo !FAIL_MESSAGE!
echo Logs: %TEMP_DIR%
echo ============================================================
>>"%LAUNCH_LOG%" echo [%date% %time%] ERROR: !FAIL_MESSAGE!
pause
exit /b 1
