@echo off
set "shortcut_path=%USERPROFILE%\Desktop\TyT.lnk"
set "target_path=%~dp0main.bat"
set "icon_path=%~dp0Icon.ico"
set "shortcut_name=TyT"

powershell -Command "$WshShell = New-Object -com WScript.Shell; $Shortcut = $WshShell.CreateShortcut('%shortcut_path%'); $Shortcut.TargetPath = '%target_path%'; $Shortcut.IconLocation = '%icon_path%'; $Shortcut.WorkingDirectory = '%~dp0'; $Shortcut.Save()"