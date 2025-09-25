@echo off
setlocal enabledelayedexpansion
title TyT - TheYali1
chcp 65001 >nul
:start
cls
yt-dlp -U
cls
echo.
echo                    [38;2;255;0;0m--------------------------                            [38;2;255;0;0m--------------------------                
ping localhost -n 1 >nul
echo                    [38;2;255;0;0m--------------------------                            [38;2;255;0;0m--------------------------
ping localhost -n 1 >nul
echo                    [38;2;255;0;0m-------------------------- [0m@@@@@@@@@@@@@ @@@@@@@@@@@@ [38;2;255;0;0m--------------------------
ping localhost -n 1 >nul
echo                    [38;2;255;0;0m-------------------------- [0m@@@@@@@@@@@@@@@@@@@@@@@@@@ [38;2;255;0;0m--------------------------
ping localhost -n 1 >nul
echo                    [38;2;255;0;0m-------------------------- [0m@@@@@@@@@@@@@@@@@@@@@@@@@@ [38;2;255;0;0m--------------------------
ping localhost -n 1 >nul
echo                    [38;2;255;0;0m-------------------------- [0m @@@@@@@@@@@@@@@@@@@@@@@@@ [38;2;255;0;0m--------------------------
ping localhost -n 1 >nul
echo                    [38;2;255;0;0m     ----------------      [0m @@@@@@@@@@@@@@@@@@@@@@@@  [38;2;255;0;0m     ----------------     
ping localhost -n 1 >nul
echo                    [38;2;255;0;0m     ----------------      [0m @@@@@@@@@@@@@@@@@@@@@@@@  [38;2;255;0;0m     ----------------     
ping localhost -n 1 >nul
echo                    [38;2;255;0;0m     ----------------      [0m  @@@@@@@@@@@@@@@@@@@@@@@  [38;2;255;0;0m     ----------------     
ping localhost -n 1 >nul
echo                    [38;2;255;0;0m     ----------------      [0m  @@@@@@@@@@@@@@@@@@@@@@   [38;2;255;0;0m     ----------------     
ping localhost -n 1 >nul
echo                    [38;2;255;0;0m     ----------------      [0m  @@@@@@@@@@@@@@@@@@@@@@   [38;2;255;0;0m     ----------------     
ping localhost -n 1 >nul
echo                    [38;2;255;0;0m     ----------------      [0m   @@@@@@@@@@@@@@@@@@@@@   [38;2;255;0;0m     ----------------     
ping localhost -n 1 >nul
echo                    [38;2;255;0;0m     ----------------      [0m   @@@@@@@@@@@@@@@@@@@@@   [38;2;255;0;0m     ----------------     
ping localhost -n 1 >nul
echo                    [38;2;255;0;0m     ----------------      [0m    @@@@@@@@@@@@@@@@@@@    [38;2;255;0;0m     ----------------     
ping localhost -n 1 >nul
echo                                                        [0m@@@@@@@@@@@@@@
ping localhost -n 1 >nul
echo                                                        [0m@@@@@@@@@@@@@@
ping localhost -n 2 >nul
echo.

if not exist "Settings.ini" (
    echo [101;93m ERROR: Settings.ini file not found! [0m
    echo Please make sure Settings.ini exists in the script directory.
    pause
    exit
)

for /f "tokens=1,* delims==" %%A in ('findstr /r "^PathToDownload=" "Settings.ini"') do (
    set "DownloadPath=%%B"
)
set "DownloadPath=!DownloadPath:"=!"

if "!DownloadPath!"=="" (
    echo [101;93m ERROR: Download path is not set in Settings.ini! [0m
    echo Please set PathToDownload in Settings.ini and try again.
    pause
    exit
)

echo                                            [38;2;255;0;0m╔═════════════════════════════╗[0m
ping localhost -n 1 >nul
echo                                           [38;2;255;0;0m ║           « URL »           ║[0m
ping localhost -n 1 >nul
echo                                           [38;2;255;0;0m ╚═════════════════════════════╝[0m
ping localhost -n 1 >nul
set /p url=[38;2;255;0;0m═^> [0m
echo %url% | findstr /i "youtube.com/watch?v=" >nul
if not errorlevel 1 (
    call :download
) else (
    echo %url% | findstr /i "youtu.be/" >nul
    if not errorlevel 1 (
        call :download
    ) else (
        echo [101;93m Its Not A Link! [0m
        pause
        goto :start
    )
)
pause

:download
cls
echo.
echo                    [38;2;255;0;0m--------------------------                            [38;2;255;0;0m--------------------------                
echo                    [38;2;255;0;0m--------------------------                            [38;2;255;0;0m--------------------------
echo                    [38;2;255;0;0m-------------------------- [0m@@@@@@@@@@@@@ @@@@@@@@@@@@ [38;2;255;0;0m--------------------------
echo                    [38;2;255;0;0m-------------------------- [0m@@@@@@@@@@@@@@@@@@@@@@@@@@ [38;2;255;0;0m--------------------------
echo                    [38;2;255;0;0m-------------------------- [0m@@@@@@@@@@@@@@@@@@@@@@@@@@ [38;2;255;0;0m--------------------------
echo                    [38;2;255;0;0m-------------------------- [0m @@@@@@@@@@@@@@@@@@@@@@@@@ [38;2;255;0;0m--------------------------
echo                    [38;2;255;0;0m     ----------------      [0m @@@@@@@@@@@@@@@@@@@@@@@@  [38;2;255;0;0m     ----------------     
echo                    [38;2;255;0;0m     ----------------      [0m @@@@@@@@@@@@@@@@@@@@@@@@  [38;2;255;0;0m     ----------------     
echo                    [38;2;255;0;0m     ----------------      [0m  @@@@@@@@@@@@@@@@@@@@@@@  [38;2;255;0;0m     ----------------     
echo                    [38;2;255;0;0m     ----------------      [0m  @@@@@@@@@@@@@@@@@@@@@@   [38;2;255;0;0m     ----------------     
echo                    [38;2;255;0;0m     ----------------      [0m  @@@@@@@@@@@@@@@@@@@@@@   [38;2;255;0;0m     ----------------     
echo                    [38;2;255;0;0m     ----------------      [0m   @@@@@@@@@@@@@@@@@@@@@   [38;2;255;0;0m     ----------------     
echo                    [38;2;255;0;0m     ----------------      [0m   @@@@@@@@@@@@@@@@@@@@@   [38;2;255;0;0m     ----------------     
echo                    [38;2;255;0;0m     ----------------      [0m    @@@@@@@@@@@@@@@@@@@    [38;2;255;0;0m     ----------------     
echo                                                        [0m@@@@@@@@@@@@@@
echo                                                        [0m@@@@@@@@@@@@@@
ping localhost -n 2 >nul
echo.
echo                                            [38;2;255;0;0m╔═════════════════════════════╗[0m
ping localhost -n 1 >nul
echo                                           [38;2;255;0;0m ║        « 1. Video »         ║[0m
ping localhost -n 1 >nul
echo                                           [38;2;255;0;0m ║        « 2. Audio »         ║[0m
ping localhost -n 1 >nul
echo                                           [38;2;255;0;0m ╚═════════════════════════════╝[0m
ping localhost -n 1 >nul
set /p Downloader=[38;2;255;0;0m═^> [0m
if "%Downloader%"=="1" (
    yt-dlp.exe -f "bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best" -o "!DownloadPath!\%%(title)s.%%(ext)s" "%url%"
    echo.
    echo [38;2;0;255;0m Download Complete! [0m
    echo [94m Click Enter To Download Another Video [0m
    pause >nul
    goto :start
) else if "%Downloader%"=="2" (
    yt-dlp.exe -x --audio-format mp3 -o "!DownloadPath!\%%(title)s.%%(ext)s" "%url%"
    echo.
    echo [38;2;0;255;0m Download Complete! [0m
    echo [94m Click Enter To Download Another Audio [0m
    pause >nul
    goto :start
) else (
    goto :download
)
