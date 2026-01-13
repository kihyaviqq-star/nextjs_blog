/**
 * Утилиты для генерации и валидации username
 */

/**
 * Генерирует уникальный username из email
 * @param email - Email пользователя
 * @returns Сгенерированный username (lowercase)
 * @example
 * generateUsernameFromEmail("user.name@gmail.com")
 * // Returns: "username-a7b2"
 */
export function generateUsernameFromEmail(email: string): string {
  // Берем часть до @
  const localPart = email.split('@')[0];
  
  // Убираем спецсимволы, оставляем только a-z, 0-9
  const cleanedPart = localPart
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
  
  // Генерируем 4 случайных символа
  const randomSuffix = generateRandomString(4);
  
  // Формируем финальный username
  const username = `${cleanedPart}-${randomSuffix}`;
  
  return username;
}

/**
 * Генерирует случайную строку из букв и цифр
 * @param length - Длина строки
 * @returns Случайная строка
 */
function generateRandomString(length: number): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * chars.length);
    result += chars[randomIndex];
  }
  
  return result;
}

/**
 * Проверяет, занят ли username (для использования при генерации)
 * @param username - Username для проверки
 * @param checkFn - Функция проверки существования в БД
 * @returns true если занят, false если свободен
 */
export async function isUsernameTaken(
  username: string,
  checkFn: (username: string) => Promise<boolean>
): Promise<boolean> {
  return await checkFn(username);
}

/**
 * Генерирует уникальный username с проверкой в БД
 * @param email - Email пользователя
 * @param checkFn - Функция проверки существования username в БД
 * @param maxAttempts - Максимальное количество попыток генерации
 * @returns Уникальный username
 * @throws Error если не удалось сгенерировать уникальный username
 */
export async function generateUniqueUsername(
  email: string,
  checkFn: (username: string) => Promise<boolean>,
  maxAttempts: number = 10
): Promise<string> {
  let attempts = 0;
  
  while (attempts < maxAttempts) {
    const username = generateUsernameFromEmail(email);
    const isTaken = await checkFn(username);
    
    if (!isTaken) {
      return username;
    }
    
    attempts++;
  }
  
  // Если не удалось за maxAttempts попыток, добавляем timestamp
  const timestamp = Date.now().toString().slice(-6);
  const localPart = email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
  return `${localPart}-${timestamp}`;
}
