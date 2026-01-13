import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SpotlightCard } from "@/components/ui/spotlight-card";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import BlockRenderer from "@/components/blog/block-renderer";
import { Calendar, Clock, Tag, User, ArrowLeft, Mail, Twitter, Github } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { ViewIncrementer } from "@/components/view-incrementer";
import { isUsernameReserved } from "@/lib/constants";

interface PageProps {
  params: Promise<{
    slug: string;
  }>;
}

// Article Page Component
async function ArticlePage({ post }: { post: any }) {
  // Parse JSON fields
  const tags = JSON.parse(post.tags);
  const contentData = JSON.parse(post.content);
  const sources = post.sources ? JSON.parse(post.sources) : [];
  
  // Extract blocks from EditorJS format
  const blocks = contentData?.blocks || (Array.isArray(contentData) ? contentData : []);

  // Get site settings for Schema.org
  const siteSettings = await prisma.siteSettings.findUnique({
    where: { id: "default" },
    select: { siteName: true, logoUrl: true },
  });
  const siteName = siteSettings?.siteName || "Blog";
  const siteUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
  const postUrl = `${siteUrl}/${post.slug}`;
  const ogImage = post.coverImage 
    ? (post.coverImage.startsWith('http') ? post.coverImage : `${siteUrl}${post.coverImage}`)
    : (siteSettings?.logoUrl ? `${siteUrl}${siteSettings.logoUrl}` : `${siteUrl}/og-default.jpg`);

  // Schema.org JSON-LD for Article
  const schemaData = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.excerpt,
    image: ogImage,
    datePublished: post.publishedAt.toISOString(),
    dateModified: post.updatedAt?.toISOString() || post.publishedAt.toISOString(),
    author: {
      "@type": "Person",
      name: post.author.name || siteName,
      url: post.author.username ? `${siteUrl}/${post.author.username}` : undefined,
    },
    publisher: {
      "@type": "Organization",
      name: siteName,
      logo: {
        "@type": "ImageObject",
        url: siteSettings?.logoUrl 
          ? (siteSettings.logoUrl.startsWith('http') ? siteSettings.logoUrl : `${siteUrl}${siteSettings.logoUrl}`)
          : `${siteUrl}/og-default.jpg`,
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": postUrl,
    },
  };

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
        {/* Schema.org JSON-LD */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }}
        />
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
              {post.excerpt}
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
                  href={`/${previousPost.slug}`}
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
                  href={`/${nextPost.slug}`}
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
                <Link key={relatedPost.id} href={`/${relatedPost.slug}`}>
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

// User Profile Component
function UserProfilePage({ user }: { user: any }) {
  const username = user.username || 'user';

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-12 max-w-4xl">
        {/* User Profile */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            {user.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user.name || username}
                className="w-32 h-32 rounded-full border-4 border-border object-cover"
              />
            ) : (
              <div className="w-32 h-32 rounded-full border-4 border-border bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <span className="text-5xl font-bold text-white">
                  {(user.name || username).charAt(0).toUpperCase()}
                </span>
              </div>
            )}
          </div>

          <h1 className="text-4xl font-bold mb-2">{user.name || username}</h1>
          
          {user.role && (
            <p className="text-lg text-muted-foreground mb-6">
              {user.role === "ADMIN" ? "Редактор" : "Пользователь"}
            </p>
          )}

          {/* Social Links */}
          {(user.telegram || user.vk || user.twitter || user.github) && (
            <div className="flex items-center justify-center gap-4 mb-8">
              {user.telegram && (
                <a
                  href={user.telegram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full bg-secondary hover:bg-accent flex items-center justify-center transition-colors"
                  title="Telegram"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z"/>
                  </svg>
                </a>
              )}
              {user.vk && (
                <a
                  href={user.vk}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full bg-secondary hover:bg-accent flex items-center justify-center transition-colors"
                  title="Вконтакте"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12.785 16.241s.288-.032.436-.194c.136-.149.132-.427.132-.427s-.019-1.302.574-1.495c.584-.19 1.33 1.259 2.124 1.816.6.422 1.056.329 1.056.329l2.123-.03s1.11-.07.584-.96c-.043-.073-.308-.662-1.588-1.87-1.34-1.264-1.16-1.059.453-3.246.983-1.332 1.376-2.145 1.253-2.493-.117-.332-.84-.244-.84-.244l-2.388.015s-.177-.025-.308.055c-.128.078-.21.261-.21.261s-.377.982-.88 1.816c-1.059 1.758-1.484 1.851-1.657 1.743-.403-.252-.302-1.012-.302-1.553 0-1.688.251-2.391-.489-2.574-.246-.061-.427-.101-1.056-.108-.807-.008-1.491.003-1.878.196-.257.128-.456.414-.335.431.15.02.489.093.669.342.233.322.225 1.045.225 1.045s.134 1.989-.313 2.234c-.308.168-.729-.175-1.634-1.741-.463-.809-.813-1.703-.813-1.703s-.067-.168-.188-.258c-.146-.109-.35-.144-.35-.144l-2.268.015s-.341.01-.466.161c-.111.134-.009.411-.009.411s1.766 4.207 3.765 6.328c1.833 1.946 3.916 1.817 3.916 1.817h.944z"/>
                  </svg>
                </a>
              )}
              {user.twitter && (
                <a
                  href={user.twitter}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full bg-secondary hover:bg-accent flex items-center justify-center transition-colors"
                  title="Twitter"
                >
                  <Twitter className="w-5 h-5" />
                </a>
              )}
              {user.github && (
                <a
                  href={user.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full bg-secondary hover:bg-accent flex items-center justify-center transition-colors"
                  title="GitHub"
                >
                  <Github className="w-5 h-5" />
                </a>
              )}
            </div>
          )}

          {user.email && (
            <a
              href={`mailto:${user.email}`}
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
            >
              <Mail className="w-4 h-4" />
              {user.email}
            </a>
          )}
        </div>

        {/* About Section */}
        {user.bio && (
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-4">Обо мне</h2>
            <p className="text-lg text-muted-foreground leading-relaxed">
              {user.bio}
            </p>
          </section>
        )}

        {/* Member Since */}
        <section className="mb-12">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-center gap-2 text-muted-foreground">
                <Calendar className="w-5 h-5" />
                <span>
                  Участник с{" "}
                  {new Date(user.createdAt).toLocaleDateString("ru-RU", {
                    month: "long",
                    year: "numeric",
                  })}
                </span>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Back to Home */}
        <div className="mt-8 text-center">
          <Link href="/">
            <Button variant="outline">Вернуться на главную</Button>
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}

// Main Page Component
export default async function DynamicPage({ params }: PageProps) {
  const { slug } = await params;
  
  // Decode slug
  const decodedSlug = decodeURIComponent(slug);

  // Try to find a post first (priority to articles)
  // Articles can use any slug, even if it's in reserved list
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

  if (post) {
    return <ArticlePage post={post} />;
  }

  // If no post found, try to find a user
  // Only check reserved usernames for user profiles, not for articles
  if (isUsernameReserved(decodedSlug)) {
    notFound();
  }

  const user = await prisma.user.findFirst({
    where: {
      username: decodedSlug.toLowerCase(),
    },
    select: {
      id: true,
      name: true,
      username: true,
      email: true,
      avatarUrl: true,
      bio: true,
      role: true,
      telegram: true,
      vk: true,
      twitter: true,
      github: true,
      createdAt: true,
    }
  });

  if (user) {
    return <UserProfilePage user={user} />;
  }

  // If neither found, show 404
  notFound();
}

// Metadata for SEO
export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const decodedSlug = decodeURIComponent(slug);

  // Get site settings for site name and metadata
  let siteSettings = await prisma.siteSettings.findUnique({
    where: { id: "default" },
    select: { 
      siteName: true,
      metaDescription: true,
      logoUrl: true,
    },
  });
  const siteName = siteSettings?.siteName || "Blog";
  const siteDescription = siteSettings?.metaDescription || "Информационный портал о последних новостях и разработках в области искусственного интеллекта";
  const siteUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
  const defaultImage = siteSettings?.logoUrl ? `${siteUrl}${siteSettings.logoUrl}` : `${siteUrl}/og-default.jpg`;

  // Try post first
  const post = await prisma.post.findUnique({
    where: { slug: decodedSlug },
    include: {
      author: {
        select: {
          name: true,
        },
      },
    },
  });

  if (post) {
    const postUrl = `${siteUrl}/${decodedSlug}`;
    const ogImage = post.coverImage 
      ? (post.coverImage.startsWith('http') ? post.coverImage : `${siteUrl}${post.coverImage}`)
      : defaultImage;

    return {
      title: `${post.title} | ${siteName}`,
      description: post.excerpt,
      openGraph: {
        title: post.title,
        description: post.excerpt,
        type: "article",
        publishedTime: post.publishedAt.toISOString(),
        authors: [post.author.name || siteName],
        images: [
          {
            url: ogImage,
            width: 1200,
            height: 630,
            alt: post.title,
          },
        ],
        url: postUrl,
        siteName: siteName,
      },
      twitter: {
        card: "summary_large_image",
        title: post.title,
        description: post.excerpt,
        images: [ogImage],
      },
    };
  }

  // Try user
  const user = await prisma.user.findFirst({
    where: {
      username: decodedSlug.toLowerCase(),
    },
    select: {
      name: true,
      bio: true,
      avatarUrl: true,
    }
  });

  if (user) {
    const userUrl = `${siteUrl}/${decodedSlug}`;
    const ogImage = user.avatarUrl 
      ? (user.avatarUrl.startsWith('http') ? user.avatarUrl : `${siteUrl}${user.avatarUrl}`)
      : defaultImage;

    return {
      title: `${user.name || decodedSlug} | ${siteName}`,
      description: user.bio || `Профиль пользователя ${user.name || decodedSlug}`,
      openGraph: {
        title: `${user.name || decodedSlug} | ${siteName}`,
        description: user.bio || `Профиль пользователя ${user.name || decodedSlug}`,
        type: "profile",
        images: [
          {
            url: ogImage,
            width: 400,
            height: 400,
            alt: user.name || decodedSlug,
          },
        ],
        url: userUrl,
        siteName: siteName,
      },
      twitter: {
        card: "summary",
        title: `${user.name || decodedSlug} | ${siteName}`,
        description: user.bio || `Профиль пользователя ${user.name || decodedSlug}`,
        images: [ogImage],
      },
    };
  }

  return {
    title: `Страница не найдена | ${siteName}`,
    description: "Страница не найдена",
  };
}
