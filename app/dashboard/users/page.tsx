"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { HeaderClientWrapper } from "@/components/header";
import { FooterClient } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Users, ArrowLeft } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { RoleSelector } from "@/components/role-selector";
import { UsersFilterBar } from "@/components/users-filter-bar";

type User = {
  id: string;
  name: string | null;
  username: string | null;
  email: string;
  avatarUrl: string | null;
  role: string;
  createdAt: Date;
  _count: {
    posts: number;
  };
};

export default function UsersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const handleFilteredUsersChange = useCallback((filtered: User[]) => {
    setFilteredUsers(filtered);
  }, []);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
      return;
    }

    if (status === "authenticated") {
      const userRole = (session?.user as any)?.role;

      // Only ADMINs can access this page
      if (userRole !== "ADMIN") {
        return;
      }

      // Fetch all users from database
      fetch("/api/users")
        .then((res) => res.json())
        .then((data) => {
          if (data.error) {
            console.error("Error fetching users:", data.error);
            return;
          }
          setUsers(data);
          setFilteredUsers(data);
          setIsLoading(false);
        })
        .catch((error) => {
          console.error("Error fetching users:", error);
          setIsLoading(false);
        });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, status]); // router is stable and doesn't need to be in dependencies

  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-muted-foreground">Загрузка...</p>
        </div>
      </div>
    );
  }

  if (!session?.user) {
    return null;
  }

  const userRole = (session.user as any).role;

  // Only ADMINs can access this page
  if (userRole !== "ADMIN") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-xl text-muted-foreground">У вас нет доступа к этой странице</p>
          <p className="text-sm text-muted-foreground">Только администраторы могут управлять пользователями</p>
          <Link href="/">
            <Button>На главную</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <HeaderClientWrapper />
      <main className="flex-grow container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-6">
          <Link href="/dashboard/articles">
            <Button variant="ghost" size="sm" className="mb-4 -ml-3">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Назад к статьям
            </Button>
          </Link>

          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold mb-2">Управление пользователями</h1>
              <p className="text-muted-foreground">
                {filteredUsers.length !== users.length 
                  ? `Найдено: ${filteredUsers.length} из ${users.length}` 
                  : `Всего пользователей: ${users.length}`}
              </p>
            </div>
          </div>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Пользователи системы
                </CardTitle>
                <CardDescription>
                  Управление ролями и правами доступа пользователей
                </CardDescription>
              </div>
              <UsersFilterBar 
                users={users} 
                onFilteredUsersChange={handleFilteredUsersChange}
              />
            </div>
          </CardHeader>
          <CardContent>
            {users.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 space-y-4">
                <Users className="w-16 h-16 text-muted-foreground" />
                <p className="text-muted-foreground">Нет зарегистрированных пользователей</p>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 space-y-4">
                <Users className="w-16 h-16 text-muted-foreground" />
                <p className="text-muted-foreground">Пользователи не найдены</p>
                <p className="text-sm text-muted-foreground">Попробуйте изменить параметры поиска</p>
              </div>
            ) : (
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[350px]">Пользователь</TableHead>
                      <TableHead>Роль</TableHead>
                      <TableHead className="text-right">Статьи</TableHead>
                      <TableHead>Участник с</TableHead>
                      <TableHead className="text-right">Действия</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            {user.avatarUrl ? (
                              <Image
                                src={user.avatarUrl}
                                alt={user.name || "User"}
                                width={40}
                                height={40}
                                className="rounded-full object-cover"
                                unoptimized={user.avatarUrl?.startsWith('http') || user.avatarUrl?.startsWith('/uploads/')}
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                                <span className="text-white font-semibold text-sm">
                                  {(user.name || user.email).charAt(0).toUpperCase()}
                                </span>
                              </div>
                            )}
                            <div className="flex flex-col">
                              <span className="font-medium">{user.name || "Unnamed User"}</span>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                {user.username && (
                                  <span className="font-mono">@{user.username}</span>
                                )}
                                <span>·</span>
                                <span>{user.email}</span>
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              user.role === "ADMIN"
                                ? "destructive"
                                : user.role === "EDITOR"
                                ? "default"
                                : "secondary"
                            }
                          >
                            {user.role === "ADMIN"
                              ? "Администратор"
                              : user.role === "EDITOR"
                              ? "Редактор"
                              : "Пользователь"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <span className="text-sm text-muted-foreground">
                            {user._count.posts}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-muted-foreground">
                            {new Date(user.createdAt).toLocaleDateString("ru-RU", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <RoleSelector userId={user.id} currentRole={user.role} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      <FooterClient />
    </div>
  );
}
