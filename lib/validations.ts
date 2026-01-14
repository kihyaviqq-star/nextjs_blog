import { z } from 'zod';

/**
 * Editor.js Block Schema
 */
const editorBlockSchema = z.object({
  id: z.string().optional(),
  type: z.string(),
  data: z.any(), // Editor.js data structure can vary by block type
});

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
  content: editorContentSchema,
  tags: z.array(z.string().max(50, 'Each tag must be at most 50 characters')).max(3, 'Maximum 3 tags allowed'),
  sources: z.array(z.string().url('Invalid source URL')).optional(),
  coverImage: z.string().url('Invalid cover image URL').nullable().optional(),
});

export const updatePostSchema = createPostSchema;

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
    return { valid: false, error: 'Content-Length header is required' };
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
  const errors = error.errors.map(err => ({
    field: err.path.join('.'),
    message: err.message,
  }));

  return {
    message: 'Validation failed',
    errors,
  };
}
