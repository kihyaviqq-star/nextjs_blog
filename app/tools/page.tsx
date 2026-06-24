import { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Search, Sparkles, ChevronLeft, ChevronRight } from "lucide-react";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";

import { ToolsSidebar } from "@/components/tools/tools-sidebar";

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
  const view = typeof params.view === 'string' ? params.view : 'grid';
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

      <div className="bg-primary/5 py-12 border-b border-border/40">
        <div className="container mx-auto max-w-7xl px-4 md:px-6">
          <div className="flex flex-col md:flex-row items-center gap-6 text-center md:text-left">
            <div className="w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20 text-primary">
              <Sparkles className="w-10 h-10" />
            </div>
            <div>
              <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-2">
                Каталог ИИ-Моделей
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl font-light">
                Все нейросети в одном месте. Находите инструменты для текста, картинок и кода.
              </p>
            </div>
          </div>
        </div>
      </div>

      <main className="flex-1 container mx-auto max-w-7xl py-12 px-4 md:px-6 flex flex-col md:flex-row gap-8">
        
        {/* SIDEBAR */}
        <aside className="w-full md:w-72 shrink-0">
          <ToolsSidebar categories={categories} filterOptions={filterOptions} />
        </aside>

        {/* MAIN CONTENT */}
        <div className="flex-1 min-w-0">
          
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold">
              {category && category !== 'all' 
                ? categories.find(c => c.slug === category)?.name 
                : search 
                  ? `Результаты поиска: "${search}"` 
                  : "Все нейросети"}
            </h2>
            <span className="text-muted-foreground font-medium bg-secondary px-3 py-1 rounded-full text-sm">
              Найдено: {totalItems}
            </span>
          </div>

          {categories.length === 0 && tools.length === 0 && !search && !category && (
            <div className="text-center py-20 bg-secondary/20 rounded-3xl border border-border/50">
              <h3 className="text-2xl font-semibold mb-2">Каталог пока пуст</h3>
              <p className="text-muted-foreground">Мы уже работаем над заполнением базы лучшими нейросетями.</p>
            </div>
          )}

          {(search || category) && tools.length === 0 && (
            <div className="text-center py-20 border border-dashed border-border/60 rounded-3xl">
              <Search className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
              <h3 className="text-2xl font-semibold mb-2">Ничего не найдено</h3>
              <p className="text-muted-foreground">По вашему запросу не нашлось подходящих нейросетей. Попробуйте изменить фильтры.</p>
            </div>
          )}

          {/* LIST VIEW */}
          {view === 'list' && tools.length > 0 && (
            <div className="flex flex-col gap-4">
              {tools.map((tool) => (
                <Link href={`/tools/${tool.slug}`} key={tool.id} className="group flex flex-col sm:flex-row items-center sm:items-start gap-6 p-5 rounded-3xl bg-card border border-border/40 shadow-sm hover:shadow-md transition-all duration-300 hover:border-primary/30 relative overflow-hidden">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-secondary flex items-center justify-center shrink-0 overflow-hidden shadow-inner border border-border/50 group-hover:scale-105 transition-transform duration-500">
                    {tool.logoUrl ? (
                      <img src={tool.logoUrl} alt={tool.name} className="w-full h-full object-cover" />
                    ) : (
                      <Sparkles className="w-8 h-8 sm:w-10 sm:h-10 text-muted-foreground" />
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0 flex flex-col items-center sm:items-start text-center sm:text-left">
                    <h3 className="text-xl font-bold group-hover:text-primary transition-colors truncate w-full">{tool.name}</h3>
                    <p className="text-muted-foreground text-sm line-clamp-2 leading-relaxed mt-1 mb-3">
                      {tool.shortDesc}
                    </p>
                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-auto">
                      <span className="px-2.5 py-0.5 rounded-full bg-secondary text-xs font-medium text-muted-foreground border border-border/50">
                        {tool.category.name}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium">
                        {tool.pricing}
                      </span>
                      <span className="text-primary text-sm font-medium opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 ml-auto">
                        Подробнее →
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* GRID VIEW */}
          {view === 'grid' && tools.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
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
                      <h3 className="text-lg font-bold group-hover:text-primary transition-colors line-clamp-2">{tool.name}</h3>
                      <span className="inline-block px-2.5 py-0.5 rounded-full bg-secondary text-xs font-medium text-muted-foreground mt-1.5 border border-border/50">
                        {tool.category.name}
                      </span>
                    </div>
                  </div>
                  
                  <p className="text-muted-foreground line-clamp-3 text-sm flex-1 mb-5 relative z-10 leading-relaxed">
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
          )}

          {/* PAGINATION */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-12 mb-4">
              <Button 
                variant="outline" 
                size="icon" 
                className="rounded-full w-10 h-10 shadow-sm"
                asChild
                disabled={currentPage <= 1}
              >
                {currentPage <= 1 ? (
                  <span><ChevronLeft className="w-5 h-5" /></span>
                ) : (
                  <Link href={`/tools?${new URLSearchParams({ ...params as any, page: (currentPage - 1).toString() }).toString()}`}>
                    <ChevronLeft className="w-5 h-5" />
                  </Link>
                )}
              </Button>
              
              <div className="flex items-center gap-1 mx-2">
                {Array.from({ length: totalPages }).map((_, i) => {
                  const pageNum = i + 1;
                  if (
                    pageNum === 1 || 
                    pageNum === totalPages || 
                    (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                  ) {
                    return (
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? "default" : "ghost"}
                        size="sm"
                        className={`w-10 h-10 rounded-full font-medium ${currentPage !== pageNum ? "text-muted-foreground" : "shadow-sm"}`}
                        asChild
                      >
                        <Link href={`/tools?${new URLSearchParams({ ...params as any, page: pageNum.toString() }).toString()}`}>
                          {pageNum}
                        </Link>
                      </Button>
                    );
                  } else if (
                    pageNum === currentPage - 2 || 
                    pageNum === currentPage + 2
                  ) {
                    return <span key={pageNum} className="text-muted-foreground px-1">...</span>;
                  }
                  return null;
                })}
              </div>

              <Button 
                variant="outline" 
                size="icon" 
                className="rounded-full w-10 h-10 shadow-sm"
                asChild
                disabled={currentPage >= totalPages}
              >
                {currentPage >= totalPages ? (
                  <span><ChevronRight className="w-5 h-5" /></span>
                ) : (
                  <Link href={`/tools?${new URLSearchParams({ ...params as any, page: (currentPage + 1).toString() }).toString()}`}>
                    <ChevronRight className="w-5 h-5" />
                  </Link>
                )}
              </Button>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
