# Технический аудит проекта: тасклист

Дата аудита: 2026-04-03  
Проект: ai-aggregator-blog

## Прогресс исправлений (2026-04-03)

- Выполнено:
  - SSRF-hardening при скачивании image URL из генератора: allowlist хостов, запрет non-HTTPS, DNS/IP проверка, лимиты размера/типа, timeout.
  - Удалены PII из логов регистрации и смены ролей.
  - Усилены next/image и CSP в next.config.ts: убраны wildcard хосты и http для production, отключен dangerouslyAllowSVG, ужесточен CSP.
  - Отключен silent-пропуск TypeScript ошибок в build (ignoreBuildErrors: false).
  - Выполнен npm audit fix, обновлены уязвимые транзитивные зависимости, npm audit --omit=dev показывает 0 vulnerabilities.
  - Для dashboard proxy авторизация по ролям переведена на DB-backed проверку через /api/profile вместо trust к роли из JWT.
  - Добавлены unit-тесты для rate limiter (`lib/rate-limit.test.ts`), подтверждено поведение N/N+1 и TTL reset.
  - Валидация Editor.js payload ужесточена через strict discriminated union по поддерживаемым block.type.
  - Шум middleware-логов снижен: информационные логи редиректов оставлены только для development.
  - Оптимизирован GET /api/comments: пагинация root-комментариев и дозагрузка только их поддерева вместо полной выборки по посту.
  - Убран in-memory cache редиректов в middleware (используется прямой запрос), что устраняет несогласованность между инстансами.
## В работе
  - Нет открытых задач в рамках текущего audit-плана.

## Как читать документ
- [ ] задача не начата
- [~] задача в работе
- [x] задача выполнена

Приоритеты:
- P0 — критично (уязвимости/риски с высоким влиянием)
- P1 — высоко (значимые security/стабильность риски)
- P2 — средне (качество, масштабируемость, hardening)
- P3 — низко (улучшения/рефакторинг)

---

## P0 (критично)

- [x] Обновить уязвимые зависимости по результатам npm audit
  - Риск: критические и высокие CVE в production-зависимостях.
  - Подтверждение:
    - next: критические advisory (в том числе middleware/image/cache/smuggling/RCE классы).
    - undici/picomatch: high.
    - dompurify: moderate.
  - Файлы:
    - package.json (next ^15.1.3, isomorphic-dompurify ^2.35.0)
  - Что сделать:
    - Обновить next и транзитивные зависимости до безопасных версий.
    - Выполнить npm audit fix, затем точечный апдейт lockfile при необходимости.
    - Прогнать smoke + e2e для auth, middleware, next/image, API.
  - Критерий готовности:
    - npm audit --omit=dev не показывает critical/high уязвимостей.

- [x] Закрыть SSRF-поверхность при скачивании изображения в генераторе
  - Риск: сервер делает fetch по URL из ответа внешней AI-системы без SSRF-валидации.
  - Подтверждение:
    - app/dashboard/generator/actions.ts:257 (const response = await fetch(imageUrl);)
  - Что сделать:
    - Разрешить только HTTPS и allowlist хостов генерации изображений.
    - Добавить DNS/IP проверку (private/link-local/loopback), как в rss-finder.
    - Ограничить максимальный размер ответа и content-type (image/*).
    - Добавить timeout + abort + ограничение на редиректы.
  - Критерий готовности:
    - Попытки скачать localhost/127.0.0.1/10.0.0.0/8/169.254.* блокируются.

- [x] Усилить конфигурацию next/image и CSP
  - Риск: слишком широкие разрешения внешних изображений и небезопасные директивы CSP.
  - Подтверждение:
    - next.config.ts:18, 26 (hostname: '**', включая http)
    - next.config.ts:31 (dangerouslyAllowSVG: true)
    - next.config.ts:68 (script-src с unsafe-eval и unsafe-inline, connect-src включает http)
  - Что сделать:
    - Ограничить remotePatterns конкретными trusted-доменами.
    - Убрать http wildcard в production.
    - Отключить dangerouslyAllowSVG или внедрить строгую фильтрацию SVG + отдельный pipeline.
    - Пересобрать CSP без unsafe-eval/unsafe-inline (или минимизировать и документировать исключения).
  - Критерий готовности:
    - Нет wildcard-хостов для image, CSP проходит security review.

---

## P1 (высокий приоритет)

- [x] Исправить off-by-one в rate limiter
  - Риск: лимит фактически на 1 меньше ожидаемого; нестабильное поведение throttling.
  - Подтверждение:
    - lib/rate-limit.ts:25 (currentUsage >= limit)
  - Что сделать:
    - Изменить условие на currentUsage > limit.
    - Добавить unit-тесты для лимитов 1/5/10.
  - Критерий готовности:
    - Запрос №N проходит, №N+1 блокируется.

- [x] Унифицировать авторизацию: не доверять роли из session token в чувствительных местах
  - Риск: устаревшая роль в JWT/сессии может расходиться с БД.
  - Подтверждение:
    - app/api/users/route.ts:16 (role из session.user)
    - proxy.ts:5 (role из req.auth.user)
  - Что сделать:
    - Для API-эндпоинтов ролей всегда читать роль из БД.
    - Для middleware/proxy реализовать стратегию refresh/короткий TTL токена + валидацию по БД для критичных маршрутов.
  - Критерий готовности:
    - Смена роли в БД немедленно отражается в доступах на критичных маршрутах.

- [x] Закрыть утечки внутренних ошибок в API-ответах
  - Риск: клиент получает внутренние детали исключений.
  - Подтверждение:
    - app/api/posts/route.ts:237 (details: error.message)
    - app/api/comments/route.ts:140, 262 (details в development, разнородная практика)
  - Что сделать:
    - Стандартизировать через единый safe error contract.
    - В production возвращать только errorId + generic message.
    - Детали оставлять только в structured logs.
  - Критерий готовности:
    - Ни один production API-ответ не содержит stack/message внутренних исключений.

- [x] Добавить/усилить rate limiting для mutation endpoint-ов
  - Риск: спам/abuse на create/update/delete операциях.
  - Подтверждение:
    - Лимитер есть не везде; покрытие неравномерное по app/api.
  - Что сделать:
    - Добавить лимиты на POST/PUT/DELETE: posts, comments, profile/settings/users update-role, rss-sources/[id].
    - Ключ лимита: userId + IP (с нормализацией x-forwarded-for через trusted proxy).
  - Критерий готовности:
    - Для всех mutation endpoint-ов есть явный limiter и тесты на 429.

- [x] Убрать PII из логов
  - Риск: утечка персональных данных через application logs.
  - Подтверждение:
    - app/api/register/route.ts:111
    - app/api/users/update-role/route.ts:97
  - Что сделать:
    - Логировать userId/requestId вместо email.
    - Ввести policy по маскированию чувствительных полей.
  - Критерий готовности:
    - В логах нет email/персональных данных в открытом виде.

---

## P2 (средний приоритет)

- [x] Ограничить нагрузку в комментариях (пагинация/дерево)
  - Риск: GET comments загружает все комментарии поста, затем строит дерево в памяти; риск деградации и DoS на больших тредах.
  - Подтверждение:
    - app/api/comments/route.ts:81 (findMany всех комментариев)
    - app/api/comments/route.ts:63-64 (page/limit без строгой нормализации и cap)
  - Что сделать:
    - Ввести верхнюю границу limit (например, 50).
    - Делать пагинацию на уровне SQL только по root-комментариям + дозагрузка reply.
    - Добавить индексы/профилирование запросов.
  - Критерий готовности:
    - Время ответа стабильно при больших обсуждениях, память процесса не растет линейно.

- [x] Ужесточить валидацию Editor.js payload
  - Риск: z.any + passthrough пропускают произвольную структуру блока.
  - Подтверждение:
    - lib/validations.ts:9-10
  - Что сделать:
    - Ввести discriminated union по поддерживаемым block.type.
    - Для raw/embed ограничить поля и длины, отбрасывать лишние ключи.
  - Критерий готовности:
    - Невалидные/неожиданные блоки отклоняются на API.

- [x] Нормализовать SSRF-проверки в url-scraper
  - Риск: при DNS lookup ошибке есть warning и выполнение продолжается; поведение зависит от сетевой ошибки.
  - Подтверждение:
    - lib/url-scraper.ts:301-307
  - Что сделать:
    - Принцип fail-closed: если hostname не резолвится безопасно — блокировать запрос.
    - Поддержать IPv6 private ranges полноценно (по аналогии/переиспользованию логики из rss-finder).
  - Критерий готовности:
    - Неуспешный DNS lookup не приводит к fetch внешнего URL.

- [x] Запретить silent-пропуск TypeScript ошибок в build
  - Риск: production-сборка проходит с type-ошибками.
  - Подтверждение:
    - next.config.ts:6 (ignoreBuildErrors: true)
  - Что сделать:
    - Убрать ignoreBuildErrors.
    - Исправить выявленные type-ошибки и добавить CI check.
  - Критерий готовности:
    - next build падает при type-ошибках.

---

## P3 (низкий приоритет / улучшения)

- [x] Перевести in-memory middleware cache на shared-хранилище
  - Риск: при горизонтальном масштабировании кэш редиректов несогласован между инстансами.
  - Подтверждение:
    - middleware.ts:6
  - Что сделать:
    - Вынести кэш в Redis/Upstash или отказаться от кэша в middleware.
  - Критерий готовности:
    - Предсказуемое поведение редиректов на нескольких репликах.

- [x] Снизить шум логов middleware
  - Риск: высокий объем логов на каждый запрос.
  - Подтверждение:
    - middleware.ts:86, 90
  - Что сделать:
    - Логировать только ошибки/диагностику под debug flag.
  - Критерий готовности:
    - Существенное снижение количества логов без потери наблюдаемости.

---

## Отдельные заметки по качеству

- Линтер: без ошибок (npm run lint).
- Уязвимости зависимостей: после исправлений npm audit --omit=dev показывает 0 vulnerabilities.
- В проекте уже есть хорошие практики:
  - проверка ролей через БД в части endpoint-ов,
  - проверка magic numbers и размера файлов в upload API,
  - защита от traversal при удалении файлов,
  - частичная SSRF-защита в rss-finder.

---

## Рекомендуемый порядок выполнения

1. P0: зависимости, SSRF в генераторе, next/image + CSP.
2. P1: авторизация по роли, error contract, rate limiting coverage, PII-логи.
3. P2: performance комментариев, strict валидация editor payload, fail-closed DNS.
4. P3: middleware cache/log tuning.

---

## Шаблон для закрытия задачи

- PR: <ссылка>
- Измененные файлы: <список>
- Тесты: unit/integration/e2e
- Security-check: пройдено/не пройдено
- Риски регрессии: <кратко>
