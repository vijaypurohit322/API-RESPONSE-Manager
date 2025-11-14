@echo off
echo ========================================
echo Diagnostic Check
echo ========================================
echo.

echo Checking if MongoDB is running...
sc query MongoDB | find "RUNNING" >nul
if %errorlevel% equ 0 (
    echo [OK] MongoDB is running
) else (
    echo [ERROR] MongoDB is NOT running
    echo Run: net start MongoDB
)
echo.

echo Checking if Backend is running (port 5000)...
netstat -ano | findstr ":5000" | findstr "LISTENING" >nul
if %errorlevel% equ 0 (
    echo [OK] Backend is running on port 5000
) else (
    echo [ERROR] Backend is NOT running on port 5000
    echo Run: cd backend ^&^& npm start
)
echo.

echo Checking if Proxy is running (port 8080)...
netstat -ano | findstr ":8080" | findstr "LISTENING" >nul
if %errorlevel% equ 0 (
    echo [OK] Proxy is running on port 8080
) else (
    echo [ERROR] Proxy is NOT running on port 8080
    echo Run: cd proxy ^&^& npm start
)
echo.

echo Checking if Test API is running (port 3000)...
netstat -ano | findstr ":3000" | findstr "LISTENING" >nul
if %errorlevel% equ 0 (
    echo [OK] Test API is running on port 3000
) else (
    echo [ERROR] Test API is NOT running on port 3000
    echo Run: cd test-app ^&^& python app.py
)
echo.

echo ========================================
echo Summary
echo ========================================
echo All 4 services must be running for the system to work:
echo 1. MongoDB
echo 2. Backend (port 5000)
echo 3. Proxy (port 8080)
echo 4. Test API (port 3000)
echo.
pause
