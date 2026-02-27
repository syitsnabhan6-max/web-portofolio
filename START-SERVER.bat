@echo off
REM Portfolio Website Startup Script
REM Run this file to start the portfolio website server

echo ===============================================
echo    Portfolio Website Server Startup
echo ===============================================
echo.

REM Check if node is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo Error: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

REM Check if npm is installed
npm --version >nul 2>&1
if errorlevel 1 (
    echo Error: NPM is not installed
    pause
    exit /b 1
)

echo Node.js found: 
node --version
echo NPM found:
npm --version
echo.

REM Check if node_modules exists
if not exist "node_modules" (
    echo Installing dependencies...
    call npm install
    if errorlevel 1 (
        echo Error: Failed to install dependencies
        pause
        exit /b 1
    )
    echo Dependencies installed successfully!
    echo.
)

REM Start the server
echo Starting server...
echo.
echo ===============================================
echo Server should be running at:
echo   http://localhost:3000
echo
echo Admin Panel:
echo   http://localhost:3000/admin.html
echo
echo Splash Screen:
echo   http://localhost:3000/splash.html
echo
echo Press Ctrl+C to stop the server
echo ===============================================
echo.

call npm start

pause
