@echo off
echo ========================================================
echo Starting MongoDB Database Service...
echo ========================================================
net session >nul 2>&1
if %ERRORLevel% == 0 (
    net start MongoDB
    echo MongoDB service started successfully!
) else (
    echo Administrator permissions needed. Requesting UAC elevation...
    powershell -Command "Start-Process cmd -ArgumentList '/c net start MongoDB && echo MongoDB is now RUNNING! && timeout /t 3' -Verb RunAs"
)
