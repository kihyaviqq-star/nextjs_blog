"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { HeaderClientWrapper } from "@/components/header";
import { FooterClient } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { BlogPost } from "@/lib/types";
import { Edit, Trash2, Search, Eye, ArrowUpDown, Calendar } from "lucide-react";
import { toast } from "sonner";

type SortOption = "newest" | "popular";

export default function ArticlesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [filteredPosts, setFilteredPosts] = useState<BlogPost[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [isLoading, setIsLoading] = useState(true);
  const [deletingSlug, setDeletingSlug] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]); // router стабилен и не должен быть в зависимостях

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const response = await fetch('/api/posts');
        if (response.ok) {
          const data = await response.json();
          setPosts(data);
          setFilteredPosts(data);
        }
      } catch (error) {
        console.error('Error fetching posts:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPosts();
  }, []);

  // Filter and sort posts
  useEffect(() => {
    let result = [...posts];

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter((post) => {
        if (post.title.toLowerCase().includes(query)) return true;
        if (post.content?.blocks) {
          return post.content.blocks.some((block: any) => {
            if (block.data?.text && typeof block.data.text === 'string') {
              return block.data.text.toLowerCase().includes(query);
            }
            return false;
          });
        }
        return false;
      });
    }

    // Sort
    if (sortBy === "newest") {
      result.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
    } else if (sortBy === "popular") {
      result.sort((a, b) => (b.views || 0) - (a.views || 0));
    }

    setFilteredPosts(result);
  }, [searchQuery, posts, sortBy]);

  const handleDelete = async (slug: string) => {
    setDeletingSlug(slug);

    try {
      const response = await fetch(`/api/posts/${slug}`, {
        method: "DELETE",
      });

      if (response.ok) {
        const updatedPosts = posts.filter((p) => p.slug !== slug);
        setPosts(updatedPosts);
        toast.success("Статья успешно удалена!");
      } else {
        toast.error("Ошибка при удалении статьи");
      }
    } catch (error) {
      console.error("Error deleting post:", error);
      toast.error("Ошибка при удалении статьи");
    } finally {
      setDeletingSlug(null);
    }
  };

  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-muted-foreground">Загрузка...</p>
        </div>
      </div>
    );
  }

  if (!session?.user) {
    return null;
  }

  const userRole = (session.user as any).role;
  const canAccess = userRole === "ADMIN" || userRole === "EDITOR";

  if (!canAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-xl text-muted-foreground">У вас нет доступа к панели управления</p>
          <Button onClick={() => router.push("/")}>
            На главную
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <HeaderClientWrapper />
      <main className="flex-grow container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold mb-1">Управление статьями</h1>
              <p className="text-sm text-muted-foreground">
                {searchQuery ? `Найдено: ${filteredPosts.length} из ${posts.length}` : `Всего статей: ${posts.length}`}
              </p>
            </div>
          </div>
          
          {/* Search and Sort Controls */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Поиск по названию или содержимому..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-sm"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  ×
                </button>
              )}
            </div>

            <div className="flex gap-2">
              <Button
                variant={sortBy === "newest" ? "default" : "outline"}
                size="sm"
                onClick={() => setSortBy("newest")}
                className="gap-1.5"
              >
                <ArrowUpDown className="w-3.5 h-3.5" />
                Новые
              </Button>
              <Button
                variant={sortBy === "popular" ? "default" : "outline"}
                size="sm"
                onClick={() => setSortBy("popular")}
                className="gap-1.5"
              >
                <Eye className="w-3.5 h-3.5" />
                Популярные
              </Button>
            </div>
          </div>
        </div>

        {filteredPosts.length === 0 ? (
          <Card className="p-12 text-center">
            <div className="flex flex-col items-center gap-4">
              <Search className="w-12 h-12 text-muted-foreground" />
              <div>
                <h3 className="text-xl font-semibold mb-2">Ничего не найдено</h3>
                <p className="text-muted-foreground">
                  Попробуйте изменить поисковый запрос
                </p>
              </div>
            </div>
          </Card>
        ) : (
          <>
            {/* Mobile Card View */}
            <div className="md:hidden space-y-4">
              {filteredPosts.map((post) => (
                <Card key={post.slug} className="p-4">
                  <div className="flex gap-3 mb-3">
                    <div className="w-16 h-16 rounded overflow-hidden bg-secondary flex-shrink-0 relative">
                      {post.coverImage ? (
                        <Image
                          src={post.coverImage}
                          alt={post.title}
                          fill
                          className="object-cover"
                          sizes="64px"
                          unoptimized={post.coverImage?.startsWith('/') || post.coverImage?.startsWith('http')}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <svg className="w-6 h-6 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <Link
                        href={`/${post.slug}`}
                        className="font-medium text-sm hover:text-primary transition-colors line-clamp-2 mb-2 block"
                      >
                        {post.title}
                      </Link>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mb-2">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          <span>
                            {new Date(post.publishedAt).toLocaleDateString("ru-RU", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })}
                          </span>
                        </div>
                        <span className="flex items-center gap-1">
                          <Eye className="w-3 h-3" />
                          {post.views?.toLocaleString() || "0"}
                        </span>
                      </div>
                      {post.excerpt && (
                        <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                          {post.excerpt}
                        </p>
                      )}
                      {post.author && (
                        <div className="flex items-center gap-2 mb-2">
                          {post.author.avatarUrl ? (
                            <Image
                              src={post.author.avatarUrl}
                              alt={post.author.name || "User"}
                              width={24}
                              height={24}
                              className="rounded-full object-cover"
                              unoptimized={post.author.avatarUrl?.startsWith('http')}
                            />
                          ) : (
                            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                              <span className="text-white font-semibold text-xs">
                                {(post.author.name || "U").charAt(0).toUpperCase()}
                              </span>
                            </div>
                          )}
                          <span className="text-xs text-muted-foreground">
                            {post.author.name || "Без имени"}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
                    <Link href={`/dashboard/articles/edit/${post.slug}`}>
                      <Button variant="outline" size="sm" className="gap-2">
                        <Edit className="w-4 h-4" />
                        Редактировать
                      </Button>
                    </Link>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-2 text-destructive hover:text-destructive"
                          disabled={deletingSlug === post.slug}
                        >
                          {deletingSlug === post.slug ? (
                            <div className="w-4 h-4 border-2 border-destructive border-t-transparent rounded-full animate-spin"></div>
                          ) : (
                            <>
                              <Trash2 className="w-4 h-4" />
                              Удалить
                            </>
                          )}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Вы абсолютно уверены?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Это действие нельзя отменить. Статья будет безвозвратно удалена.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Отмена</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(post.slug)}
                            className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
                          >
                            Удалить
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </Card>
              ))}
            </div>

            {/* Desktop Table View */}
            <Card className="overflow-hidden hidden md:block">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-secondary/50 border-b border-border">
                    <tr>
                      <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Статья
                      </th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider w-[200px]">
                        Автор
                      </th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider w-[150px]">
                        Дата
                      </th>
                      <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider w-[120px]">
                        <div className="flex items-center justify-end gap-1">
                          <Eye className="w-3.5 h-3.5" />
                          Просмотры
                        </div>
                      </th>
                      <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider w-20">
                        Действия
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredPosts.map((post) => (
                      <tr key={post.slug} className="hover:bg-secondary/30 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            {/* Thumbnail */}
                            <div className="w-12 h-12 rounded overflow-hidden bg-secondary flex-shrink-0 relative">
                              {post.coverImage ? (
                                <Image
                                  src={post.coverImage}
                                  alt={post.title}
                                  fill
                                  className="object-cover"
                                  sizes="48px"
                                  unoptimized={post.coverImage?.startsWith('/') || post.coverImage?.startsWith('http')}
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <svg className="w-6 h-6 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                  </svg>
                                </div>
                              )}
                            </div>
                            {/* Title and Excerpt */}
                            <div className="flex-1 min-w-0">
                              <Link
                                href={`/${post.slug}`}
                                className="font-medium text-sm hover:text-primary transition-colors line-clamp-2"
                              >
                                {post.title}
                              </Link>
                              {post.excerpt && (
                                <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                                  {post.excerpt}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          {post.author ? (
                            <div className="flex items-center gap-2">
                              {post.author.avatarUrl ? (
                                <Image
                                  src={post.author.avatarUrl}
                                  alt={post.author.name || "User"}
                                  width={32}
                                  height={32}
                                  className="rounded-full object-cover"
                                  unoptimized={post.author.avatarUrl?.startsWith('http')}
                                />
                              ) : (
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                                  <span className="text-white font-semibold text-xs">
                                    {(post.author.name || "U").charAt(0).toUpperCase()}
                                  </span>
                                </div>
                              )}
                              <div className="flex flex-col">
                                <span className="text-sm font-medium">
                                  {post.author.name || "Без имени"}
                                </span>
                                {post.author.username && (
                                  <span className="text-xs text-muted-foreground font-mono">
                                    @{post.author.username}
                                  </span>
                                )}
                              </div>
                            </div>
                          ) : (
                            <span className="text-sm text-muted-foreground">—</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-sm text-muted-foreground whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            <span>
                              {new Date(post.publishedAt).toLocaleDateString("ru-RU", {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              })}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end">
                            <span className="text-sm text-muted-foreground">
                              {post.views?.toLocaleString("ru-RU") || "0"}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right w-20">
                          <div className="flex items-center justify-end gap-2">
                            <Link href={`/dashboard/articles/edit/${post.slug}`}>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <Edit className="w-4 h-4" />
                              </Button>
                            </Link>
                            
                            {/* Delete with AlertDialog */}
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                                  disabled={deletingSlug === post.slug}
                                >
                                  {deletingSlug === post.slug ? (
                                    <div className="w-4 h-4 border-2 border-destructive border-t-transparent rounded-full animate-spin"></div>
                                  ) : (
                                    <Trash2 className="w-4 h-4" />
                                  )}
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Вы абсолютно уверены?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Это действие нельзя отменить. Статья будет безвозвратно удалена.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Отмена</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDelete(post.slug)}
                                    className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
                                  >
                                    Удалить
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </>
        )}
      </main>

      <FooterClient />
    </div>
  );
}
