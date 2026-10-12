@echo off
title Panel de Investigacion CUIAG-CIS - FACSA UJED
echo ========================================================
echo   FACSA - UJED ^| Protocolo CUIAG-CIS
echo   Panel de Investigacion, Metricas y Analisis
echo   Uso de IA y Competencias Investigativas en Salud
echo ========================================================
echo.
echo Abriendo Panel de Investigacion en http://localhost:8080/admin ...
start http://localhost:8080/admin
if exist "server.py" (
    python server.py 8080
) else (
    python -m http.server 8080
)
pause
