import { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Search, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";

import { ToolsFilters } from "@/components/tools/tools-filters";

export const metadata: Metadata = {
  title: "Каталог нейросетей и ПО",
  description: "Огромная база нейросетей, AI сервисов и программ для работы с искусственным интеллектом.",
};

interface ToolsPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function ToolsDirectoryPage({ searchParams }: ToolsPageProps) {
  const params = await searchParams;
  const search = typeof params.search === 'string' ? params.search : '';
  const category = typeof params.category === 'string' ? params.category : '';
  const developer = typeof params.developer === 'string' ? params.developer : '';
  const pricing = typeof params.pricing === 'string' ? params.pricing : '';
  const licenseType = typeof params.license === 'string' ? params.license : '';
  const featuresParam = typeof params.features === 'string' ? params.features : '';
  const features = featuresParam ? featuresParam.split(',') : [];

  const whereClause: any = {
    isAi: true
  };
  
  if (search) {
    whereClause.OR = [
      { name: { contains: search.toLowerCase() } },
      { shortDesc: { contains: search.toLowerCase() } },
    ];
  }

  if (category && category !== 'all') {
    whereClause.category = { slug: category };
  }

  if (developer && developer !== 'all') {
    whereClause.developer = developer;
  }

  if (pricing && pricing !== 'all') {
    whereClause.pricing = pricing;
  }

  if (licenseType && licenseType !== 'all') {
    whereClause.licenseType = licenseType;
  }

  if (features.length > 0) {
    whereClause.AND = features.map(feat => ({
      aiSpecs: { contains: feat }
    }));
  }

  const ITEMS_PER_PAGE = 24;
  const pageParam = typeof params.page === 'string' ? params.page : '1';
  const currentPage = Math.max(1, parseInt(pageParam, 10) || 1);

  const [categories, totalItems, tools, distinctDevelopers, distinctPricing, distinctLicenses] = await Promise.all([
    prisma.softwareCategory.findMany({
      where: {
        tools: {
          some: { isAi: true }
        }
      },
      orderBy: { name: 'asc' }
    }),
    prisma.software.count({ where: whereClause }),
    prisma.software.findMany({
      where: whereClause,
      include: { category: true },
      orderBy: { createdAt: 'desc' },
      skip: (currentPage - 1) * ITEMS_PER_PAGE,
      take: ITEMS_PER_PAGE,
    }),
    prisma.software.findMany({
      where: { isAi: true, developer: { not: null } },
      select: { developer: true },
      distinct: ['developer']
    }),
    prisma.software.findMany({
      where: { isAi: true, pricing: { not: "" } },
      select: { pricing: true },
      distinct: ['pricing']
    }),
    prisma.software.findMany({
      where: { isAi: true, licenseType: { not: null } },
      select: { licenseType: true },
      distinct: ['licenseType']
    })
  ]);

  const developers = distinctDevelopers.map(d => d.developer).filter(Boolean) as string[];
  const pricings = distinctPricing.map(p => p.pricing).filter(Boolean) as string[];
  const licenses = distinctLicenses.map(l => l.licenseType).filter(Boolean) as string[];

  const filterOptions = {
    developers: developers.sort(),
    pricings: pricings.sort(),
    licenses: licenses.sort(),
  };

  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);

  return (
    <div className="min-h-screen bg-background flex flex-col font-sans">
      <Header />
      <main className="flex-1 container mx-auto max-w-6xl py-16 px-4 md:px-6">
        <div className="flex flex-col items-center text-center space-y-4 mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary mb-4 text-sm font-medium">
            <Sparkles className="w-4 h-4" />
            <span>Каталог AI сервисов</span>
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight">
            Все нейросети в одном месте
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mt-4 leading-relaxed font-light mb-8">
            Найдите лучший инструмент для своих задач. Сравнивайте, читайте отзывы и выбирайте подходящий ИИ.
          </p>
        </div>

        <div className="mb-16">
          <ToolsFilters categories={categories} filterOptions={filterOptions} />
        </div>

        {categories.length === 0 && tools.length === 0 && !search && !category && (
          <div className="text-center py-20 bg-secondary/20 rounded-3xl border border-border/50">
            <h3 className="text-2xl font-semibold mb-2">Каталог пока пуст</h3>
            <p className="text-muted-foreground">Мы уже работаем над заполнением базы лучшими нейросетями.</p>
          </div>
        )}

        {(search || category) && tools.length === 0 && (
          <div className="text-center py-20">
            <Search className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="text-2xl font-semibold mb-2">Ничего не найдено</h3>
            <p className="text-muted-foreground">По вашему запросу не нашлось подходящих программ. Попробуйте изменить фильтры.</p>
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

        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-16 mb-8">
            {currentPage > 1 && (
              <Button asChild variant="outline" className="rounded-full shadow-sm">
                <Link href={`/tools?${new URLSearchParams({ ...params as any, page: (currentPage - 1).toString() }).toString()}`}>
                  Назад
                </Link>
              </Button>
            )}
            
            <div className="flex items-center gap-1 mx-4">
              <span className="text-sm font-medium">Страница {currentPage}</span>
              <span className="text-sm text-muted-foreground">из {totalPages}</span>
            </div>

            {currentPage < totalPages && (
              <Button asChild variant="outline" className="rounded-full shadow-sm">
                <Link href={`/tools?${new URLSearchParams({ ...params as any, page: (currentPage + 1).toString() }).toString()}`}>
                  Вперед
                </Link>
              </Button>
            )}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
