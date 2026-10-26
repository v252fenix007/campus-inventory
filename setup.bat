@echo off
echo ============================================================
echo   CampusFlow - Smart Student OD & Leave Management System
echo ============================================================
echo Setting up environment for Windows...

:: Check Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed! Please download and install Node.js from https://nodejs.org
    pause
    exit /b 1
)

:: Copy environment files if not present
if not exist server\.env (
    copy server\.env.example server\.env
    echo [OK] Created server\.env
) else (
    echo [OK] server\.env exists
)

if not exist client\.env (
    copy client\.env.example client\.env
    echo [OK] Created client\.env
) else (
    echo [OK] client\.env exists
)

if not exist server\uploads (
    mkdir server\uploads
)

:: Install dependencies
echo.
echo Installing packages...
call npm install
call npm --prefix server install
call npm --prefix client install
echo [OK] Dependencies installed successfully.

:: Seed demo data
echo.
echo Seeding database with demo data...
call npm --prefix server run seed

echo.
echo ============================================================
echo  SETUP COMPLETE! TO RUN:
echo ============================================================
echo  Execute: npm run dev
echo.
echo  Then open in your browser:
echo  - Frontend: http://localhost:5173
echo  - Backend:  http://localhost:5050/api/v1
echo  - Docs:     http://localhost:5050/api-docs
echo ============================================================
pause
