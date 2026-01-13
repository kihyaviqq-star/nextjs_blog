# PostgreSQL Setup Guide

## Установка PostgreSQL

### Windows:
1. Скачайте PostgreSQL: https://www.postgresql.org/download/windows/
2. Установите с настройками по умолчанию
3. Запомните пароль для пользователя `postgres`

### MacOS:
```bash
brew install postgresql
brew services start postgresql
```

### Linux:
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

## Создание базы данных

```bash
# Подключитесь к PostgreSQL
psql -U postgres

# Создайте базу данных
CREATE DATABASE blog_db;

# Выйдите
\q
```

## Обновление .env

Обновите `DATABASE_URL` в файле `.env` с вашими данными:

```env
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/blog_db?schema=public"
```

## Применение миграции

```bash
# Применить схему к базе данных
npx prisma db push

# Заполнить начальными данными
npx prisma db seed
```

## Проверка

```bash
# Открыть Prisma Studio для просмотра данных
npx prisma studio
```

## Тестовые учетные данные

После выполнения seed:

- **Администратор:**
  - Email: `editor@ai-stat.ru`
  - Пароль: `editor123`
  - Role: `ADMIN`

- **Пользователь:**
  - Email: `user@ai-stat.ru`
  - Пароль: `user123`
  - Role: `USER`
