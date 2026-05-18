@echo off
echo ============================================
echo   ZenFlow - Smart Journal Setup (Windows)
echo ============================================
echo.

echo [1/2] Installing Backend dependencies...
cd backend
call npm install
echo Backend ready!
echo.

echo [2/2] Installing Frontend dependencies...
cd ..\frontend
call npm install
echo Frontend ready!
echo.

echo ============================================
echo  SETUP COMPLETE!
echo ============================================
echo.
echo To start the app:
echo.
echo  Terminal 1 (Backend):
echo    cd backend
echo    npm run dev
echo.
echo  Terminal 2 (Frontend):
echo    cd frontend
echo    npm start
echo.
echo Make sure MongoDB is running first!
echo ============================================
pause
