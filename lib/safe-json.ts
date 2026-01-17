/**
 * Safe JSON parsing utilities to prevent DoS attacks
 * and handle malformed JSON gracefully
 */

/**
 * Safely parses a JSON string with error handling
 * @param jsonString - JSON string to parse
 * @param fallback - Fallback value if parsing fails (default: null)
 * @returns Parsed object or fallback value
 */
export function safeJsonParse<T = any>(jsonString: string | null | undefined, fallback: T | null = null): T | null {
  if (!jsonString || typeof jsonString !== 'string') {
    return fallback;
  }

  try {
    // Validate string length to prevent DoS via extremely long strings
    const MAX_JSON_LENGTH = 10 * 1024 * 1024; // 10MB limit
    if (jsonString.length > MAX_JSON_LENGTH) {
      console.warn('[safeJsonParse] JSON string too long:', jsonString.length, 'bytes');
      return fallback;
    }

    const parsed = JSON.parse(jsonString);
    return parsed as T;
  } catch (error) {
    console.error('[safeJsonParse] Error parsing JSON:', error instanceof Error ? error.message : String(error));
    return fallback;
  }
}

/**
 * Safely parses a JSON string that should be an array
 * @param jsonString - JSON string to parse
 * @param fallback - Fallback array if parsing fails (default: [])
 * @returns Parsed array or fallback array
 */
export function safeJsonParseArray<T = any>(jsonString: string | null | undefined, fallback: T[] = []): T[] {
  const parsed = safeJsonParse<T[]>(jsonString, fallback);
  
  // Ensure the result is an array
  if (!Array.isArray(parsed)) {
    console.warn('[safeJsonParseArray] Parsed value is not an array:', typeof parsed);
    return fallback;
  }

  return parsed;
}

/**
 * Safely parses a JSON string that should be an object
 * @param jsonString - JSON string to parse
 * @param fallback - Fallback object if parsing fails (default: {})
 * @returns Parsed object or fallback object
 */
export function safeJsonParseObject<T extends Record<string, any> = Record<string, any>>(
  jsonString: string | null | undefined,
  fallback: T = {} as T
): T {
  const parsed = safeJsonParse<T>(jsonString, fallback);
  
  // Ensure the result is an object
  if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
    console.warn('[safeJsonParseObject] Parsed value is not an object:', typeof parsed);
    return fallback;
  }

  return parsed;
}
