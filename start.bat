@echo off
REM Quick Start Script for Magic Fruit Plinko Game (Windows)

echo.
echo 🍒 Magic Fruit - Plinko Game
echo ================================
echo.

REM Check if Node.js is installed
node -v >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js is not installed!
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

echo ✅ Node.js version: 
node -v
echo ✅ npm version:
npm -v
echo.

REM Check if dependencies are installed
if not exist "node_modules" (
    echo 📦 Installing dependencies...
    call npm install
) else (
    echo ✅ Dependencies already installed
)

echo.
echo 🚀 Starting development server...
echo 📍 Open your browser and go to: http://localhost:5173
echo.
call npm run dev
pause
