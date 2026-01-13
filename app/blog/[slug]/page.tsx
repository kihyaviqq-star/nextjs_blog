import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SpotlightCard } from "@/components/ui/spotlight-card";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import BlockRenderer from "@/components/blog/block-renderer";
import { Calendar, Clock, Tag, User, ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { ViewIncrementer } from "@/components/view-incrementer";

interface PageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function BlogPostPage({ params }: PageProps) {
  // Await params (Next.js 15 requirement)
  const { slug } = await params;
  
  // Decode slug
  const decodedSlug = decodeURIComponent(slug);

  // Fetch post from database
  const post = await prisma.post.findUnique({
    where: { slug: decodedSlug },
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

  // Show 404 if post not found
  if (!post) {
    notFound();
  }

  // Parse JSON fields
  const tags = JSON.parse(post.tags);
  const contentData = JSON.parse(post.content);
  const sources = post.sources ? JSON.parse(post.sources) : [];
  
  // Extract blocks from EditorJS format
  const blocks = contentData?.blocks || (Array.isArray(contentData) ? contentData : []);

  // Get related posts (same author or similar tags)
  const relatedPosts = await prisma.post.findMany({
    where: {
      AND: [
        { id: { not: post.id } },
        { authorId: post.authorId },
      ],
    },
    take: 3,
    orderBy: { views: "desc" },
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

  const relatedPostsWithParsedTags = relatedPosts.map((p) => ({
    ...p,
    tags: JSON.parse(p.tags),
  }));

  // Get previous and next posts for navigation
  const previousPost = await prisma.post.findFirst({
    where: {
      publishedAt: { lt: post.publishedAt },
    },
    orderBy: { publishedAt: "desc" },
    select: {
      slug: true,
      title: true,
    },
  });

  const nextPost = await prisma.post.findFirst({
    where: {
      publishedAt: { gt: post.publishedAt },
    },
    orderBy: { publishedAt: "asc" },
    select: {
      slug: true,
      title: true,
    },
  });

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Back Button */}
      <div className="container mx-auto px-4 pt-6 pb-6 max-w-4xl">
        <Link href="/">
          <Button variant="outline" className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Все новости
          </Button>
        </Link>
      </div>

      <main className="container mx-auto px-4 pb-16 max-w-4xl">
        <article>
          {/* Cover Image */}
          {post.coverImage && (
            <div className="w-full h-[400px] relative mb-12 rounded-lg overflow-hidden bg-secondary">
              <img
                src={post.coverImage}
                alt={post.title}
                className="w-full h-full object-cover"
                loading="eager"
              />
            </div>
          )}

          {/* Post Header */}
          <div className="mb-8">
            {/* Tags */}
            <div className="flex flex-wrap gap-2 mb-6">
              {tags.map((tag: string) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-secondary text-sm font-medium"
                >
                  <Tag className="w-3.5 h-3.5" />
                  {tag}
                </span>
              ))}
            </div>

            <h1 className="text-5xl font-bold tracking-tight mb-6">
              {post.title}
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              {post.excerpt.replace(/<[^>]*>?/gm, '')}
            </p>

            {/* Meta */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground pb-6 border-b border-border">
              <Link
                href={`/${post.author.username || 'user'}`}
                className="flex items-center gap-2 hover:text-foreground transition-colors group"
              >
                {post.author.avatarUrl ? (
                  <img
                    src={post.author.avatarUrl}
                    alt={post.author.name || "User"}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                    <User className="w-5 h-5 text-white" />
                  </div>
                )}
                <span className="font-medium group-hover:text-primary transition-colors">
                  {post.author.name}
                </span>
              </Link>
              <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                <time dateTime={post.publishedAt.toISOString()}>
                  {new Date(post.publishedAt).toLocaleDateString("ru-RU", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </time>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="w-4 h-4" />
                <span>{post.readTime}</span>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="prose prose-lg max-w-none dark:prose-invert mb-16">
            <BlockRenderer blocks={blocks} />
          </div>

          {/* Sources */}
          {sources.length > 0 && (
            <div className="mt-12 pt-8 border-t border-border">
              <h2 className="text-2xl font-bold mb-4">Источники</h2>
              <ul className="space-y-3">
                {sources.map((source: string, index: number) => {
                  // Remove protocol from display
                  const displayUrl = source.replace(/^https?:\/\//, '');
                  
                  return (
                    <li key={index} className="flex items-center gap-2">
                      <svg
                        className="w-4 h-4 text-muted-foreground flex-shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                        />
                      </svg>
                      <a
                        href={source}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline break-all"
                      >
                        {displayUrl}
                      </a>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </article>

        {/* Post Navigation */}
        {(previousPost || nextPost) && (
          <div className="mt-16 pt-8 border-t border-border">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {previousPost ? (
                <Link
                  href={`/blog/${previousPost.slug}`}
                  className="group block"
                >
                  <div className="text-sm text-muted-foreground mb-2">
                    Предыдущая статья
                  </div>
                  <div className="text-lg font-semibold group-hover:text-primary transition-colors line-clamp-1">
                    {previousPost.title}
                  </div>
                </Link>
              ) : (
                <div></div>
              )}
              {nextPost && (
                <Link
                  href={`/blog/${nextPost.slug}`}
                  className="group block md:text-right"
                >
                  <div className="text-sm text-muted-foreground mb-2">
                    Следующая статья
                  </div>
                  <div className="text-lg font-semibold group-hover:text-primary transition-colors line-clamp-1">
                    {nextPost.title}
                  </div>
                </Link>
              )}
            </div>
          </div>
        )}

        {/* Related Posts */}
        {relatedPostsWithParsedTags.length > 0 && (
          <div className="mt-16 pt-16 border-t border-border">
            <h2 className="text-3xl font-bold mb-8">Похожие статьи</h2>
            <div className="grid gap-6 md:grid-cols-3">
              {relatedPostsWithParsedTags.map((relatedPost) => (
                <Link key={relatedPost.id} href={`/blog/${relatedPost.slug}`}>
                  <SpotlightCard className="h-full cursor-pointer">
                    <Card className="h-full border-0 bg-transparent shadow-none group">
                      {relatedPost.coverImage && (
                        <div className="w-full h-32 overflow-hidden bg-secondary rounded-t-lg">
                          <img
                            src={relatedPost.coverImage}
                            alt={relatedPost.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                      )}
                      <CardHeader>
                        <CardTitle className="text-base group-hover:text-primary transition-colors line-clamp-2">
                          {relatedPost.title}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Calendar className="w-3 h-3" />
                          {new Date(relatedPost.publishedAt).toLocaleDateString("ru-RU", {
                            month: "short",
                            day: "numeric",
                          })}
                        </div>
                        <div className="mt-2 text-xs font-medium text-primary">
                          Читать
                        </div>
                      </CardContent>
                    </Card>
                  </SpotlightCard>
                </Link>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* View Incrementer (Client Component) */}
      <ViewIncrementer slug={post.slug} />

      <Footer />
    </div>
  );
}
