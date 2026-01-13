export interface EditorBlock {
  id?: string;
  type: string;
  data: any;
}

export interface EditorData {
  time?: number;
  blocks: EditorBlock[];
  version?: string;
}

export interface Author {
  id: string;
  name: string;
  slug: string;
  avatar: string;
  bio: string;
  title: string;
  email: string;
  social: {
    linkedin?: string;
    twitter?: string;
    github?: string;
    website?: string;
  };
  expertise: string[];
}

export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  author: Author;
  coverImage: string;
  publishedAt: string;
  readTime: string;
  tags: string[];
  content: EditorData;
  views?: number;
}
