/**
 * Error handler utility for API routes
 * Hides detailed error messages in production
 */

export function handleApiError(error: unknown, context: string): { message: string; status: number } {
  const isProduction = process.env.NODE_ENV === 'production';
  
  // Log detailed error (always)
  if (error instanceof Error) {
    console.error(`[${context}] Error:`, error.message);
    console.error(`[${context}] Stack:`, error.stack);
  } else {
    console.error(`[${context}] Error:`, error);
  }

  // Return safe message for production
  if (isProduction) {
    return {
      message: 'Internal Server Error',
      status: 500
    };
  }

  // Return detailed error for development
  return {
    message: error instanceof Error ? error.message : 'An unknown error occurred',
    status: 500
  };
}
