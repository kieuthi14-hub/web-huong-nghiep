@echo off
set PATH=d:\LAMWEB\node-portable\node-v20.11.0-win-x64;%PATH%
echo Tiến hành build thử dự án để rà soát lỗi...
call d:\LAMWEB\node-portable\node-v20.11.0-win-x64\npm.cmd run build
