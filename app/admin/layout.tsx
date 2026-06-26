import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export const metadata = {
  title: "Панель Управления",
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/signin");
  }

  const email = session.user.email;
  const dbUser = email
    ? await prisma.user.findUnique({
        where: { email },
        select: { role: true },
      })
    : null;

  const userRole = dbUser?.role ?? ((session.user as any).role as string | undefined);
  
  if (userRole !== "ADMIN") {
    redirect("/");
  }

  return (
    <div className="min-h-screen bg-background flex flex-col font-sans">
      <Header />
      <div className="flex-1 container mx-auto py-8 px-4 flex flex-col md:flex-row gap-8">
        <aside className="w-full md:w-64 shrink-0">
          <div className="bg-card rounded-2xl border border-border/40 p-6 shadow-sm">
            <h2 className="font-bold text-lg mb-4">Админка</h2>
            <nav className="flex flex-col gap-2">
              <Link href="/admin" className="px-4 py-2 rounded-lg hover:bg-secondary text-muted-foreground transition-colors">
                База программ
              </Link>
              <Link href="/admin/automation" className="px-4 py-2 rounded-lg hover:bg-secondary text-muted-foreground transition-colors font-medium text-purple-500">
                Автоматизация
              </Link>
              <span className="px-4 py-2 rounded-lg text-muted-foreground transition-colors cursor-not-allowed opacity-50">
                Настройки
              </span>
            </nav>
          </div>
        </aside>
        
        <main className="flex-1 bg-card rounded-2xl border border-border/40 p-6 shadow-sm overflow-hidden">
          {children}
        </main>
      </div>
      <Footer />
    </div>
  );
}
