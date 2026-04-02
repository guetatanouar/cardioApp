@echo off
REM CardioManager Environment Setup Script for Windows

echo.
echo ======================================
echo CardioManager Environment Setup
echo ======================================
echo.

REM API Setup
echo Setting up API (.env)...
if not exist "apps\api\.env" (
  copy "apps\api\.env.example" "apps\api\.env" >nul
  echo [OK] Created apps\api\.env
  echo.
  echo Please configure the following in apps\api\.env:
  echo   - DATABASE_URL: PostgreSQL connection string
  echo   - JWT_SECRET: A strong random secret (min 32 characters^)
  echo   - CORS_ORIGIN: Frontend URL(s^)
  echo.
  pause
) else (
  echo [OK] apps\api\.env already exists
)

REM Web Setup
echo.
echo Setting up Web (.env.local)...
if not exist "apps\web\.env.local" (
  copy "apps\web\.env.example" "apps\web\.env.local" >nul
  echo [OK] Created apps\web\.env.local
  echo.
  echo Configure in apps\web\.env.local if needed:
  echo   - NEXT_PUBLIC_API_BASE: Backend API URL
  echo   - NEXT_PUBLIC_APP_NAME: Application name
  echo.
) else (
  echo [OK] apps\web\.env.local already exists
)

echo.
echo ======================================
echo Environment setup completed!
echo ======================================
echo.
echo Next steps:
echo 1. Update apps\api\.env with your database credentials
echo 2. Generate a strong JWT_SECRET for production use
echo 3. Run: npm run db:init (to initialize the database^)
echo 4. Run: npm run dev (to start development^)
echo.
pause
