import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Users, FileText, Eye, TrendingUp, Calendar } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/signin");
  }

  const userRole = (session.user as any).role;
  const canAccess = userRole === "ADMIN" || userRole === "EDITOR";

  if (!canAccess) {
    redirect("/");
  }

  // Fetch analytics data
  const [totalUsers, totalPosts, postsData, topPosts] = await Promise.all([
    // Total users count
    prisma.user.count(),
    
    // Total posts count
    prisma.post.count(),
    
    // Get all posts for total views calculation
    prisma.post.aggregate({
      _sum: {
        views: true,
      },
    }),
    
    // Top 5 most viewed posts
    prisma.post.findMany({
      take: 5,
      orderBy: {
        views: "desc",
      },
      include: {
        author: {
          select: {
            name: true,
            username: true,
            avatarUrl: true,
          },
        },
      },
    }),
  ]);

  const totalViews = postsData._sum.views || 0;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Аналитика</h1>
          <p className="text-muted-foreground">
            Обзор статистики и популярных материалов
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-6 md:grid-cols-3 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Всего пользователей
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{totalUsers}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Зарегистрировано в системе
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Всего статей
              </CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{totalPosts}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Опубликовано материалов
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Всего просмотров
              </CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {totalViews.toLocaleString("ru-RU")}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Просмотров всех статей
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Top Posts Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              <CardTitle>🔥 Топ популярных статей</CardTitle>
            </div>
            <CardDescription>
              Самые просматриваемые материалы за все время
            </CardDescription>
          </CardHeader>
          <CardContent>
            {topPosts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 space-y-4">
                <FileText className="w-16 h-16 text-muted-foreground" />
                <p className="text-muted-foreground">Статьи еще не опубликованы</p>
              </div>
            ) : (
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[50px]">#</TableHead>
                      <TableHead className="min-w-[300px]">Статья</TableHead>
                      <TableHead className="w-[200px]">Автор</TableHead>
                      <TableHead className="w-[150px]">Дата публикации</TableHead>
                      <TableHead className="w-[120px] text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Eye className="w-4 h-4" />
                          <span>Просмотры</span>
                        </div>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {topPosts.map((post, index) => (
                      <TableRow key={post.id}>
                        <TableCell className="w-[50px] font-medium text-muted-foreground">
                          {index + 1}
                        </TableCell>
                        <TableCell className="min-w-[300px]">
                          <Link
                            href={`/${post.slug}`}
                            className="font-medium hover:text-primary transition-colors"
                          >
                            {post.title}
                          </Link>
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                            {post.excerpt}
                          </p>
                        </TableCell>
                        <TableCell className="w-[200px]">
                          <div className="flex items-center gap-2">
                            {post.author.avatarUrl ? (
                              <Image
                                src={post.author.avatarUrl}
                                alt={post.author.name || "User"}
                                width={32}
                                height={32}
                                className="rounded-full object-cover"
                                unoptimized={post.author.avatarUrl?.startsWith('http')}
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                                <span className="text-white font-semibold text-xs">
                                  {(post.author.name || "U").charAt(0).toUpperCase()}
                                </span>
                              </div>
                            )}
                            <div className="flex flex-col">
                              <span className="text-sm font-medium">
                                {post.author.name}
                              </span>
                              {post.author.username && (
                                <span className="text-xs text-muted-foreground font-mono">
                                  @{post.author.username}
                                </span>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="w-[150px] whitespace-nowrap">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Calendar className="w-4 h-4" />
                            <span>
                              {new Date(post.publishedAt).toLocaleDateString("ru-RU", {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              })}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="w-[120px] text-right">
                          <div className="flex items-center justify-end gap-2">
                            <span className="text-2xl font-bold">
                              {post.views.toLocaleString("ru-RU")}
                            </span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Быстрые действия</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link href="/dashboard/articles/create">
                <div className="flex items-center gap-2 p-3 rounded-lg hover:bg-secondary transition-colors cursor-pointer">
                  <FileText className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium">Создать статью</span>
                </div>
              </Link>
              <Link href="/dashboard/articles">
                <div className="flex items-center gap-2 p-3 rounded-lg hover:bg-secondary transition-colors cursor-pointer">
                  <FileText className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium">Управление статьями</span>
                </div>
              </Link>
              {userRole === "ADMIN" && (
                <Link href="/dashboard/users">
                  <div className="flex items-center gap-2 p-3 rounded-lg hover:bg-secondary transition-colors cursor-pointer">
                    <Users className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium">Управление пользователями</span>
                  </div>
                </Link>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Статистика</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Средняя популярность</span>
                <span className="font-semibold">
                  {totalPosts > 0
                    ? Math.round(totalViews / totalPosts).toLocaleString("ru-RU")
                    : 0}{" "}
                  просм./статья
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Самая популярная</span>
                <span className="font-semibold">
                  {topPosts[0]?.views.toLocaleString("ru-RU") || 0} просм.
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Статей на пользователя</span>
                <span className="font-semibold">
                  {totalUsers > 0 ? (totalPosts / totalUsers).toFixed(1) : 0}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
}
