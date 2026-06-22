import { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ExternalLink, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const tool = await prisma.software.findUnique({ where: { slug: params.slug } });
  if (!tool) return { title: "Не найдено" };
  
  return {
    title: `${tool.name} — Обзор нейросети`,
    description: tool.shortDesc,
  };
}

export default async function ToolDetailsPage({ params }: { params: { slug: string } }) {
  const tool = await prisma.software.findUnique({
    where: { slug: params.slug },
    include: {
      category: true,
      reviews: {
        include: { author: true }
      }
    }
  });

  if (!tool) notFound();

  // Calculate average rating
  const avgRating = tool.reviews.length > 0 
    ? (tool.reviews.reduce((acc, rev) => acc + rev.rating, 0) / tool.reviews.length).toFixed(1)
    : "Нет оценок";

  return (
    <div className="min-h-screen bg-background flex flex-col font-sans">
      <Header />
      <main className="flex-1 container mx-auto max-w-4xl py-12 px-4 md:px-6">
        <Link href="/tools" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-8 transition-colors group">
          <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" /> Назад в каталог
        </Link>

        <div className="bg-card rounded-3xl border border-border/40 p-8 md:p-10 shadow-sm hover:shadow-md transition-shadow mb-12">
          <div className="flex flex-col md:flex-row items-start gap-8">
            <div className="w-32 h-32 rounded-3xl bg-secondary flex items-center justify-center shrink-0 overflow-hidden shadow-inner border border-border/50">
              {tool.logoUrl ? (
                <img src={tool.logoUrl} alt={tool.name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-4xl font-bold text-muted-foreground">{tool.name.charAt(0)}</span>
              )}
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
              <p className="text-xl text-muted-foreground mb-8 leading-relaxed font-light">
                {tool.shortDesc}
              </p>
              
              {tool.websiteUrl && (
                <Button asChild size="lg" className="rounded-full shadow-md font-medium px-8">
                  <a href={tool.websiteUrl} target="_blank" rel="noopener noreferrer">
                    Перейти на сайт <ExternalLink className="w-4 h-4 ml-2" />
                  </a>
                </Button>
              )}
            </div>
          </div>
        </div>

        <div className="prose prose-lg dark:prose-invert max-w-none mb-16 bg-card rounded-3xl border border-border/40 p-8 md:p-10 shadow-sm">
          <h2>О программе</h2>
          <div className="whitespace-pre-wrap leading-relaxed text-muted-foreground/90 font-light">
            {tool.description}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
