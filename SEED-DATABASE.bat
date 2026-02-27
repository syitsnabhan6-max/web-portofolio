@echo off
REM Seed sample projects ke database
REM Jalankan file ini untuk populate database dengan sample projects

echo ===============================================
echo    Seeding Sample Projects
echo ===============================================
echo.

REM Check if node is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo Error: Node.js is not installed
    pause
    exit /b 1
)

echo Seeding database with sample projects...
echo.

call node seed-projects.js

echo.
echo ===============================================
echo Done! Sekarang Anda bisa login ke admin panel
echo Username: admin
echo Password: admin123
echo ===============================================
pause
