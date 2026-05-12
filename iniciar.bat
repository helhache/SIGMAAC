@echo off
echo ========================================
echo   SIGMA AC - Iniciando
echo ========================================

echo.
echo [1/2] Iniciando servidor (puerto 5000)...
start "Backend - SIGMA" cmd /k "cd /d C:\Users\henry\Desktop\SIGMA AC\SIGMA AC\server && node index.js"
timeout /t 2 /nobreak > /dev/null

echo [2/2] Iniciando cliente React (puerto 3000)...
start "Frontend - SIGMA" cmd /k "cd /d C:\Users\henry\Desktop\SIGMA AC\SIGMA AC\client && npm run dev"

echo.
echo ========================================
echo  Abriendo http://localhost:3000 ...
echo ========================================
timeout /t 5 /nobreak > /dev/null
start http://localhost:3000
