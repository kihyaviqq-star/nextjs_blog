# Настройка таймаутов на сервере для AI-парсинга

Если AI-парсинг работает локально, но не работает на сервере (таймаут), нужно настроить лимиты выполнения на сервере.

## 1. Next.js конфигурация (уже настроено)

В `app/dashboard/generator/actions.ts` и `app/dashboard/generator/page.tsx` уже добавлено:
```typescript
export const maxDuration = 120; // 2 минуты
```

## 2. Настройка Nginx (если используется)

Если на сервере используется Nginx как reverse proxy, нужно увеличить таймауты:

**Файл: `/etc/nginx/sites-available/your-site` или `/etc/nginx/nginx.conf`**

```nginx
server {
    # ... другие настройки ...
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        
        # Увеличиваем таймауты для длительных запросов
        proxy_connect_timeout 300s;
        proxy_send_timeout 300s;
        proxy_read_timeout 300s;
        send_timeout 300s;
        
        # Увеличиваем размер буфера
        proxy_buffer_size 128k;
        proxy_buffers 4 256k;
        proxy_busy_buffers_size 256k;
    }
}
```

После изменений:
```bash
sudo nginx -t  # Проверить конфигурацию
sudo systemctl reload nginx  # Применить изменения
```

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
