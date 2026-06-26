import fs from 'fs/promises';
import path from 'path';

export async function downloadImage(url: string, subfolder: string): Promise<string | null> {
  try {
    if (!url || !(url.startsWith('http://') || url.startsWith('https://'))) return null;

    // Защита от SSRF: базовая проверка, чтобы не качали с локалхоста
    try {
      const parsedUrl = new URL(url);
      const hostname = parsedUrl.hostname;
      if (
        hostname === 'localhost' || 
        hostname === '127.0.0.1' || 
        hostname === '::1' || 
        hostname.startsWith('192.168.') || 
        hostname.startsWith('10.')
      ) {
        console.warn(`SSRF attempt blocked: ${url}`);
        return null;
      }
    } catch {
      return null;
    }

    // Защита от DoS: Таймаут 10 секунд
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    clearTimeout(timeoutId);

    if (!response.ok) {
      console.warn(`Не удалось скачать картинку: ${url} (Status: ${response.status})`);
      return null;
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Определение расширения
    const contentType = response.headers.get('content-type');
    let ext = '.png'; // default
    if (contentType) {
      if (contentType.includes('jpeg') || contentType.includes('jpg')) ext = '.jpg';
      else if (contentType.includes('png')) ext = '.png';
      else if (contentType.includes('svg')) ext = '.svg';
      else if (contentType.includes('webp')) ext = '.webp';
      else if (contentType.includes('gif')) ext = '.gif';
      else if (contentType.includes('x-icon')) ext = '.ico';
    } else {
      // Попытка взять расширение из URL
      const urlPath = new URL(url).pathname;
      const urlExt = path.extname(urlPath);
      if (urlExt) ext = urlExt;
    }

    // Формируем имя и пути
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}${ext}`;
    const publicDir = path.join(process.cwd(), 'public');
    const uploadDir = path.join(publicDir, 'uploads', subfolder);

    await fs.mkdir(uploadDir, { recursive: true });

    const filePath = path.join(uploadDir, fileName);
    await fs.writeFile(filePath, buffer);

    // Возвращаем относительный URL
    return `/uploads/${subfolder}/${fileName}`;
  } catch (error) {
    console.error(`Ошибка при скачивании картинки ${url}:`, error);
    return null;
  }
}
