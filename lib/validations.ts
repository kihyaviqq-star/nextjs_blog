import { z } from 'zod';

/**
 * Editor.js strict block schemas
 */
const headerBlockSchema = z.object({
  id: z.string().optional(),
  type: z.literal('header'),
  data: z.object({
    text: z.string().min(1).max(1000),
    level: z.number().int().min(1).max(6),
  }).strict(),
}).strict();

const paragraphBlockSchema = z.object({
  id: z.string().optional(),
  type: z.literal('paragraph'),
  data: z.object({
    text: z.string().max(20000),
  }).strict(),
}).strict();

const listBlockSchema = z.object({
  id: z.string().optional(),
  type: z.literal('list'),
  data: z.object({
    style: z.enum(['ordered', 'unordered']),
    items: z.array(z.string().max(5000)).max(500),
  }).strict(),
}).strict();

const checklistBlockSchema = z.object({
  id: z.string().optional(),
  type: z.literal('checklist'),
  data: z.object({
    items: z.array(
      z.object({
        text: z.string().max(5000),
        checked: z.boolean(),
      }).strict()
    ).max(500),
  }).strict(),
}).strict();

const codeBlockSchema = z.object({
  id: z.string().optional(),
  type: z.literal('code'),
  data: z.object({
    code: z.string().max(100000),
  }).strict(),
}).strict();

const quoteBlockSchema = z.object({
  id: z.string().optional(),
  type: z.literal('quote'),
  data: z.object({
    text: z.string().min(1).max(10000),
    caption: z.string().max(500).optional(),
  }).strict(),
}).strict();

const warningBlockSchema = z.object({
  id: z.string().optional(),
  type: z.literal('warning'),
  data: z.object({
    title: z.string().max(300).optional(),
    message: z.string().max(5000).optional(),
  }).strict().refine((v) => Boolean(v.title || v.message), {
    message: 'Warning block requires title or message',
  }),
}).strict();

const delimiterBlockSchema = z.object({
  id: z.string().optional(),
  type: z.literal('delimiter'),
  data: z.object({}).strict().optional().default({}),
}).strict();

const tableBlockSchema = z.object({
  id: z.string().optional(),
  type: z.literal('table'),
  data: z.object({
    withHeadings: z.boolean().optional(),
    content: z.array(z.array(z.string().max(2000)).max(30)).max(200),
  }).strict(),
}).strict();

const imageBlockSchema = z.object({
  id: z.string().optional(),
  type: z.literal('image'),
  data: z.object({
    file: z.object({
      url: z.string().max(5000),
    }).strict().optional(),
    url: z.string().max(5000).optional(),
    caption: z.string().max(1000).optional(),
    withBorder: z.boolean().optional(),
    withBackground: z.boolean().optional(),
    stretched: z.boolean().optional(),
  }).strict().refine((v) => Boolean(v.file?.url || v.url), {
    message: 'Image block requires file.url or url',
  }),
}).strict();

const embedBlockSchema = z.object({
  id: z.string().optional(),
  type: z.literal('embed'),
  data: z.object({
    service: z.string().max(200).optional(),
    source: z.string().max(5000).optional(),
    embed: z.string().max(10000),
    width: z.number().int().positive().optional(),
    height: z.number().int().positive().optional(),
    caption: z.string().max(1000).optional(),
  }).strict(),
}).strict();

const linkToolBlockSchema = z.object({
  id: z.string().optional(),
  type: z.literal('linkTool'),
  data: z.object({
    link: z.string().max(5000),
    meta: z.object({
      title: z.string().max(500).optional(),
      description: z.string().max(5000).optional(),
      image: z.object({
        url: z.string().max(5000).optional(),
      }).strict().optional(),
    }).strict(),
  }).strict(),
}).strict();

const rawBlockSchema = z.object({
  id: z.string().optional(),
  type: z.literal('raw'),
  data: z.object({
    html: z.string().max(20000),
  }).strict(),
}).strict();

const editorBlockSchema = z.discriminatedUnion('type', [
  headerBlockSchema,
  paragraphBlockSchema,
  listBlockSchema,
  checklistBlockSchema,
  codeBlockSchema,
  quoteBlockSchema,
  warningBlockSchema,
  delimiterBlockSchema,
  tableBlockSchema,
  imageBlockSchema,
  embedBlockSchema,
  linkToolBlockSchema,
  rawBlockSchema,
]);

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
  const issues = error.issues;
  const errors = issues.map(err => ({
    field: err.path.join('.'),
    message: err.message,
  }));

  return {
    message: 'Validation failed',
    errors,
  };
}
