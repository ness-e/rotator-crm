@echo off
REM Test runner script for Windows
REM Bypasses PowerShell execution policy issues

echo Running backend tests...
cd backend
node --experimental-vm-modules ../node_modules/jest/bin/jest.js %*
cd ..
