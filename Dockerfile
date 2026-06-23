FROM node:20-alpine

WORKDIR /app

# Необходимые системные пакеты
RUN apk add --no-cache libc6-compat openssl

# Копируем манифесты зависимостей
COPY package.json package-lock.json* ./
COPY prisma ./prisma/

# Устанавливаем все зависимости
RUN npm ci

# Копируем весь исходный код проекта
COPY . .

# Генерируем клиент базы данных (это не требует активного подключения)
RUN npx prisma generate

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# При запуске контейнера:
# 1. Сначала делаем сборку (теперь БД будет доступна)
# 2. Затем запускаем сервер
CMD ["sh", "-c", "npm run build && npm start"]
