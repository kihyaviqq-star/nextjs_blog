import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Sparkles, ArrowRight } from "lucide-react";

export async function RelatedModels({ categoryId, currentSoftwareId }: { categoryId: string, currentSoftwareId: string }) {
  const related = await prisma.software.findMany({
    where: {
      isAi: true,
      categoryId: categoryId,
      id: { not: currentSoftwareId }
    },
    take: 3,
    orderBy: { createdAt: 'desc' }
  });

  if (related.length === 0) return null;

  return (
    <div className="mb-16">
      <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <Sparkles className="w-5 h-5 text-primary" /> Похожие нейросети
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {related.map(model => (
          <Link href={`/tools/${model.slug}`} key={model.id} className="group p-5 rounded-3xl bg-card border border-border/40 hover:border-primary/30 transition-all flex flex-col h-full shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center shrink-0 border border-border/50">
                {model.logoUrl ? (
                  <img src={model.logoUrl} alt={model.name} className="w-full h-full object-cover rounded-xl" />
                ) : (
                  <Sparkles className="w-6 h-6 text-muted-foreground" />
                )}
              </div>
              <div>
                <h3 className="font-bold text-lg group-hover:text-primary transition-colors line-clamp-1">{model.name}</h3>
                <span className="text-xs text-muted-foreground font-medium px-2 py-0.5 bg-secondary rounded-full">
                  {model.developer || "AI Model"}
                </span>
              </div>
            </div>
            <p className="text-sm text-muted-foreground line-clamp-2 mb-4 flex-1">
              {model.shortDesc}
            </p>
            <div className="flex items-center justify-between mt-auto pt-4 border-t border-border/20">
              <span className="font-semibold text-xs px-2.5 py-1 rounded-full bg-primary/10 text-primary">
                {model.pricing}
              </span>
              <span className="text-primary text-xs font-medium flex items-center gap-1 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all">
                Смотреть <ArrowRight className="w-3 h-3" />
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
