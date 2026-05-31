$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$log = Join-Path $root "server.log"

try {
  $process = Start-Process -FilePath "node" -ArgumentList "server.js" -WorkingDirectory (Join-Path $root "backend") -NoNewWindow -PassThru -RedirectStandardOutput $log -RedirectStandardError $log
  Start-Sleep -Seconds 3
  
  if ($process.HasExited) {
    Write-Error "Server exited immediately. Check $log"
    Get-Content $log
    exit 1
  }
  
  Write-Output "Memory Companion started on http://localhost:4000"
  Write-Output "PID: $($process.Id)"
  
  while (!$process.HasExited) {
    Start-Sleep -Seconds 5
  }
}
catch {
  Write-Error "Failed to start: $_"
  exit 1
}
