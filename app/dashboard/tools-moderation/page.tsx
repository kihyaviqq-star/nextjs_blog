import { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  ShieldCheck,
  CheckCircle,
  XCircle,
  Trash2,
  ExternalLink,
  Sparkles,
  Download,
  Clock,
  User,
  ArrowLeft,
} from "lucide-react";
import { ToolModerationActions } from "./actions-client";

export const metadata: Metadata = {
  title: "Модерация инструментов | Панель управления",
};

export default async function ToolsModerationPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/auth/signin");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  if (!user || (user.role !== "ADMIN" && user.role !== "EDITOR")) {
    redirect("/dashboard");
  }

  const [pendingTools, approvedCount, rejectedCount] = await Promise.all([
    prisma.software.findMany({
      where: { status: "PENDING" },
      include: { category: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.software.count({ where: { status: "APPROVED" } }),
    prisma.software.count({ where: { status: "REJECTED" } }),
  ]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="container mx-auto px-4 py-8 flex-1 max-w-6xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <Link href="/dashboard">
              <Button variant="ghost" size="sm" className="gap-2 mb-2 -ml-2 text-muted-foreground">
                <ArrowLeft className="w-4 h-4" />
                В панель управления
              </Button>
            </Link>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2.5">
              <ShieldCheck className="w-7 h-7 text-primary" />
              Модерация предложенных инструментов
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Проверка и публикация инструментов, отправленных пользователями
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-500 text-xs font-semibold">
              Ожидают: {pendingTools.length}
            </div>
            <div className="px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs font-semibold">
              Одобрено: {approvedCount}
            </div>
          </div>
        </div>

        {pendingTools.length === 0 ? (
          <div className="text-center py-16 border border-dashed border-border rounded-2xl bg-card/40">
            <CheckCircle className="w-12 h-12 mx-auto text-emerald-500/60 mb-3" />
            <h3 className="text-lg font-semibold mb-1">Все чисто!</h3>
            <p className="text-muted-foreground text-sm max-w-md mx-auto">
              На данный момент нет новых заявок, ожидающих проверки.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {pendingTools.map((tool) => (
              <div
                key={tool.id}
                className="rounded-2xl border border-border/80 bg-card p-5 sm:p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6"
              >
                <div className="space-y-3 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${
                        tool.isAi
                          ? "bg-purple-500/10 text-purple-400 border border-purple-500/20"
                          : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                      }`}
                    >
                      {tool.isAi ? "Нейросеть (ИИ)" : "ПО / Софт"}
                    </span>
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-secondary text-foreground font-medium">
                      {tool.category?.name}
                    </span>
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                      {tool.pricing}
                    </span>
                    <span className="text-xs text-muted-foreground flex items-center gap-1 ml-auto sm:ml-0">
                      <Clock className="w-3 h-3" />
                      {new Date(tool.createdAt).toLocaleDateString("ru-RU")}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
                      {tool.name}
                      {tool.websiteUrl && (
                        <a
                          href={tool.websiteUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-muted-foreground hover:text-primary transition-colors"
                          title="Открыть сайт"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}
                    </h3>
                    <p className="text-sm text-foreground/90 mt-1">{tool.shortDesc}</p>
                    {tool.description && (
                      <p className="text-xs text-muted-foreground mt-2 line-clamp-2 bg-secondary/30 p-2.5 rounded-lg">
                        {tool.description}
                      </p>
                    )}
                  </div>

                  {tool.submittedBy && (
                    <div className="text-xs text-muted-foreground flex items-center gap-1.5 pt-1">
                      <User className="w-3.5 h-3.5" />
                      <span>Предложил: <strong className="text-foreground">{tool.submittedBy}</strong></span>
                    </div>
                  )}
                </div>

                <ToolModerationActions toolId={tool.id} />
              </div>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
