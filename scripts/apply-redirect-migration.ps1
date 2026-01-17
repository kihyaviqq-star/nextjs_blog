# Скрипт для применения миграции модели Redirect
Write-Host "Applying Redirect model migration..." -ForegroundColor Cyan

# Применяем миграцию напрямую через SQL
npx prisma db execute --file prisma/migrations/20260117060000_add_redirect_model/migration.sql --schema prisma/schema.prisma

# Генерируем Prisma Client
Write-Host "Generating Prisma Client..." -ForegroundColor Cyan
npx prisma generate

Write-Host "Migration applied successfully!" -ForegroundColor Green
