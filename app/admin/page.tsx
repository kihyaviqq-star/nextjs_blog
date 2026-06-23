import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ExternalLink, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const software = await prisma.software.findMany({
    orderBy: { createdAt: "desc" },
    include: { category: true }
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">База Программ</h1>
        <span className="bg-secondary px-3 py-1 rounded-full text-sm font-medium">
          Всего: {software.length}
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-border/40 text-muted-foreground">
              <th className="py-3 px-4 font-medium">Название</th>
              <th className="py-3 px-4 font-medium">Категория</th>
              <th className="py-3 px-4 font-medium">Ссылки</th>
              <th className="py-3 px-4 font-medium text-right">Действия</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/20">
            {software.map((item) => (
              <tr key={item.id} className="hover:bg-muted/50 transition-colors">
                <td className="py-3 px-4">
                  <div className="font-semibold">{item.name}</div>
                  <div className="text-xs text-muted-foreground">{item.isAi ? "Нейросеть" : "ПО"}</div>
                </td>
                <td className="py-3 px-4 text-muted-foreground">
                  {item.category.name}
                </td>
                <td className="py-3 px-4">
                  <div className="flex flex-col gap-1">
                    {item.websiteUrl ? (
                      <a href={item.websiteUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center text-xs">
                        Оф. сайт <ExternalLink className="w-3 h-3 ml-1" />
                      </a>
                    ) : (
                      <span className="text-xs text-muted-foreground italic">Нет сайта</span>
                    )}
                    {item.localDownloadUrl ? (
                      <span className="text-green-500 font-medium text-xs">Есть локальный файл</span>
                    ) : (
                      <span className="text-destructive font-medium text-xs">Нет локального файла</span>
                    )}
                  </div>
                </td>
                <td className="py-3 px-4 text-right">
                  <Button asChild size="sm" variant="outline" className="rounded-full shadow-sm">
                    <Link href={`/admin/edit/${item.id}`}>
                      <Edit className="w-4 h-4 mr-1" /> Изменить
                    </Link>
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
