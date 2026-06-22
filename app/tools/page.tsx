import { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Search, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Каталог нейросетей и ПО",
  description: "Огромная база нейросетей, AI сервисов и программ для работы с искусственным интеллектом.",
};

export default async function ToolsDirectoryPage() {
  const categories = await prisma.softwareCategory.findMany({
    orderBy: { name: 'asc' }
  });

  const tools = await prisma.software.findMany({
    include: { category: true },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="min-h-screen bg-background flex flex-col font-sans">
      <Header />
      <main className="flex-1 container mx-auto max-w-6xl py-16 px-4 md:px-6">
        <div className="flex flex-col items-center text-center space-y-4 mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary mb-4 text-sm font-medium">
            <Sparkles className="w-4 h-4" />
            <span>Каталог AI сервисов</span>
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight">
            Все нейросети в одном месте
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mt-4 leading-relaxed font-light">
            Найдите лучший инструмент для своих задач. Сравнивайте, читайте отзывы и выбирайте подходящий ИИ.
          </p>
          
          <div className="w-full max-w-xl mt-8 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input 
              placeholder="Поиск нейросети... (например: ChatGPT)" 
              className="w-full pl-12 pr-4 py-6 text-lg rounded-full bg-secondary/50 border-border/50 focus-visible:ring-primary shadow-sm"
            />
          </div>
        </div>

        {categories.length === 0 && tools.length === 0 && (
          <div className="text-center py-20 bg-secondary/20 rounded-3xl border border-border/50">
            <h3 className="text-2xl font-semibold mb-2">Каталог пока пуст</h3>
            <p className="text-muted-foreground">Мы уже работаем над заполнением базы лучшими нейросетями.</p>
          </div>
        )}

        {/* Categories / Tabs placeholder */}
        {categories.length > 0 && (
          <div className="flex flex-wrap gap-3 mb-12 justify-center items-center">
            <Button variant="default" className="rounded-full px-6 shadow-sm font-medium text-sm">
              Все категории
            </Button>
            {categories.map(cat => (
              <Button 
                key={cat.id} 
                variant="outline" 
                className="rounded-full px-5 border-border/40 bg-secondary/30 hover:bg-secondary/60 text-foreground/80 hover:text-foreground shadow-sm transition-all"
              >
                <span className="mr-2 text-lg">{cat.icon}</span> {cat.name}
              </Button>
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {tools.map((tool) => (
            <Link href={`/tools/${tool.slug}`} key={tool.id} className="group flex flex-col p-6 rounded-3xl bg-card border border-border/40 shadow-sm hover:shadow-lg transition-all duration-300 hover:border-primary/30 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative z-10 flex items-start gap-4 mb-4">
                <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center shrink-0 overflow-hidden shadow-inner border border-border/50 group-hover:scale-105 transition-transform duration-500">
                  {tool.logoUrl ? (
                    <img src={tool.logoUrl} alt={tool.name} className="w-full h-full object-cover" />
                  ) : (
                    <Sparkles className="w-8 h-8 text-muted-foreground" />
                  )}
                </div>
                <div>
                  <h3 className="text-xl font-bold group-hover:text-primary transition-colors">{tool.name}</h3>
                  <span className="inline-block px-2.5 py-0.5 rounded-full bg-secondary text-xs font-medium text-muted-foreground mt-1.5 border border-border/50">
                    {tool.category.name}
                  </span>
                </div>
              </div>
              
              <p className="text-muted-foreground line-clamp-2 text-sm flex-1 mb-5 relative z-10 leading-relaxed">
                {tool.shortDesc}
              </p>
              
              <div className="flex items-center justify-between mt-auto pt-4 border-t border-border/30 relative z-10">
                <span className="font-semibold text-sm px-3 py-1 rounded-full bg-primary/10 text-primary">
                  {tool.pricing}
                </span>
                <span className="text-primary text-sm font-medium opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
                  Подробнее →
                </span>
              </div>
            </Link>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}
