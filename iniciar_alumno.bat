@echo off
title Vista de Alumno - Cuestionario CUIAG-CIS FACSA UJED
echo ========================================================
echo   Facultad de Ciencias de la Salud (FACSA - UJED)
echo   CUESTIONARIO PARA ALUMNOS (CUIAG-CIS)
echo   Medicina ^| Psicologia ^| Nutricion
echo ========================================================
echo.
echo Abriendo Cuestionario de Alumnos en http://localhost:8080/ ...
start http://localhost:8080/
if exist "server.py" (
    python server.py 8080
) else (
    python -m http.server 8080
)
pause
