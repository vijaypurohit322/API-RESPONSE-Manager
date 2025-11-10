@echo off
echo ========================================
echo Starting API Response Manager
echo ========================================
echo.

echo Starting Backend Server (port 5000)...
start "Backend Server" cmd /k "cd backend && npm start"
timeout /t 3 /nobreak > nul

echo Starting Proxy Server (port 8080)...
start "Proxy Server" cmd /k "cd proxy && npm start"
timeout /t 2 /nobreak > nul

echo Starting Test API Server (port 3000)...
start "Test API" cmd /k "cd test-app && python app.py"
timeout /t 2 /nobreak > nul

echo.
echo ========================================
echo All servers started!
echo ========================================
echo.
echo Backend:  http://localhost:5000
echo Proxy:    http://localhost:8080
echo Test API: http://localhost:3000
echo Frontend: http://localhost:5173
echo.
echo Press any key to close this window...
pause > nul
