import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/header";
import { SearchFilterBar } from "@/components/search-filter-bar";
import { SpotlightCard } from "@/components/ui/spotlight-card";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Clock, Tag, ChevronLeft, ChevronRight } from "lucide-react";
import { prisma } from "@/lib/prisma";

const POSTS_PER_PAGE = 9;

interface HomeProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function Home({ searchParams }: HomeProps) {
  const params = await searchParams;
  const currentPage = Number(params.page) || 1;
  const searchQuery = typeof params.search === 'string' ? params.search : '';
  const sortBy = typeof params.sort === 'string' ? params.sort : 'newest';

  // Build where clause for search (case-insensitive for SQLite)
  const whereClause = searchQuery
    ? {
        OR: [
          {
            title: {
              contains: searchQuery.toLowerCase(),
            },
          },
          {
            excerpt: {
              contains: searchQuery.toLowerCase(),
            },
          },
        ],
      }
    : {};

  // Get total count with search filter
  const totalPosts = await prisma.post.count({
    where: whereClause,
  });
  const totalPages = Math.ceil(totalPosts / POSTS_PER_PAGE);

  // Determine sort order
  const orderBy = sortBy === 'popular' 
    ? { views: 'desc' as const }
    : { publishedAt: 'desc' as const };

  // Fetch posts from database with pagination, search, and sort
  const posts = await prisma.post.findMany({
    where: whereClause,
    take: POSTS_PER_PAGE,
    skip: (currentPage - 1) * POSTS_PER_PAGE,
    orderBy,
    include: {
      author: {
        select: {
          id: true,
          name: true,
          username: true,
          avatarUrl: true,
        },
      },
    },
  });

  // Parse tags from JSON string
  const postsWithParsedTags = posts.map((post) => ({
    ...post,
    tags: JSON.parse(post.tags),
  }));

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main className="flex-1 container mx-auto px-4 md:px-6 py-8 md:py-12 max-w-6xl mt-4 md:mt-0">
        <div className="mb-12 text-center">
          <h2 className="text-4xl font-bold tracking-tight mb-4">
            Последние статьи
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
            Будьте в курсе последних новостей, аналитики и разработок в области искусственного интеллекта.
          </p>
          
          {/* Search and Filter Bar */}
          <SearchFilterBar />
          
          {searchQuery && (
            <p className="mt-4 text-sm text-muted-foreground">
              Найдено статей: <span className="font-semibold text-foreground">{totalPosts}</span>
            </p>
          )}
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {postsWithParsedTags.map((post) => (
            <Link key={post.id} href={`/blog/${post.slug}`}>
              <SpotlightCard className="h-full cursor-pointer">
                <Card className="h-full border-0 bg-transparent shadow-none group overflow-hidden">
                  {post.coverImage && (
                    <div className="w-full h-48 overflow-hidden bg-secondary rounded-t-lg">
                      <img
                        src={post.coverImage}
                        alt={post.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  )}
                  <CardHeader>
                    <div className="flex flex-wrap gap-2 mb-3 min-h-[48px] items-start">
                      {post.tags.map((tag: string) => (
                        <span
                          key={tag}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-medium"
                        >
                          <Tag className="w-3 h-3" />
                          {tag}
                        </span>
                      ))}
                    </div>
                    <CardTitle className="group-hover:text-primary transition-colors line-clamp-2">
                      {post.title}
                    </CardTitle>
                    <CardDescription className="line-clamp-2">
                      {post.excerpt}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2 mb-4">
                      {post.author.avatarUrl ? (
                        <img
                          src={post.author.avatarUrl}
                          alt={post.author.name || "User"}
                          className="w-6 h-6 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                          <span className="text-white font-semibold text-xs">
                            {(post.author.name || "U").charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                      <span className="text-sm text-muted-foreground">
                        {post.author.name}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {new Date(post.publishedAt).toLocaleDateString("ru-RU", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {post.readTime}
                        </span>
                      </div>
                    </div>
                    <div className="mt-4 text-sm font-medium text-primary">
                      Читать далее
                    </div>
                  </CardContent>
                </Card>
              </SpotlightCard>
            </Link>
          ))}
        </div>

         {posts.length === 0 && (
           <div className="text-center text-muted-foreground py-20 text-lg">
             Ничего не найдено
           </div>
         )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-12 flex justify-center items-center gap-2">
            {/* Previous Button */}
            {currentPage > 1 ? (
              <Link
                href={(() => {
                  const params = new URLSearchParams();
                  if (searchQuery) params.set('search', searchQuery);
                  if (sortBy !== 'newest') params.set('sort', sortBy);
                  if (currentPage > 2) params.set('page', String(currentPage - 1));
                  const query = params.toString();
                  return query ? `/?${query}` : '/';
                })()}
              >
                <Button variant="outline" size="default" className="gap-2">
                  <ChevronLeft className="w-4 h-4" />
                  Назад
                </Button>
              </Link>
            ) : (
              <Button variant="outline" size="default" disabled className="gap-2">
                <ChevronLeft className="w-4 h-4" />
                Назад
              </Button>
            )}

            {/* Page Numbers */}
            <div className="flex gap-2">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                const isCurrentPage = page === currentPage;
                const params = new URLSearchParams();
                if (searchQuery) params.set('search', searchQuery);
                if (sortBy !== 'newest') params.set('sort', sortBy);
                if (page > 1) params.set('page', String(page));
                const query = params.toString();
                const href = query ? `/?${query}` : '/';
                
                return (
                  <Link key={page} href={href}>
                    <Button
                      variant={isCurrentPage ? "default" : "outline"}
                      size="default"
                      className="min-w-[44px]"
                    >
                      {page}
                    </Button>
                  </Link>
                );
              })}
            </div>

            {/* Next Button */}
            {currentPage < totalPages ? (
              <Link
                href={(() => {
                  const params = new URLSearchParams();
                  if (searchQuery) params.set('search', searchQuery);
                  if (sortBy !== 'newest') params.set('sort', sortBy);
                  params.set('page', String(currentPage + 1));
                  return `/?${params.toString()}`;
                })()}
              >
                <Button variant="outline" size="default" className="gap-2">
                  Вперёд
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </Link>
            ) : (
              <Button variant="outline" size="default" disabled className="gap-2">
                Вперёд
                <ChevronRight className="w-4 h-4" />
              </Button>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border mt-16">
        <div className="container mx-auto px-4 py-8 max-w-6xl">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
            <div>© 2026 ai-stat.ru — Все права защищены</div>
            <div className="text-center md:text-right">
              Сделано с <span className="text-red-500">❤</span> для всех, кто
              интересуется ИИ
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
