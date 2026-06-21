Do
  Set WshShell = CreateObject("WScript.Shell")
  WshShell.Run "cmd /c cd /d C:\Dev\Proyectos\AlquiListo\backend && node src\index.js", 0, True
  WScript.Sleep 2000
Loop