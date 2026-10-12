@echo off
title Cuestionario CUIAG-CIS - FACSA UJED
echo ========================================================
echo   Facultad de Ciencias de la Salud (FACSA - UJED)
echo   Cuestionario CUIAG-CIS - Investigacion e IA en Salud
echo   Medicina | Psicologia | Nutricion
echo ========================================================
echo.
echo Iniciando servidor local en http://localhost:8080/ ...
start http://localhost:8080/
if exist "server.py" (
    python server.py 8080
) else (
    python -m http.server 8080
)
pause
