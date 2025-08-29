@echo off
cd /d "%~dp0"
cd dist
python -m http.server 8080
