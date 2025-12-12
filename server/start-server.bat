@echo off
title Bestseller Server
cd /d "%~dp0"
echo Starting Bestseller Server...
echo.
echo Server will keep running. Press Ctrl+C to stop.
echo Close this window to stop the server.
echo.
node index.js
pause

