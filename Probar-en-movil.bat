@echo off
cd /d "%~dp0"
where py >nul 2>nul
if %errorlevel% equ 0 (
  py -3 scripts\probar-movil.py
) else (
  where python >nul 2>nul
  if errorlevel 1 (
    echo Necesitas Python 3 desde python.org. Activa la opcion Add Python to PATH.
  ) else (
    python scripts\probar-movil.py
  )
)
pause
