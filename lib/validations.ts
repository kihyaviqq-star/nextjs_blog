import { z } from 'zod';

/**
 * Editor.js Block Schema
 */
const editorBlockSchema = z.object({
  id: z.string().optional(),
  type: z.string().min(1, 'Block type is required'),
  data: z.any().optional(), // Editor.js data structure can vary by block type
}).passthrough(); // Allow additional fields

/**
 * Editor.js OutputData Schema
 */
const editorContentSchema = z.object({
  blocks: z.array(editorBlockSchema).min(1, 'Content must have at least one block').max(1000, 'Content cannot exceed 1000 blocks'),
  time: z.number().optional(),
  version: z.string().optional(),
});

/**
 * Post Creation/Update Schema
 */
export const createPostSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title must be at most 200 characters'),
  excerpt: z.string().min(1, 'Excerpt is required').max(500, 'Excerpt must be at most 500 characters'),
  slug: z.string()
    .min(1, 'Slug is required')
    .max(100, 'Slug must be at most 100 characters')
    .regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens')
    .optional(), // Опциональный, если не передан - будет сгенерирован из title
  content: editorContentSchema,
  tags: z.array(z.string().max(50, 'Each tag must be at most 50 characters')).max(3, 'Maximum 3 tags allowed'),
  sources: z.preprocess(
    (val) => {
      if (!val || !Array.isArray(val)) return undefined;
      // Фильтруем пустые строки
      const filtered = val.filter((url) => url && typeof url === 'string' && url.trim().length > 0);
      return filtered.length > 0 ? filtered : undefined;
    },
    z.array(z.string().url('Invalid source URL')).optional()
  ),
  coverImage: z.preprocess(
    (val) => {
      // Преобразуем все пустые значения в null
      if (val === null || val === undefined || val === "") {
        return null;
      }
      // Если это строка, обрезаем пробелы
      if (typeof val === 'string') {
        const trimmed = val.trim();
        return trimmed.length === 0 ? null : trimmed;
      }
      // Для всех остальных типов преобразуем в строку
      const stringVal = String(val).trim();
      return stringVal.length === 0 ? null : stringVal;
    },
    z.union([
      z.null(), // Проверяем null первым
      // Принимаем как абсолютные URL (http/https), так и относительные пути
      z.string().min(1).refine((val) => {
        // Если это абсолютный URL, проверяем формат
        if (val.startsWith('http://') || val.startsWith('https://')) {
          try {
            new URL(val);
            return true;
          } catch {
            return false;
          }
        }
        // Относительные пути (начинающиеся с /) тоже валидны
        if (val.startsWith('/')) {
          return true;
        }
        // Другие форматы не принимаем
        return false;
      }, {
        message: 'Invalid cover image URL'
      }),
    ]).optional()
  ),
});

export const updatePostSchema = createPostSchema.extend({
  slug: z.string()
    .min(1, 'Slug is required')
    .max(100, 'Slug must be at most 100 characters')
    .regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens')
    .optional(), // При обновлении slug опциональный (можно оставить текущий)
});

/**
 * RSS Source Schema
 */
export const createRSSSourceSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200, 'Name must be at most 200 characters').optional(),
  url: z.string().url('Invalid URL format').max(2048, 'URL must be at most 2048 characters'),
});

export const updateRSSSourceSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200, 'Name must be at most 200 characters').optional(),
  url: z.string().url('Invalid URL format').max(2048, 'URL must be at most 2048 characters').optional(),
  enabled: z.boolean().optional(),
});

/**
 * Maximum JSON body size (5MB)
 */
export const MAX_JSON_BODY_SIZE = 5 * 1024 * 1024; // 5MB

/**
 * Validate JSON body size
 */
export function validateBodySize(contentLength: string | null): { valid: boolean; error?: string } {
  if (!contentLength) {
    return { valid: true }; // Allow requests without content-length (chunked encoding)
  }

  const size = parseInt(contentLength, 10);
  if (isNaN(size)) {
    return { valid: false, error: 'Invalid Content-Length header' };
  }

  if (size > MAX_JSON_BODY_SIZE) {
    return { 
      valid: false, 
      error: `Request body too large. Maximum size is ${MAX_JSON_BODY_SIZE / 1024 / 1024}MB` 
    };
  }

  return { valid: true };
}

/**
 * Format Zod errors for API response
 */
export function formatZodError(error: z.ZodError): { message: string; errors: Array<{ field: string; message: string }> } {
  const issues = error.issues || error.errors || [];
  const errors = issues.map(err => ({
    field: err.path.join('.'),
    message: err.message,
  }));

  return {
    message: 'Validation failed',
    errors,
  };
}
