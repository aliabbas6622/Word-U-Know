@echo off
echo ========================================
echo   AI Studio App Setup
echo ========================================
echo.

echo 1. Installing dependencies...
npm install
if %errorlevel% neq 0 (
    echo ERROR: Failed to install dependencies
    pause
    exit /b 1
)

echo.
echo 2. Checking environment configuration...
if not exist .env.local (
    echo WARNING: .env.local not found
    echo Please copy .env.example to .env.local and configure your API keys
    echo.
    copy .env.example .env.local
    echo Created .env.local from template
    echo.
    echo IMPORTANT: Edit .env.local and add your actual API keys:
    echo - GEMINI_API_KEY: Get from https://aistudio.google.com/apikey
    echo - CLIPDROP_API_KEY: Get from https://clipdrop.co/apis
    echo.
)

echo 3. Running TypeScript check...
npm run lint
if %errorlevel% neq 0 (
    echo WARNING: TypeScript errors found
)

echo.
echo ========================================
echo   Setup Complete!
echo ========================================
echo.
echo To start the application:
echo   Option 1: Double-click start.bat
echo   Option 2: Run 'npm run server' and 'npm run dev' in separate terminals
echo.
echo Make sure to configure your API keys in .env.local before starting!
echo.
pause