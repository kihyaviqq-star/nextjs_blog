# Инструкция по деплою на сервер

## Требования

- Node.js 18+ и npm
- База данных (SQLite для разработки, PostgreSQL/MySQL для продакшена)
- PM2 или systemd для управления процессом

## Шаги деплоя

### 1. Подготовка на сервере

```bash
# Обновить систему
sudo apt update && sudo apt upgrade -y

# Установить Node.js (если не установлен)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Установить PM2 глобально
sudo npm install -g pm2
```

### 2. Клонирование и настройка проекта

```bash
# Перейти в директорию (замените на вашу)
cd /var/www/mlcrosoft.ru

# Клонировать репозиторий (если еще не склонирован)
git clone https://github.com/your-username/your-repo.git .
# или
git pull origin main

# Установить зависимости
npm install

# Создать .env файл
cp .env.example .env
nano .env
```

### 3. Настройка переменных окружения (.env)

```env
# База данных (SQLite для начала, можно перейти на PostgreSQL)
DATABASE_URL="file:./prisma/dev.db"

# NextAuth
NEXTAUTH_URL="https://mlcrosoft.ru"
NEXTAUTH_SECRET="сгенерируйте_случайную_строку_минимум_32_символа"

# OpenRouter API (для генерации статей)
OPENROUTER_API_KEY="ваш_ключ_api"

# Опционально
NEXT_PUBLIC_SITE_URL="https://mlcrosoft.ru"
```

**Генерация NEXTAUTH_SECRET:**
```bash
openssl rand -base64 32
```

### 4. Настройка базы данных

```bash
# Применить миграции
npx prisma migrate deploy

# Или для SQLite (если используете)
npx prisma db push

# Сгенерировать Prisma Client
npx prisma generate

# Опционально: заполнить тестовыми данными
npx prisma db seed
```

### 5. Сборка проекта

```bash
# Очистить старую сборку
rm -rf .next

# Собрать проект
npm run build

# Проверить, что сборка успешна
```

### 6. Запуск с PM2

```bash
# Создать файл ecosystem.config.js
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'blog',
    script: 'npm',
    args: 'start',
    cwd: '/var/www/mlcrosoft.ru',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production'
    }
  }]
}
EOF

# Запустить приложение
pm2 start ecosystem.config.js

# Сохранить конфигурацию PM2
pm2 save

# Настроить автозапуск при перезагрузке сервера
pm2 startup
```

### 7. Настройка Nginx (обратный прокси)

```bash
# Установить Nginx
sudo apt install -y nginx

# Создать конфигурацию
sudo nano /etc/nginx/sites-available/mlcrosoft.ru
```

**Содержимое конфигурации:**
```nginx
server {
    listen 80;
    server_name mlcrosoft.ru www.mlcrosoft.ru;

    # Редирект на HTTPS (если есть SSL)
    # return 301 https://$server_name$request_uri;

    # ВАЖНО: Статические файлы отдаются напрямую через Nginx
    # Это решает проблему с загрузкой изображений из /uploads
    location /uploads/ {
        alias /var/www/mlcrosoft.ru/public/uploads/;
        expires 30d;
        add_header Cache-Control "public, immutable";
        access_log off;
    }

    # Статические файлы Next.js
    location /_next/static {
        alias /var/www/mlcrosoft.ru/.next/static;
        expires 365d;
        add_header Cache-Control "public, immutable";
        access_log off;
    }

    # Другие статические файлы из public
    location /favicon.ico {
        alias /var/www/mlcrosoft.ru/public/favicon.ico;
        expires 7d;
        access_log off;
    }

    location /robots.txt {
        alias /var/www/mlcrosoft.ru/public/robots.txt;
        expires 1d;
        access_log off;
    }

    # Проксирование всех остальных запросов в Next.js
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Таймауты для длительных запросов
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}
```

```bash
# Активировать сайт
sudo ln -s /etc/nginx/sites-available/mlcrosoft.ru /etc/nginx/sites-enabled/

# Проверить конфигурацию
sudo nginx -t

# Перезагрузить Nginx
sudo systemctl reload nginx
```

### 8. SSL сертификат (Let's Encrypt)

```bash
# Установить Certbot
sudo apt install -y certbot python3-certbot-nginx

# Получить сертификат
sudo certbot --nginx -d mlcrosoft.ru -d www.mlcrosoft.ru

# Автоматическое обновление настроено автоматически
```

### 9. Проверка работы

```bash
# Проверить статус PM2
pm2 status

# Посмотреть логи
pm2 logs blog

# Проверить порт 3000
curl http://localhost:3000

# Проверить внешний доступ
curl http://mlcrosoft.ru
```

### 10. Полезные команды

```bash
# Остановить приложение
pm2 stop blog

# Перезапустить приложение
pm2 restart blog

# Посмотреть логи в реальном времени
pm2 logs blog --lines 50

# Мониторинг
pm2 monit

# Обновление кода
git pull origin main
npm install
npx prisma migrate deploy
npx prisma generate
npm run build
pm2 restart blog
```

## Решение проблем

### Ошибка сборки

Если сборка падает с ошибками:

1. **React Hooks ошибки** - проверьте, что все хуки вызываются на верхнем уровне компонента
2. **Prisma ошибки** - выполните `npx prisma generate`
3. **TypeScript ошибки** - проверьте `tsconfig.json` (в проекте `ignoreBuildErrors: true`)

### Ошибки в рантайме

1. Проверьте логи: `pm2 logs blog`
2. Проверьте переменные окружения
3. Проверьте права доступа к файлам БД
4. Проверьте порты (3000, 80, 443)

### Изображения не загружаются

Если изображения не отображаются на сайте:

1. **Проверьте права доступа:**
   ```bash
   chmod -R 755 /var/www/mlcrosoft.ru/public/uploads
   chown -R www-data:www-data /var/www/mlcrosoft.ru/public/uploads
   ```

2. **Проверьте, что файлы существуют:**
   ```bash
   ls -la /var/www/mlcrosoft.ru/public/uploads/covers/
   ```

3. **Проверьте настройки Nginx** - убедитесь, что секция `/uploads/` настроена правильно (см. выше)

4. **Проверьте логи Nginx:**
   ```bash
   sudo tail -f /var/log/nginx/error.log
   ```

5. **Используйте скрипт проверки:**
   ```bash
   npx tsx scripts/check-server-images.ts
   ```

6. **Проверьте URL изображений в БД:**
   ```bash
   # В SQLite
   sqlite3 prisma/dev.db "SELECT slug, coverImage FROM Post WHERE coverImage IS NOT NULL LIMIT 5;"
   ```

### Editor.js вечная загрузка

Если редактор показывает вечный спиннер:

1. **Проверьте консоль браузера** - могут быть ошибки загрузки скриптов
2. **Убедитесь, что все зависимости установлены:**
   ```bash
   npm install
   npm run build
   ```
3. **Проверьте, что Editor.js инициализируется** - проблема может быть в SSR/гидратации
4. **Очистите кеш браузера** и попробуйте в режиме инкогнито

### Обновление базы данных

```bash
# Создать новую миграцию локально
npx prisma migrate dev --name migration_name

# Применить на сервере
npx prisma migrate deploy
```

## Производительность

- **SQLite**: Подходит для небольших проектов (< 10k статей)
- **PostgreSQL**: Рекомендуется для продакшена
- **PM2 кластер**: Можно запустить несколько инстансов (`instances: 'max'`)

## Мониторинг

Установите PM2 Plus для мониторинга:
```bash
pm2 link [secret] [public]
```

Или используйте логи:
```bash
# Ротация логов
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
```
