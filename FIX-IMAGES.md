# Исправление проблем с изображениями и Editor.js

## Проблема 1: Изображения статей не отображаются

### Быстрое решение:

1. **Настройте Nginx для отдачи статических файлов:**

Отредактируйте конфигурацию Nginx:
```bash
sudo nano /etc/nginx/sites-available/mlcrosoft.ru
```

Добавьте **ДО** секции `location /`:
```nginx
# Статические файлы из /uploads отдаются напрямую
location /uploads/ {
    alias /var/www/mlcrosoft.ru/public/uploads/;
    expires 30d;
    add_header Cache-Control "public, immutable";
    access_log off;
}
```

2. **Исправьте права доступа:**

```bash
cd /var/www/mlcrosoft.ru
chmod -R 755 public/uploads
chown -R www-data:www-data public/uploads
```

Или используйте скрипт:
```bash
chmod +x scripts/fix-uploads-permissions.sh
sudo ./scripts/fix-uploads-permissions.sh
```

3. **Перезагрузите Nginx:**

```bash
sudo nginx -t  # Проверка конфигурации
sudo systemctl reload nginx
```

4. **Проверьте изображения:**

```bash
# Проверьте, что файлы существуют
ls -la /var/www/mlcrosoft.ru/public/uploads/covers/

# Проверьте через скрипт
npx tsx scripts/check-server-images.ts

# Проверьте доступность через curl
curl -I http://localhost/uploads/covers/имя-файла.jpg
```

5. **Перезапустите приложение:**

```bash
pm2 restart blog
```

## Проблема 2: Editor.js показывает вечную загрузку

### Причины и решения:

1. **Проблема с инициализацией Editor.js**

Editor.js требует клиентского рендеринга. Проверьте:
- Откройте консоль браузера (F12)
- Проверьте наличие ошибок JavaScript
- Убедитесь, что Editor.js инициализируется правильно

2. **Проблема с данными контента**

Проверьте, что данные статьи валидны:
```bash
# Проверить содержимое статьи в БД
sqlite3 prisma/dev.db "SELECT slug, substr(content, 1, 200) FROM Post WHERE slug='ваш-slug';"
```

3. **Очистите кеш браузера и перезагрузите страницу**

4. **Проверьте Network tab в DevTools:**
   - Убедитесь, что все скрипты Editor.js загружаются
   - Проверьте, нет ли ошибок 404 для ресурсов Editor.js

## Диагностика

### Проверка доступности изображений:

```bash
# Проверить конкретное изображение
curl -I http://mlcrosoft.ru/uploads/covers/имя-файла.jpg

# Должен вернуть 200 OK
```

### Проверка прав доступа:

```bash
# Проверить права
ls -la /var/www/mlcrosoft.ru/public/uploads/covers/

# Должно быть:
# drwxr-xr-x  www-data www-data  ...
# -rw-r--r--  www-data www-data  ... (файлы)
```

### Проверка логов:

```bash
# Логи Nginx
sudo tail -f /var/log/nginx/error.log

# Логи приложения
pm2 logs blog --lines 50

# При загрузке страницы смотрите, есть ли ошибки 404 для /uploads/*
```

## Частые проблемы

### 1. 404 Not Found для /uploads/...

**Решение:** Nginx не настроен для отдачи статических файлов. См. шаг 1 выше.

### 2. 403 Forbidden для /uploads/...

**Решение:** Неправильные права доступа. Используйте скрипт исправления прав.

### 3. Изображение загружается, но не отображается

**Решение:** Проблема с Next.js Image оптимизацией. В коде уже добавлен `unoptimized={true}` для локальных файлов.

### 4. Editor.js не загружается

**Решение:** 
- Проверьте консоль браузера на ошибки
- Убедитесь, что все зависимости установлены (`npm install`)
- Попробуйте пересобрать проект (`npm run build`)

## После исправлений

1. Очистите кеш браузера
2. Проверьте страницу в режиме инкогнито
3. Проверьте консоль браузера на ошибки
4. Проверьте Network tab - все ли ресурсы загружаются
