@echo off
title Museum Project - Backend Server
echo ===================================================
echo Starting Museum Booking Web Server...
echo ===================================================
cd /d "%~dp0"
echo Application running at: http://localhost:5000
echo.
node backend/server.js
pause
