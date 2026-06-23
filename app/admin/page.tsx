import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { AdminSoftwareTable } from "./components/admin-software-table";

export const dynamic = "force-dynamic";

interface AdminPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function AdminPage({ searchParams }: AdminPageProps) {
  const params = await searchParams;
  const currentType = typeof params.type === 'string' ? params.type : 'all';

  const whereClause: any = {};
  if (currentType === 'software') {
    whereClause.isAi = false;
  } else if (currentType === 'ai') {
    whereClause.isAi = true;
  }

  const software = await prisma.software.findMany({
    where: whereClause,
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

      <div className="flex items-center gap-2 mb-6 border-b border-border/40 pb-4">
        <Link 
          href="/admin?type=all" 
          className={`px-4 py-2 text-sm font-medium rounded-full transition-colors ${currentType === 'all' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-secondary'}`}
        >
          Все записи
        </Link>
        <Link 
          href="/admin?type=ai" 
          className={`px-4 py-2 text-sm font-medium rounded-full transition-colors ${currentType === 'ai' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-secondary'}`}
        >
          Нейросети
        </Link>
        <Link 
          href="/admin?type=software" 
          className={`px-4 py-2 text-sm font-medium rounded-full transition-colors ${currentType === 'software' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-secondary'}`}
        >
          Программы
        </Link>
      </div>

      <AdminSoftwareTable software={software} />
    </div>
  );
}
