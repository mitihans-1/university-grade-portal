@echo off
echo ========================================
echo Starting University Grade Portal
echo ========================================
echo.

echo [1/2] Starting Backend Server (Port 5000)...
start "Backend Server" cmd /k "cd backend && npm start"
timeout /t 3 /nobreak >nul

echo [2/2] Starting Frontend Server (Port 5173)...
start "Frontend Server" cmd /k "cd react-grade && npm run dev"
timeout /t 3 /nobreak >nul

echo.
echo ========================================
echo Servers are starting in separate windows
echo ========================================
echo.
echo Backend:  http://localhost:5000
echo Frontend: http://localhost:5173
echo.
echo Press any key to exit this window...
pause >nul

