import { unlink } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';

/**
 * Удаляет файл из файловой системы, если он находится в /uploads
 * @param filePath - Путь к файлу (может быть абсолютным URL или относительным путем)
 * @returns true если файл удален, false если не найден или не в /uploads
 */
export async function deleteUploadedFile(filePath: string | null | undefined): Promise<boolean> {
  if (!filePath) return false;

  try {
    // Извлекаем путь из URL или используем как есть
    let relativePath = filePath;
    
    // Если это абсолютный URL, извлекаем путь
    if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
      try {
        const url = new URL(filePath);
        relativePath = url.pathname;
      } catch {
        // Не валидный URL, пропускаем
        return false;
      }
    }

    // Убеждаемся, что путь начинается с /uploads
    if (!relativePath.startsWith('/uploads/')) {
      // Это внешний файл, не удаляем
      return false;
    }

    // Безопасность: убеждаемся, что путь не содержит .. (защита от directory traversal)
    if (relativePath.includes('..')) {
      console.warn(`[deleteUploadedFile] Dangerous path detected: ${relativePath}`);
      return false;
    }

    // Формируем полный путь к файлу
    const fullPath = join(process.cwd(), 'public', relativePath);

    // Проверяем существование файла
    if (!existsSync(fullPath)) {
      console.log(`[deleteUploadedFile] File not found: ${fullPath}`);
      return false;
    }

    // Удаляем файл
    await unlink(fullPath);
    console.log(`[deleteUploadedFile] Deleted: ${fullPath}`);
    return true;
  } catch (error: any) {
    // Логируем ошибку, но не прерываем выполнение
    console.error(`[deleteUploadedFile] Error deleting ${filePath}:`, error?.message || error);
    return false;
  }
}

/**
 * Извлекает пути к изображениям из контента Editor.js
 * @param content - JSON строка или объект с контентом Editor.js
 * @returns Массив путей к изображениям
 */
export function extractImageUrlsFromContent(content: string | any): string[] {
  const imageUrls: string[] = [];

  try {
    // Парсим JSON, если это строка
    let contentData: any;
    if (typeof content === 'string') {
      contentData = JSON.parse(content);
    } else {
      contentData = content;
    }

    // Извлекаем блоки
    const blocks = contentData?.blocks || (Array.isArray(contentData) ? contentData : []);

    // Ищем блоки типа "image"
    for (const block of blocks) {
      if (block && block.type === 'image' && block.data) {
        const imageData = block.data;
        // Editor.js может хранить URL в разных местах
        const url = imageData.file?.url || imageData.url;
        if (url && typeof url === 'string') {
          imageUrls.push(url);
        }
      }
    }
  } catch (error) {
    console.error('[extractImageUrlsFromContent] Error parsing content:', error);
  }

  return imageUrls;
}

/**
 * Удаляет все файлы, связанные со статьей (coverImage и изображения в контенте)
 * @param post - Объект поста с coverImage и content
 * @returns Количество удаленных файлов
 */
export async function deletePostFiles(post: { coverImage?: string | null; content: string | any }): Promise<number> {
  let deletedCount = 0;

  // Удаляем cover image
  if (post.coverImage) {
    const deleted = await deleteUploadedFile(post.coverImage);
    if (deleted) deletedCount++;
  }

  // Извлекаем и удаляем изображения из контента
  const imageUrls = extractImageUrlsFromContent(post.content);
  for (const imageUrl of imageUrls) {
    const deleted = await deleteUploadedFile(imageUrl);
    if (deleted) deletedCount++;
  }

  return deletedCount;
}

/**
 * Удаляет изображения комментария
 * @param comment - Объект комментария с imageUrl
 * @returns true если файл удален
 */
export async function deleteCommentImage(comment: { imageUrl?: string | null }): Promise<boolean> {
  if (!comment.imageUrl) return false;
  return await deleteUploadedFile(comment.imageUrl);
}
