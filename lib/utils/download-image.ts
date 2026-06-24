import fs from 'fs/promises';
import path from 'path';

export async function downloadImage(url: string, subfolder: string): Promise<string | null> {
  try {
    if (!url || !url.startsWith('http')) return null;

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
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
