# Настройка таймаутов на сервере для AI-парсинга

Если AI-парсинг работает локально, но не работает на сервере (таймаут), нужно настроить лимиты выполнения на сервере.

## 1. Next.js конфигурация (уже настроено)

В `app/dashboard/generator/layout.tsx` уже добавлено:
```typescript
export const maxDuration = 300; // 5 минут
export const dynamic = 'force-dynamic';
```

**Важно:** `maxDuration` НЕ должен экспортироваться из файлов с `'use server'` (например, `actions.ts`), так как это вызовет ошибку билда в Next.js 15. Он должен быть только в `layout.tsx` или `page.tsx` (Server Components).

## 2. Настройка Nginx (КРИТИЧНО для продакшн сервера!) ⚠️

**ЭТО САМАЯ ВАЖНАЯ НАСТРОЙКА!** 

Nginx по умолчанию имеет лимит **60 секунд**, а AI-парсинг может занимать **100+ секунд**. Это вызывает ошибку **504 Gateway Timeout**.

Если на сервере используется Nginx как reverse proxy, **обязательно** нужно увеличить таймауты.

**Как найти конфиг Nginx на вашем сервере:**
```bash
# 1. Найдите конфиг для вашего домена
ls -la /etc/nginx/sites-available/
ls -la /etc/nginx/sites-enabled/

# 2. Или поищите по имени домена
grep -r "mlcrosoft.ru" /etc/nginx/  # Замените на ваш домен

# 3. Обычно это файл вида:
# /etc/nginx/sites-available/mlcrosoft.ru
# /etc/nginx/sites-available/default
```

**Файл: `/etc/nginx/sites-available/your-domain` или `/etc/nginx/nginx.conf`**

**ВАЖНО:** Отредактируйте ваш конфиг Nginx и добавьте/замените блок `location /`:

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name mlcrosoft.ru www.mlcrosoft.ru;  # Замените на ваш домен
    
    # ... другие настройки (SSL, root, и т.д.) ...
    
    location / {
        proxy_pass http://localhost:3000;  # Или другой порт, где работает Next.js
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # КРИТИЧНО: Увеличиваем таймауты для длительных запросов
        # По умолчанию Nginx имеет лимит 60 секунд, увеличиваем до 600 секунд (10 минут)
        proxy_connect_timeout 600s;
        proxy_send_timeout 600s;
        proxy_read_timeout 600s;
        send_timeout 600s;
        
        # Увеличиваем размер буфера
        proxy_buffer_size 128k;
        proxy_buffers 4 256k;
        proxy_busy_buffers_size 256k;
        
        # Отключаем буферизацию для длительных запросов (важно для AI операций)
        proxy_buffering off;
        proxy_request_buffering off;
    }
    
    # Специальные настройки для API и dashboard (где происходят длительные операции)
    location ~ ^/(api|dashboard) {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        
        # Увеличенные таймауты для API/dashboard
        proxy_connect_timeout 600s;
        proxy_send_timeout 600s;
        proxy_read_timeout 600s;
        send_timeout 600s;
        
        proxy_buffering off;
        proxy_request_buffering off;
    }
}
```

**После изменений:**
```bash
# 1. ВАЖНО: Сначала проверьте конфигурацию (если ошибка, Nginx не запустится!)
sudo nginx -t

# 2. Если проверка прошла успешно ("syntax is ok", "test is successful"), примените изменения
sudo systemctl reload nginx
# или
sudo nginx -s reload

# 3. Проверьте, что Nginx работает
sudo systemctl status nginx

# 4. Проверьте логи на наличие ошибок
sudo tail -f /var/log/nginx/error.log
```

**Пример готового конфига также есть в файле `nginx-timeout-fix.conf` в корне проекта.**

## 3. Настройка PM2 (если используется)

Если приложение запущено через PM2, проверьте настройки:

**Файл: `ecosystem.config.js` или `package.json`**

```javascript
module.exports = {
  apps: [{
    name: 'blog',
    script: 'npm',
    args: 'start',
    exec_mode: 'fork',
    instances: 1,
    max_memory_restart: '1G',
    // Увеличиваем лимит времени для graceful shutdown
    kill_timeout: 5000,
    wait_ready: true,
    listen_timeout: 10000,
  }]
};
```

## 4. Настройка systemd (если используется как сервис)

**Файл: `/etc/systemd/system/nextjs-blog.service`**

```ini
[Unit]
Description=Next.js Blog
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/path/to/blog
Environment=NODE_ENV=production
ExecStart=/usr/bin/npm start
Restart=on-failure
RestartSec=10

# Увеличиваем таймауты
TimeoutStartSec=0
TimeoutStopSec=300

[Install]
WantedBy=multi-user.target
```

После изменений:
```bash
sudo systemctl daemon-reload
sudo systemctl restart nextjs-blog
```

## 5. Проверка логов на сервере

Для диагностики проблем проверьте логи:

```bash
# PM2 логи
pm2 logs blog

# systemd логи
journalctl -u nextjs-blog -f

# Nginx логи
tail -f /var/log/nginx/error.log
tail -f /var/log/nginx/access.log

# Node.js логи (если запущен напрямую)
# Логи будут в консоли, где запущен процесс
```

## 6. Переменные окружения

Убедитесь, что на сервере установлены необходимые переменные:

```bash
# .env файл или переменные окружения
OPENROUTER_API_KEY=your_key_here
USE_AI_PARSING=true  # По умолчанию true, можно отключить при проблемах
```

## 7. Тестирование таймаутов

После настройки проверьте, что таймауты работают:

1. Попробуйте спарсить URL через `/dashboard/generator`
2. Проверьте логи сервера на наличие ошибок таймаута
3. Если проблема остается, попробуйте:
   - Отключить AI-парсинг: `USE_AI_PARSING=false` в `.env`
   - Использовать только традиционный парсинг (быстрее, но менее точный)

## Альтернативное решение: фоновые задачи

Если таймауты все равно не помогают, можно реализовать асинхронную обработку:

1. Сервер Action сразу возвращает статус "В обработке"
2. Парсинг выполняется в фоне (через очередь или воркер)
3. Клиент периодически проверяет статус через polling или WebSocket
4. Когда готово, результат сохраняется в БД и отображается пользователю

Это требует дополнительной разработки, но дает лучший UX для длительных операций.
