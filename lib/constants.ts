/**
 * Reserved Usernames - System Route Protection
 * 
 * This list prevents users from registering usernames that conflict with:
 * - System routes (admin, settings, auth)
 * - API endpoints
 * - Static files (favicon, robots, sitemap)
 * - Common system keywords
 */

export const RESERVED_USERNAMES = [
  // System Pages
  "admin",
  "settings",
  "login",
  "signin",
  "signup",
  "register",
  "logout",
  "signout",
  "auth",
  "authentication",
  "dashboard",
  "profile",
  "account",
  
  // API & Routes
  "api",
  "apis",
  "_next",
  "static",
  "public",
  "assets",
  "uploads",
  "files",
  "images",
  "media",
  
  // Blog & Content
  "blog",
  "post",
  "posts",
  "article",
  "articles",
  "author",
  "authors",
  "editor",
  "write",
  "create",
  "edit",
  "delete",
  "update",
  
  // User Management
  "user",
  "users",
  "u",
  "member",
  "members",
  "team",
  
  // Static Files
  "favicon",
  "favicon.ico",
  "robots",
  "robots.txt",
  "sitemap",
  "sitemap.xml",
  "manifest",
  "manifest.json",
  
  // Common Keywords
  "about",
  "contact",
  "help",
  "support",
  "terms",
  "privacy",
  "policy",
  "legal",
  "dmca",
  "copyright",
  
  // System Keywords
  "root",
  "administrator",
  "moderator",
  "mod",
  "system",
  "official",
  "staff",
  "service",
  
  // Security
  "security",
  "abuse",
  "spam",
  "phishing",
  "scam",
  
  // Technical
  "www",
  "ftp",
  "smtp",
  "mail",
  "email",
  "webmail",
  "status",
  "health",
  "ping",
  "test",
  
  // File Extensions (to prevent conflicts)
  "js",
  "css",
  "json",
  "xml",
  "html",
  "txt",
  "pdf",
  "png",
  "jpg",
  "jpeg",
  "gif",
  "svg",
  "webp",
  "ico",
  "woff",
  "woff2",
  "ttf",
  "eot",
];

/**
 * Check if username is reserved
 * @param username - Username to check (case-insensitive)
 * @returns true if username is reserved, false otherwise
 */
export function isUsernameReserved(username: string): boolean {
  if (!username) return true;
  
  const normalized = username.toLowerCase().trim();
  
  // Check exact matches
  if (RESERVED_USERNAMES.includes(normalized)) {
    return true;
  }
  
  // Check if starts with underscore or hyphen (reserved pattern)
  if (normalized.startsWith("_") || normalized.startsWith("-")) {
    return true;
  }
  
  // Check if ends with certain extensions
  const fileExtensions = [".ico", ".txt", ".xml", ".json", ".html", ".js", ".css"];
  if (fileExtensions.some(ext => normalized.endsWith(ext))) {
    return true;
  }
  
  return false;
}

/**
 * Validate username format
 * @param username - Username to validate
 * @returns object with valid flag and optional error message
 */
export function validateUsername(username: string): {
  valid: boolean;
  error?: string;
} {
  if (!username) {
    return { valid: false, error: "Имя пользователя обязательно" };
  }
  
  const normalized = username.trim();
  
  // Length check
  if (normalized.length < 3) {
    return { valid: false, error: "Имя пользователя должно содержать минимум 3 символа" };
  }
  
  if (normalized.length > 30) {
    return { valid: false, error: "Имя пользователя не может быть длиннее 30 символов" };
  }
  
  // Format check (alphanumeric, underscore, hyphen only)
  const validPattern = /^[a-zA-Z0-9_-]+$/;
  if (!validPattern.test(normalized)) {
    return { 
      valid: false, 
      error: "Имя пользователя может содержать только буквы, цифры, дефис и подчеркивание" 
    };
  }
  
  // Must start with letter or number
  const startsWithLetterOrNumber = /^[a-zA-Z0-9]/;
  if (!startsWithLetterOrNumber.test(normalized)) {
    return { 
      valid: false, 
      error: "Имя пользователя должно начинаться с буквы или цифры" 
    };
  }
  
  // Check reserved
  if (isUsernameReserved(normalized)) {
    return { valid: false, error: "Этот никнейм зарезервирован системой" };
  }
  
  return { valid: true };
}

/**
 * Generate username slug from name
 * @param name - User's display name
 * @returns URL-safe username slug
 */
export function generateUsernameSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-") // Replace spaces with hyphens
    .replace(/[^a-z0-9-_]/g, "") // Remove special characters
    .replace(/-+/g, "-") // Replace multiple hyphens with single
    .replace(/^-|-$/g, ""); // Remove leading/trailing hyphens
}
