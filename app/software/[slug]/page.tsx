import { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ExternalLink, Star, DownloadCloud } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ScreenshotGallery } from "@/components/screenshot-gallery";
import { ExpandableText } from "@/components/expandable-text";
import { CommentSection } from "@/components/comments/comment-section";
import { RatingWidget } from "@/components/reviews/rating-widget";
import { AiModelLayout } from "@/components/ai/ai-model-layout";
import { AiSpecsSection } from "@/components/ai-specs";
import { RelatedModels } from "@/components/ai/related-models";
import { FallbackImage } from "@/components/ui/fallback-image";
import { auth } from "@/lib/auth";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const resolvedParams = await params;
  const tool = await prisma.software.findUnique({ 
    where: { slug: resolvedParams.slug },
    include: { category: true }
  });
  
  if (!tool) return { title: "Не найдено" };
  
  const title = `${tool.name} — Скачать и обзор программы`;
  const description = tool.shortDesc || `Узнайте больше о программе ${tool.name}. Описание, скриншоты, отзывы и загрузка.`;
  
  return {
    title,
    description,
    keywords: [tool.name, tool.category.name, "скачать программу", "обзор ПО", "Windows"],
    openGraph: {
      title,
      description,
      type: "website",
      images: tool.logoUrl ? [{ url: tool.logoUrl }] : [],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: tool.logoUrl ? [tool.logoUrl] : [],
    }
  };
}

export default async function SoftwareDetailsPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = await params;
  const tool = await prisma.software.findUnique({
    where: { slug: resolvedParams.slug },
    include: {
      category: true,
      reviews: {
        include: { author: true }
      }
    }
  });

  if (!tool) notFound();

  const avgRating = tool.reviews.length > 0 
    ? (tool.reviews.reduce((acc, rev) => acc + rev.rating, 0) / tool.reviews.length).toFixed(1)
    : "Нет оценок";

  const session = await auth();
  const userRating = session?.user?.id 
    ? tool.reviews.find(r => r.authorId === session.user.id)?.rating || 0
    : 0;

  // Generate JSON-LD Schema
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": tool.name,
    "operatingSystem": tool.platforms || "Windows",
    "applicationCategory": tool.category.name,
    "description": tool.shortDesc,
    "image": tool.logoUrl || "",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    },
    "aggregateRating": tool.reviews.length > 0 ? {
      "@type": "AggregateRating",
      "ratingValue": avgRating,
      "reviewCount": tool.reviews.length
    } : undefined
  };

  // Update views in background
  // prisma.software.update({
  //   where: { id: tool.id },
  //   data: { views: { increment: 1 } },
  // }).catch(console.error);

  // If this is an AI model, use the dedicated AI layout instead of the Software layout
  if (tool.isAi) {
    return (
      <>
        <Header />
        <AiModelLayout 
          tool={tool} 
          relatedModels={<RelatedModels categoryId={tool.categoryId} currentSoftwareId={tool.id} />} 
        />
        <Footer />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col font-sans">
      {/* JSON-LD Microdata */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      
      <Header />
      <main className="flex-1 container mx-auto max-w-4xl py-12 px-4 md:px-6">
        <Link href="/software" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-8 transition-colors group">
          <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" /> Глобальный каталог ПО
        </Link>

        <div className="bg-card rounded-3xl border border-border/40 p-8 md:p-10 shadow-sm hover:shadow-md transition-shadow mb-12">
          <div className="flex flex-col md:flex-row items-start gap-8">
            <div className="w-32 h-32 rounded-3xl bg-white dark:bg-zinc-100 flex items-center justify-center shrink-0 overflow-hidden shadow-sm border border-border/50 p-4">
              <FallbackImage 
                src={tool.logoUrl || undefined} 
                alt={tool.name} 
                className="w-full h-full object-contain" 
                fallback={<span className="text-4xl font-bold text-muted-foreground">{tool.name.charAt(0)}</span>} 
              />
            </div>
            
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-3 mb-4">
                <span className="px-3 py-1 rounded-full bg-secondary text-sm font-medium border border-border/50">
                  {tool.category.name}
                </span>
                <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">
                  {tool.pricing}
                </span>
                <div className="flex items-center text-amber-500 font-medium text-sm px-3 py-1 bg-amber-500/10 rounded-full">
                  <Star className="w-4 h-4 mr-1 fill-current" /> {avgRating}
                </div>
              </div>
              
              <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4">{tool.name}</h1>
              
              <div className="mb-6">
                <RatingWidget 
                  softwareId={tool.id} 
                  initialRating={userRating} 
                  totalRatings={tool.reviews.length} 
                />
              </div>

              <p className="text-xl text-muted-foreground mb-8 leading-relaxed font-light">
                {tool.shortDesc}
              </p>
              
              <div className="flex flex-wrap gap-4 pt-4">
                {tool.websiteUrl && (
                  <Button asChild size="lg" className="rounded-full shadow-md font-medium px-8 hover:scale-105 transition-transform duration-300">
                    <a href={tool.websiteUrl} target="_blank" rel="noopener noreferrer">
                      {tool.isAi ? "Перейти к модели" : "Официальный сайт"} <ExternalLink className="w-4 h-4 ml-2" />
                    </a>
                  </Button>
                )}
                
                {!tool.isAi && tool.localDownloadUrl && (
                  <Button asChild size="lg" variant="secondary" className="rounded-full shadow-md font-medium px-8 bg-green-500/10 text-green-600 hover:bg-green-500/20 border-green-500/20">
                    <a href={tool.localDownloadUrl}>
                      Скачать с сервера <DownloadCloud className="w-4 h-4 ml-2" />
                    </a>
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Screenshots Gallery - Moved Above Description */}
        {tool.screenshots && (() => {
          try {
            const screens = JSON.parse(tool.screenshots) as string[];
            if (screens.length > 0) {
              return <ScreenshotGallery screenshots={screens} name={tool.name} />;
            }
          } catch(e) { return null; }
          return null;
        })()}

        <div className="mb-16">
          <h2 className="text-2xl font-bold mb-6">О программе</h2>
          <div className="prose prose-lg dark:prose-invert max-w-none bg-card rounded-3xl border border-border/40 p-8 md:p-10 shadow-sm">
            <ExpandableText maxHeight={400}>
              <div className="text-foreground leading-loose">
                <ReactMarkdown 
                  remarkPlugins={[remarkGfm]}
                  components={{
                    h1: ({node, ...props}) => <h2 {...props} />
                  }}
                >
                  {tool.description}
                </ReactMarkdown>
              </div>
            </ExpandableText>
          </div>
        </div>

        <CommentSection softwareId={tool.id} />
      </main>
      <Footer />
    </div>
  );
}
