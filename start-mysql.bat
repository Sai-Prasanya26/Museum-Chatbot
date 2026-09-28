@echo off
title MySQL Database Server - Museum Project
echo ===================================================
echo Starting MySQL Database for Museum Project...
echo ===================================================
echo Data directory: C:\Users\saipr.SAIPRASANYA.000\Desktop\Puppyyy\mysql-data
echo Port: 3306
echo.
"C:\Program Files\MySQL\MySQL Server 8.0\bin\mysqld.exe" --datadir="C:\Users\saipr.SAIPRASANYA.000\Desktop\Puppyyy\mysql-data" --port=3306 --console
pause
