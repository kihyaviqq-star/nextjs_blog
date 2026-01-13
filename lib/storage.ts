import fs from 'fs';
import path from 'path';
import { BlogPost } from './types';

const STORAGE_FILE = path.join(process.cwd(), 'data', 'posts.json');

// Инициализация хранилища
function ensureStorageExists() {
  const dir = path.dirname(STORAGE_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  if (!fs.existsSync(STORAGE_FILE)) {
    fs.writeFileSync(STORAGE_FILE, JSON.stringify([]), 'utf-8');
  }
}

// Чтение всех постов
export function readPosts(): BlogPost[] {
  try {
    ensureStorageExists();
    const data = fs.readFileSync(STORAGE_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('[Storage] Ошибка чтения:', error);
    return [];
  }
}

// Запись всех постов
export function writePosts(posts: BlogPost[]): boolean {
  try {
    ensureStorageExists();
    fs.writeFileSync(STORAGE_FILE, JSON.stringify(posts, null, 2), 'utf-8');
    console.log('[Storage] Данные сохранены успешно');
    return true;
  } catch (error) {
    console.error('[Storage] Ошибка записи:', error);
    return false;
  }
}

// Инициализация хранилища начальными данными
export function initializeStorage(initialPosts: BlogPost[]): boolean {
  try {
    const existingPosts = readPosts();
    
    // Если хранилище пустое, инициализируем начальными данными
    if (existingPosts.length === 0) {
      console.log('[Storage] Инициализация хранилища с', initialPosts.length, 'постами');
      return writePosts(initialPosts);
    }
    
    console.log('[Storage] Хранилище уже содержит', existingPosts.length, 'постов');
    return true;
  } catch (error) {
    console.error('[Storage] Ошибка инициализации:', error);
    return false;
  }
}

// Обновление одного поста
export function updateStoredPost(slug: string, updatedData: Partial<BlogPost>): BlogPost | null {
  try {
    const posts = readPosts();
    const index = posts.findIndex(post => post.slug === slug);
    
    if (index === -1) {
      console.log('[Storage] Пост не найден:', slug);
      return null;
    }
    
    console.log('[Storage] Обновление поста:', slug);
    posts[index] = {
      ...posts[index],
      ...updatedData,
      slug: posts[index].slug, // Сохраняем оригинальный slug
    };
    
    writePosts(posts);
    console.log('[Storage] Пост обновлен:', posts[index].title);
    return posts[index];
  } catch (error) {
    console.error('[Storage] Ошибка обновления поста:', error);
    return null;
  }
}

// Получение одного поста
export function getStoredPost(slug: string): BlogPost | null {
  try {
    const posts = readPosts();
    return posts.find(post => post.slug === slug) || null;
  } catch (error) {
    console.error('[Storage] Ошибка получения поста:', error);
    return null;
  }
}

// Удаление поста
export function deleteStoredPost(slug: string): boolean {
  try {
    const posts = readPosts();
    const filteredPosts = posts.filter(post => post.slug !== slug);
    
    if (filteredPosts.length === posts.length) {
      console.log('[Storage] Пост для удаления не найден:', slug);
      return false;
    }
    
    writePosts(filteredPosts);
    console.log('[Storage] Пост удален:', slug);
    return true;
  } catch (error) {
    console.error('[Storage] Ошибка удаления поста:', error);
    return false;
  }
}

// Добавление нового поста
export function addStoredPost(post: BlogPost): boolean {
  try {
    const posts = readPosts();
    
    // Проверка на дубликат slug
    if (posts.some(p => p.slug === post.slug)) {
      console.log('[Storage] Пост с таким slug уже существует:', post.slug);
      return false;
    }
    
    posts.unshift(post); // Добавляем в начало списка
    writePosts(posts);
    console.log('[Storage] Новый пост добавлен:', post.title);
    return true;
  } catch (error) {
    console.error('[Storage] Ошибка добавления поста:', error);
    return false;
  }
}
