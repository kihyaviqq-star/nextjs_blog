import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { SearchFilterBar } from "@/components/search-filter-bar";
import { SpotlightCard } from "@/components/ui/spotlight-card";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Clock, Tag, ChevronLeft, ChevronRight, ImageIcon, Sparkles, Search } from "lucide-react";
import { getCachedPosts, getCachedSiteSettings } from "@/lib/cache/cached-queries";
import { HeroBackground } from "@/components/ui/hero-background";
import { FeaturedPost } from "@/components/featured-post";
import { AnimatedGrid } from "@/components/animated-grid";
import { AnimatedTitle } from "@/components/ui/animated-title";

const POSTS_PER_PAGE = 9;

interface HomeProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function Home({ searchParams }: HomeProps) {
  const params = await searchParams;
  const currentPage = Number(params.page) || 1;
  const searchQuery = typeof params.search === 'string' ? params.search : '';
  const sortBy = typeof params.sort === 'string' ? params.sort : 'newest';

  // Fetch cached data in parallel
  const [
    { totalPosts, posts, allPostsForTags, totalPages, showFeatured },
    siteSettings
  ] = await Promise.all([
    getCachedPosts({
      page: currentPage,
      limit: POSTS_PER_PAGE,
      search: searchQuery,
      sortBy,
    }),
    getCachedSiteSettings(),
  ]);

  // Parse tags
  const postsWithParsedTags = posts.map((post) => {
    let tags: string[] = [];
    try {
      tags = JSON.parse(post.tags) || [];
    } catch (error) {
      tags = [];
    }
    return { ...post, tags };
  });

  const featuredPost = showFeatured && postsWithParsedTags.length > 0 ? postsWithParsedTags[0] : null;
  const gridPosts = showFeatured ? postsWithParsedTags.slice(1) : postsWithParsedTags;
  
  const tagCounts = allPostsForTags.reduce((acc, post) => {
    try {
      const tags = JSON.parse(post.tags) || [];
      tags.forEach((tag: string) => {
        acc[tag] = (acc[tag] || 0) + 1;
      });
    } catch (e) {}
    return acc;
  }, {} as Record<string, number>);
  
  const popularTags = Object.entries(tagCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(entry => entry[0]);

  // Fallback tags if we don't have enough
  const displayTags = popularTags.length >= 3 ? popularTags : ["ИИ", "Нейросети", "Туториал", "LLM", "Будущее"];

  const siteUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "mainEntity": {
      "@type": "ItemList",
      "itemListElement": posts.map((post, index) => ({
        "@type": "ListItem",
        "position": index + 1,
        "url": `${siteUrl}/${post.slug}`,
        "name": post.title
      }))
    }
  };

  const homeSubtitle = siteSettings?.homeSubtitle || "Будьте в курсе последних новостей, аналитики и разработок в области искусственного интеллекта.";
  const siteName = siteSettings?.siteName || "Softo.ru";

  return (
    <div className="min-h-screen bg-transparent flex flex-col font-sans selection:bg-primary/20 relative">
      <HeroBackground />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
      />
      <Header />

      <main className="flex-1 flex flex-col">
        {/* Hero Section - Apple Style */}
        <section className={`relative transition-all duration-500 ease-in-out px-4 md:px-6 flex flex-col items-center justify-center border-b border-border/10 ${
          searchQuery ? "pt-12 pb-12 md:pt-16 md:pb-16" : "pt-24 pb-28 md:pt-36 md:pb-40"
        }`}>
          <div className="relative z-10 w-full max-w-4xl mx-auto text-center">
            
            <div 
              className={`grid transition-all duration-500 ease-in-out ${
                searchQuery ? "grid-rows-[0fr] opacity-0 mb-0 pointer-events-none" : "grid-rows-[1fr] opacity-100 mb-12"
              }`}
            >
              <div className="min-h-0 flex flex-col items-center">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-background/60 backdrop-blur-xl border border-border/50 text-primary mb-6 text-sm font-medium shadow-sm transition-all hover:bg-background/80">
                  <Sparkles className="w-4 h-4" />
                  <span>Добро пожаловать в будущее</span>
                </div>
                
                <AnimatedTitle text={siteName} />
                
                <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto leading-relaxed font-light mt-4">
                  {homeSubtitle}
                </p>
              </div>
            </div>
            
            <SearchFilterBar />
            
            {/* Quick Tags */}
            {!searchQuery && (
              <div className="mt-10 flex flex-wrap justify-center gap-3 items-center">
                <span className="text-sm text-muted-foreground mr-1">Популярное:</span>
                {displayTags.map(tag => (
                  <Link 
                    key={tag} 
                    href={`/?search=${encodeURIComponent(tag)}`}
                    className="text-sm font-medium px-4 py-2 rounded-full bg-secondary/30 backdrop-blur-md hover:bg-secondary/60 hover:shadow-sm border border-border/30 transition-all text-foreground/80 hover:text-foreground"
                  >
                    {tag}
                  </Link>
                ))}
              </div>
            )}

            {searchQuery && (
              <div className="mt-8">
                <p className="text-sm font-medium text-foreground bg-background/60 backdrop-blur-xl py-2 px-5 rounded-full inline-block border border-border/50 shadow-sm">
                  Найдено статей: <span className="font-bold text-primary ml-1">{totalPosts}</span>
                </p>
              </div>
            )}
          </div>
        </section>

        {/* Content Section */}
        <section className="container mx-auto px-4 md:px-6 py-16 md:py-24 max-w-6xl">
          {featuredPost && (
            <div className="mb-20">
              <div className="flex items-center gap-2 mb-8">
                <Sparkles className="w-6 h-6 text-primary" />
                <h2 className="text-3xl font-bold tracking-tight">
                  Главная тема
                </h2>
              </div>
              <FeaturedPost post={featuredPost} />
            </div>
          )}

          {!featuredPost && gridPosts.length > 0 && (
            <h2 className="text-3xl font-bold tracking-tight mb-8">
              {searchQuery ? "Результаты поиска" : sortBy === "popular" ? "Популярные статьи" : "Последние публикации"}
            </h2>
          )}

          <AnimatedGrid className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {gridPosts.map((post, index) => (
              <SpotlightCard key={post.id} className="h-full relative rounded-3xl">
                <Link href={`/${post.slug}`} className="absolute inset-0 z-0" aria-label={post.title}>
                  <span className="sr-only">Читать статью</span>
                </Link>
                <Card className="h-full border border-border/40 bg-card/40 backdrop-blur-sm shadow-sm hover:shadow-md transition-all duration-300 group overflow-hidden relative z-10 pointer-events-none flex flex-col rounded-3xl">
                  {post.coverImage ? (
                    <div className="w-full h-52 overflow-hidden bg-secondary relative flex-shrink-0">
                      <Image
                        src={post.coverImage}
                        alt={post.title}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        className="object-cover group-hover:scale-105 transition-transform duration-700"
                        priority={index < 3}
                        unoptimized={post.coverImage?.startsWith('/') || post.coverImage?.startsWith('http')}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-background/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    </div>
                  ) : (
                    <div className="w-full h-52 flex flex-col items-center justify-center text-muted-foreground bg-secondary/10 relative overflow-hidden flex-shrink-0">
                      <div className="absolute inset-0 opacity-30 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/20 via-background to-background" />
                      <ImageIcon className="w-12 h-12 mb-2 opacity-20 relative z-10" />
                    </div>
                  )}
                  <CardHeader className="flex-1 px-6 pt-6">
                    <div className="flex flex-wrap gap-2 mb-3 min-h-[28px] items-start">
                      {post.tags.slice(0, 2).map((tag: string) => (
                        <span
                          key={tag}
                          className="inline-flex items-center px-2.5 py-1 rounded-full bg-secondary/50 border border-border/30 text-xs font-semibold tracking-wide text-foreground/70"
                        >
                          {tag}
                        </span>
                      ))}
                      {post.tags.length > 2 && (
                         <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-secondary/20 border border-border/20 text-xs font-semibold text-foreground/40">
                           +{post.tags.length - 2}
                         </span>
                      )}
                    </div>
                    <CardTitle className="text-xl group-hover:text-primary transition-colors line-clamp-2 leading-snug font-bold">
                      {post.title}
                    </CardTitle>
                    <CardDescription className="line-clamp-2 mt-3 leading-relaxed text-base">
                      {post.excerpt}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="mt-auto px-6 pb-6 pt-4">
                    <div className="flex items-center justify-between pointer-events-auto relative z-20 pt-4 border-t border-border/30">
                      <Link 
                        href={`/${post.author.username || post.author.id}`}
                        className="flex items-center gap-3 hover:opacity-80 transition-opacity group/author"
                      >
                        {post.author.avatarUrl ? (
                          <Image
                            src={post.author.avatarUrl}
                            alt={post.author.name || "User"}
                            width={28}
                            height={28}
                            className="w-7 h-7 rounded-full object-cover ring-2 ring-transparent group-hover/author:ring-primary/20 transition-all"
                            unoptimized={post.author.avatarUrl.startsWith('http') || post.author.avatarUrl.startsWith('/uploads/')}
                          />
                        ) : (
                          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                            <span className="text-white font-semibold text-[10px]">
                              {(post.author.name || "U").charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                        <span className="text-sm font-semibold text-foreground/80 group-hover/author:text-primary transition-colors">
                          {post.author.name}
                        </span>
                      </Link>
                      <div className="flex items-center gap-3 text-xs font-medium text-muted-foreground">
                        <span className="flex items-center gap-1.5 bg-secondary/30 px-2 py-1 rounded-md">
                          <Clock className="w-3 h-3" />
                          {post.readTime}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </SpotlightCard>
            ))}
          </AnimatedGrid>

          {posts.length === 0 && (
            <div className="text-center text-muted-foreground py-32 text-lg flex flex-col items-center justify-center">
              <div className="w-20 h-20 rounded-full bg-secondary/30 flex items-center justify-center mb-6 shadow-inner">
                <Search className="w-10 h-10 opacity-40 text-primary" />
              </div>
              <p className="font-medium">Ничего не найдено</p>
              <p className="text-sm mt-2 opacity-70 max-w-sm">Попробуйте изменить поисковой запрос или выбрать другие фильтры.</p>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-16 flex justify-center items-center gap-3">
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
                  <Button variant="outline" size="default" className="gap-2 rounded-full px-6 shadow-sm hover:shadow">
                    <ChevronLeft className="w-4 h-4" />
                    Назад
                  </Button>
                </Link>
              ) : (
                <Button variant="outline" size="default" disabled className="gap-2 rounded-full px-6 opacity-50">
                  <ChevronLeft className="w-4 h-4" />
                  Назад
                </Button>
              )}

              {/* Page Numbers - Hidden on mobile for cleaner look, dots instead */}
              <div className="hidden sm:flex gap-2">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                  // Only show current, first, last, and neighbors
                  if (
                    page === 1 || 
                    page === totalPages || 
                    Math.abs(page - currentPage) <= 1
                  ) {
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
                          size="icon"
                          className={`w-10 h-10 rounded-full ${isCurrentPage ? 'shadow-md' : 'shadow-sm hover:shadow'}`}
                        >
                          {page}
                        </Button>
                      </Link>
                    );
                  } else if (
                    page === 2 && currentPage > 3 ||
                    page === totalPages - 1 && currentPage < totalPages - 2
                  ) {
                    return <span key={page} className="px-2 self-center text-muted-foreground">...</span>;
                  }
                  return null;
                })}
              </div>
              <div className="sm:hidden text-sm font-medium px-4 text-muted-foreground">
                {currentPage} из {totalPages}
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
                  <Button variant="outline" size="default" className="gap-2 rounded-full px-6 shadow-sm hover:shadow">
                    Вперёд
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </Link>
              ) : (
                <Button variant="outline" size="default" disabled className="gap-2 rounded-full px-6 opacity-50">
                  Вперёд
                  <ChevronRight className="w-4 h-4" />
                </Button>
              )}
            </div>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
}
