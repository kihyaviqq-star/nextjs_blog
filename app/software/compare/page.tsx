import { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import Image from "next/image";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { StarRating } from "@/components/star-rating";
import {
  ArrowLeft,
  Download,
  ExternalLink,
  Scale,
  Globe,
  HardDrive,
  CheckCircle,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Сравнение программ и софта",
  description: "Сравните характеристики, системные требования, лицензии и возможности программ.",
};

interface ComparePageProps {
  searchParams: Promise<{ ids?: string }>;
}

export default async function SoftwareComparePage({ searchParams }: ComparePageProps) {
  const params = await searchParams;
  const idsString = params.ids || "";
  const ids = idsString.split(",").filter(Boolean);

  const softwareList = ids.length > 0
    ? await prisma.software.findMany({
        where: {
          id: { in: ids },
          isAi: false,
        },
        include: {
          category: true,
          reviews: {
            select: { rating: true },
          },
        },
      })
    : [];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="container mx-auto px-4 py-8 flex-1 max-w-7xl">
        {/* Back and Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <Link href="/software">
              <Button variant="ghost" size="sm" className="gap-2 mb-2 -ml-2 text-muted-foreground">
                <ArrowLeft className="w-4 h-4" />
                В каталог программ
              </Button>
            </Link>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight flex items-center gap-2.5">
              <Download className="w-7 h-7 text-emerald-500" />
              Сравнение программ
            </h1>
            <p className="text-muted-foreground mt-1 text-sm sm:text-base">
              Сравнительный анализ платформ, лицензий, функционала и версий
            </p>
          </div>
        </div>

        {softwareList.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-border rounded-2xl bg-card/40">
            <Scale className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Программы для сравнения не выбраны</h3>
            <p className="text-muted-foreground max-w-md mx-auto mb-6 text-sm">
              Перейдите в каталог программ и нажмите кнопку «Сравнить» на карточках интересующего софта.
            </p>
            <Button asChild>
              <Link href="/software">Перейти в каталог</Link>
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto pb-6">
            <div className="min-w-[700px]">
              {/* Cards Grid */}
              <div
                className="grid gap-4"
                style={{
                  gridTemplateColumns: `repeat(${softwareList.length}, minmax(240px, 1fr))`,
                }}
              >
                {softwareList.map((sw) => {
                  let parsedPlatforms: string[] = [];
                  let parsedTags: string[] = [];

                  try {
                    parsedPlatforms = sw.platforms ? JSON.parse(sw.platforms) : [];
                  } catch {}

                  try {
                    parsedTags = sw.tags ? JSON.parse(sw.tags) : [];
                  } catch {}

                  const avgRating =
                    sw.reviews.length > 0
                      ? sw.reviews.reduce((sum, r) => sum + r.rating, 0) / sw.reviews.length
                      : null;

                  return (
                    <div
                      key={sw.id}
                      className="rounded-2xl border border-border/80 bg-card p-5 flex flex-col justify-between shadow-sm space-y-4"
                    >
                      <div>
                        {/* Logo & Category */}
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div className="w-12 h-12 rounded-xl bg-secondary/80 border border-border/60 flex items-center justify-center overflow-hidden shrink-0">
                            {sw.logoUrl ? (
                              <Image
                                src={sw.logoUrl}
                                alt={sw.name}
                                width={48}
                                height={48}
                                className="w-10 h-10 object-contain"
                                unoptimized
                              />
                            ) : (
                              <Download className="w-6 h-6 text-emerald-500" />
                            )}
                          </div>
                          <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-medium">
                            {sw.pricing || "Free"}
                          </span>
                        </div>

                        <h3 className="text-lg font-bold text-foreground mb-1">
                          <Link href={`/software/${sw.slug}`} className="hover:text-emerald-500 transition-colors">
                            {sw.name}
                          </Link>
                        </h3>

                        <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
                          {sw.shortDesc || sw.description}
                        </p>

                        {/* Rating */}
                        {avgRating ? (
                          <div className="flex items-center gap-1.5 mb-2">
                            <StarRating rating={Math.round(avgRating)} size={14} />
                            <span className="text-xs font-semibold">{avgRating.toFixed(1)}</span>
                            <span className="text-[11px] text-muted-foreground">({sw.reviews.length})</span>
                          </div>
                        ) : (
                          <div className="text-xs text-muted-foreground mb-2">Нет оценок</div>
                        )}
                      </div>

                      {/* Links */}
                      <div className="space-y-2 pt-2 border-t border-border/50">
                        {sw.localDownloadUrl ? (
                          <Button asChild size="sm" className="w-full gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700">
                            <a href={sw.localDownloadUrl} target="_blank" rel="noopener noreferrer">
                              <Download className="w-3.5 h-3.5" />
                              Скачать
                            </a>
                          </Button>
                        ) : sw.websiteUrl ? (
                          <Button asChild variant="outline" size="sm" className="w-full gap-1.5 text-xs">
                            <a href={sw.websiteUrl} target="_blank" rel="noopener noreferrer">
                              <Globe className="w-3.5 h-3.5" />
                              Официальный сайт
                            </a>
                          </Button>
                        ) : null}
                        <Button asChild variant="secondary" size="sm" className="w-full text-xs">
                          <Link href={`/software/${sw.slug}`}>
                            Подробнее
                          </Link>
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Detailed Comparison Table */}
              <div className="mt-8 rounded-2xl border border-border/80 bg-card/60 backdrop-blur overflow-hidden shadow-sm">
                <div className="p-4 bg-muted/40 font-semibold text-sm border-b border-border/60">
                  Сравнительная таблица характеристик
                </div>

                <div className="divide-y divide-border/60 text-sm">
                  {/* Category */}
                  <div
                    className="grid p-4 items-center gap-4"
                    style={{ gridTemplateColumns: `repeat(${softwareList.length}, minmax(240px, 1fr))` }}
                  >
                    {softwareList.map((s) => (
                      <div key={s.id}>
                        <span className="text-xs text-muted-foreground block font-medium">Категория</span>
                        <span className="font-medium text-foreground">{s.category?.name || "—"}</span>
                      </div>
                    ))}
                  </div>

                  {/* Developer */}
                  <div
                    className="grid p-4 items-center gap-4"
                    style={{ gridTemplateColumns: `repeat(${softwareList.length}, minmax(240px, 1fr))` }}
                  >
                    {softwareList.map((s) => (
                      <div key={s.id}>
                        <span className="text-xs text-muted-foreground block font-medium">Разработчик</span>
                        <span className="font-medium text-foreground">{s.developer || "—"}</span>
                      </div>
                    ))}
                  </div>

                  {/* Size */}
                  <div
                    className="grid p-4 items-center gap-4"
                    style={{ gridTemplateColumns: `repeat(${softwareList.length}, minmax(240px, 1fr))` }}
                  >
                    {softwareList.map((s) => (
                      <div key={s.id}>
                        <span className="text-xs text-muted-foreground block font-medium">Размер файла</span>
                        <span className="font-medium text-foreground">{s.size || "—"}</span>
                      </div>
                    ))}
                  </div>

                  {/* License */}
                  <div
                    className="grid p-4 items-center gap-4"
                    style={{ gridTemplateColumns: `repeat(${softwareList.length}, minmax(240px, 1fr))` }}
                  >
                    {softwareList.map((s) => (
                      <div key={s.id}>
                        <span className="text-xs text-muted-foreground block font-medium">Тип лицензии</span>
                        <span className="font-medium text-foreground">{s.licenseType || "Бесплатная"}</span>
                      </div>
                    ))}
                  </div>

                  {/* Platforms */}
                  <div
                    className="grid p-4 items-center gap-4"
                    style={{ gridTemplateColumns: `repeat(${softwareList.length}, minmax(240px, 1fr))` }}
                  >
                    {softwareList.map((s) => {
                      let plats: string[] = [];
                      try {
                        plats = s.platforms ? JSON.parse(s.platforms) : [];
                      } catch {}
                      return (
                        <div key={s.id}>
                          <span className="text-xs text-muted-foreground block font-medium mb-1">Поддерживаемые ОС</span>
                          <div className="flex flex-wrap gap-1">
                            {plats.length > 0 ? (
                              plats.map((p, idx) => (
                                <span key={idx} className="text-[11px] px-2 py-0.5 rounded bg-secondary text-foreground font-medium">
                                  {p}
                                </span>
                              ))
                            ) : (
                              <span className="text-muted-foreground text-xs">Windows / macOS</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
