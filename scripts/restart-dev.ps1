# Скрипт для перезапуска dev server

Write-Host "🛑 Останавливаем dev server..." -ForegroundColor Yellow

# Находим и останавливаем процесс Next.js на порту 3000
$process = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess
if ($process) {
    Stop-Process -Id $process -Force
    Write-Host "✅ Dev server остановлен" -ForegroundColor Green
    Start-Sleep -Seconds 2
} else {
    Write-Host "⚠️  Dev server не запущен" -ForegroundColor Yellow
}

Write-Host "🚀 Запускаем dev server..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm run dev"

Write-Host "✨ Dev server запускается в новом окне..." -ForegroundColor Green
Write-Host "📝 Откройте http://localhost:3000/admin для проверки" -ForegroundColor Cyan
