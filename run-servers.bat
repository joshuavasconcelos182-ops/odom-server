@echo off
cd /d "%~dp0"
start "ServerL" cmd /k "node serverL.js"
start "ServerR" cmd /k "node ServerR.js"
echo Started serverL and ServerR in separate windows.
exit /b 0
