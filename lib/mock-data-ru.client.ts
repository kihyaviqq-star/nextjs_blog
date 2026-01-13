// Клиентские функции для работы с постами через API
import { BlogPost } from "./types";

export async function getAllPosts(): Promise<BlogPost[]> {
  try {
    const response = await fetch('/api/posts');
    if (response.ok) {
      return await response.json();
    }
    return [];
  } catch (error) {
    console.error('[Client] Error fetching posts:', error);
    return [];
  }
}

export async function getPostBySlug(slug: string): Promise<BlogPost | undefined> {
  try {
    const response = await fetch(`/api/posts/${slug}`);
    if (response.ok) {
      return await response.json();
    }
    return undefined;
  } catch (error) {
    console.error('[Client] Error fetching post:', error);
    return undefined;
  }
}

export function getRelatedPosts(posts: BlogPost[], currentSlug: string, limit: number = 3): BlogPost[] {
  return posts.filter((post) => post.slug !== currentSlug).slice(0, limit);
}
