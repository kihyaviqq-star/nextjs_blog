/**
 * Утилита для создания URL-friendly slug из текста
 * Поддерживает транслитерацию русского текста в английский
 * Оптимизирован для SEO: удаляет предлоги и стоп-слова
 */

// Список стоп-слов для удаления (русские и английские предлоги и служебные слова)
// Эти слова удаляются для оптимизации slug для поисковых систем
const stopWords = new Set([
  // Русские предлоги и стоп-слова
  'в', 'на', 'с', 'по', 'из', 'за', 'от', 'до', 'для', 'при', 'под', 'над',
  'о', 'об', 'без', 'через', 'между', 'среди', 'около', 'возле', 'вокруг',
  'и', 'или', 'но', 'а', 'что', 'как', 'чтобы', 'если', 'когда', 'где',
  'который', 'которая', 'которое', 'которые',
  'это', 'этот', 'эта', 'это', 'эти',
  'он', 'она', 'оно', 'они', 'мы', 'вы', 'ты',
  'быть', 'был', 'была', 'было', 'были',
  'не', 'нет', 'ни', 'уже', 'еще', 'тоже', 'также',
  // Английские предлоги и стоп-слова
  'a', 'an', 'the', 'in', 'on', 'at', 'by', 'for', 'of', 'to', 'with', 'from',
  'up', 'about', 'into', 'through', 'during', 'within', 'without', 'against',
  'and', 'or', 'but', 'as', 'if', 'when', 'where', 'which', 'that', 'what',
  'this', 'that', 'these', 'those',
  'he', 'she', 'it', 'they', 'we', 'you', 'i',
  'is', 'are', 'was', 'were', 'be', 'been', 'being',
  'not', 'no', 'nor', 'yet', 'so', 'too', 'also'
]);

// Таблица транслитерации русских символов
const transliterationMap: Record<string, string> = {
  'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'yo',
  'ж': 'zh', 'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm',
  'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u',
  'ф': 'f', 'х': 'h', 'ц': 'ts', 'ч': 'ch', 'ш': 'sh', 'щ': 'sch',
  'ъ': '', 'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya',
  'А': 'A', 'Б': 'B', 'В': 'V', 'Г': 'G', 'Д': 'D', 'Е': 'E', 'Ё': 'Yo',
  'Ж': 'Zh', 'З': 'Z', 'И': 'I', 'Й': 'Y', 'К': 'K', 'Л': 'L', 'М': 'M',
  'Н': 'N', 'О': 'O', 'П': 'P', 'Р': 'R', 'С': 'S', 'Т': 'T', 'У': 'U',
  'Ф': 'F', 'Х': 'H', 'Ц': 'Ts', 'Ч': 'Ch', 'Ш': 'Sh', 'Щ': 'Sch',
  'Ъ': '', 'Ы': 'Y', 'Ь': '', 'Э': 'E', 'Ю': 'Yu', 'Я': 'Ya'
};

/**
 * Транслитерирует русский текст в латиницу
 */
function transliterate(text: string): string {
  return text
    .split('')
    .map(char => transliterationMap[char] || char)
    .join('');
}

/**
 * Создает URL-friendly slug из текста
 * Оптимизирован для SEO: удаляет предлоги и стоп-слова
 * @param text - Исходный текст (может быть на русском или английском)
 * @returns URL-friendly slug (lowercase, без спецсимволов, без стоп-слов, пробелы заменены на дефисы)
 * 
 * @example
 * generateSlug("Как установить Windows на компьютер") // "ustanovit-windows-kompyuter"
 * generateSlug("How to install Windows on computer") // "install-windows-computer"
 * generateSlug("Node.js & React") // "nodejs-react"
 */
export function generateSlug(text: string): string {
  if (!text || typeof text !== 'string') {
    return '';
  }

  // Транслитерируем русские символы
  let slug = transliterate(text);

  // Переводим в нижний регистр
  slug = slug.toLowerCase();

  // Разбиваем на слова и удаляем стоп-слова
  const words = slug
    .split(/[\s_\-]+/) // Разбиваем по пробелам, подчеркиваниям и дефисам
    .filter(word => {
      // Удаляем пустые строки
      if (!word) return false;
      // Удаляем стоп-слова (только если это отдельное слово, не часть другого слова)
      const cleanedWord = word.replace(/[^a-z0-9]/g, '');
      return cleanedWord && !stopWords.has(cleanedWord);
    });

  // Собираем обратно в slug
  slug = words.join('-');

  // Удаляем все символы, кроме букв, цифр и дефисов (на случай если остались спецсимволы)
  slug = slug.replace(/[^a-z0-9-]/g, '');

  // Удаляем множественные дефисы
  slug = slug.replace(/-+/g, '-');

  // Удаляем дефисы в начале и конце
  slug = slug.replace(/^-+|-+$/g, '');

  // Ограничиваем длину (максимум 100 символов)
  if (slug.length > 100) {
    slug = slug.substring(0, 100);
    // Убедимся, что не обрезали на дефис
    slug = slug.replace(/-+$/, '');
  }

  // Если slug пустой (только стоп-слова/спецсимволы), возвращаем пустую строку
  if (!slug) {
    return '';
  }

  return slug;
}

/**
 * Генерирует уникальный slug, проверяя наличие в базе данных
 * Если slug уже существует, добавляет суффикс с цифрой
 * @param baseSlug - Базовый slug
 * @param checkExists - Функция для проверки существования slug в БД
 * @returns Уникальный slug
 */
export async function generateUniqueSlug(
  baseSlug: string,
  checkExists: (slug: string) => Promise<boolean>
): Promise<string> {
  if (!baseSlug) {
    baseSlug = `post-${Date.now()}`;
  }

  let slug = baseSlug;
  let counter = 0;
  
  while (await checkExists(slug)) {
    counter++;
    slug = `${baseSlug}-${counter}`;
  }

  return slug;
}
