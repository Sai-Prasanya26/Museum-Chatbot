@echo off
title Launch Museum Project
echo ===================================================
echo   LAUNCHING MUSEUM DISCOVERY ^& BOOKING SYSTEM
echo ===================================================
cd /d "%~dp0"

echo [1/3] Checking MySQL Database...
tasklist /FI "IMAGENAME eq mysqld.exe" 2>NUL | find /I /N "mysqld.exe">NUL
if "%ERRORLEVEL%"=="0" (
    echo MySQL is already running.
) else (
    echo Starting MySQL Server in background...
    start "Museum MySQL Database" /min "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysqld.exe" --datadir="C:\Users\saipr.SAIPRASANYA.000\Desktop\Puppyyy\mysql-data" --port=3306 --console
    timeout /t 3 /nobreak >nul
)

echo [2/3] Opening browser at http://localhost:5000...
timeout /t 1 /nobreak >nul
start http://localhost:5000

echo [3/3] Starting Web Application Server...
echo ===================================================
echo Application running at: http://localhost:5000
echo Press Ctrl+C in this terminal when you want to stop.
echo ===================================================
echo.
node backend/server.js
pause
