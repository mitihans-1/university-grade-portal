@echo off
echo Starting University Grade Portal Application...
echo.

REM Start backend server in a new command window
start cmd /k "cd backend && npm run dev"

REM Wait a bit for the backend to start
timeout /t 3 /nobreak >nul

REM Start frontend server in a new command window
start cmd /k "cd react-grade && npm run dev"

echo Both servers are starting...
echo Backend: http://localhost:5000
echo Frontend: http://localhost:3000 (or next available port)
echo.
echo Press any key to exit...
pause >nul