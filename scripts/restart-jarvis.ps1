# Kill all Node and Chrome processes and restart the dev server
Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force
Get-Process -Name chrome -ErrorAction SilentlyContinue | Stop-Process -Force

# Clear SingletonLocks
$sessionsPath = "D:\VENDA\saas-startup\sessions"
if (Test-Path $sessionsPath) {
    Get-ChildItem -Path $sessionsPath -Filter SingletonLock -Recurse -ErrorAction SilentlyContinue | Remove-Item -Force
    Write-Host "✅ Locks de sessão limpos." -ForegroundColor Green
}

Write-Host "🚀 Reiniciando servidor..." -ForegroundColor Cyan
npm run dev
