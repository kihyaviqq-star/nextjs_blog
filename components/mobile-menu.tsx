"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Session } from "next-auth";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ThemeToggle } from "@/components/theme-toggle";
import { 
  Menu, 
  User, 
  FileText, 
  Users, 
  Settings, 
  LogOut, 
  PenSquare, 
  LogIn 
} from "lucide-react";
import { signOut } from "next-auth/react";
import { Separator } from "@/components/ui/separator";

interface MobileMenuProps {
  session: Session | null;
  status: "loading" | "authenticated" | "unauthenticated";
  canWrite: boolean;
}

export function MobileMenu({ session, status, canWrite }: MobileMenuProps) {
  const [open, setOpen] = useState(false);

  const handleLinkClick = () => {
    setOpen(false);
  };

  const handleSignOut = () => {
    setOpen(false);
    signOut({ callbackUrl: "/" });
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden h-10 w-10"
          aria-label="Открыть меню"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[300px] sm:w-[400px] px-0">
        <SheetHeader className="px-6 pb-4">
          <div className="flex items-center justify-between">
            <SheetTitle>Меню</SheetTitle>
            <ThemeToggle />
          </div>
        </SheetHeader>

        <div className="flex flex-col h-[calc(100vh-5rem)]">
          {status === "loading" ? (
            <div className="px-6 space-y-3">
              <div className="h-16 bg-secondary/50 animate-pulse rounded-lg" />
              <div className="h-12 bg-secondary/50 animate-pulse rounded-lg" />
              <div className="h-12 bg-secondary/50 animate-pulse rounded-lg" />
            </div>
          ) : session?.user ? (
            <>
              {/* User Profile Section */}
              <div className="px-6 pb-4">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50">
                  {(session.user as any).avatarUrl ? (
                    <Image
                      src={(session.user as any).avatarUrl}
                      alt={session.user.name || "User"}
                      width={48}
                      height={48}
                      className="w-12 h-12 rounded-full object-cover"
                      unoptimized={(session.user as any).avatarUrl?.startsWith('http')}
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                      <User className="w-6 h-6 text-white" />
                    </div>
                  )}
                  <div className="flex flex-col min-w-0">
                    <span className="text-sm font-semibold truncate">
                      {session.user.name}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {(session.user as any).role === "ADMIN"
                        ? "Редактор"
                        : (session.user as any).role === "EDITOR"
                        ? "Редактор"
                        : "Пользователь"}
                    </span>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Navigation Links */}
              <nav className="flex-1 px-6 py-4 space-y-1 overflow-y-auto">
                {canWrite && (
                  <Link
                    href="/dashboard/articles/create"
                    onClick={handleLinkClick}
                    className="flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-secondary transition-colors min-h-[44px]"
                  >
                    <PenSquare className="w-5 h-5 flex-shrink-0" />
                    <span className="text-sm font-medium">Написать статью</span>
                  </Link>
                )}

                <Link
                  href={`/${(session.user as any).username || "profile"}`}
                  onClick={handleLinkClick}
                  className="flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-secondary transition-colors min-h-[44px]"
                >
                  <User className="w-5 h-5 flex-shrink-0" />
                  <span className="text-sm font-medium">Мой профиль</span>
                </Link>

                {((session.user as any).role === "ADMIN" ||
                  (session.user as any).role === "EDITOR") && (
                  <Link
                    href="/dashboard/articles"
                    onClick={handleLinkClick}
                    className="flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-secondary transition-colors min-h-[44px]"
                  >
                    <FileText className="w-5 h-5 flex-shrink-0" />
                    <span className="text-sm font-medium">Статьи</span>
                  </Link>
                )}

                {(session.user as any).role === "ADMIN" && (
                  <Link
                    href="/dashboard/users"
                    onClick={handleLinkClick}
                    className="flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-secondary transition-colors min-h-[44px]"
                  >
                    <Users className="w-5 h-5 flex-shrink-0" />
                    <span className="text-sm font-medium">Пользователи</span>
                  </Link>
                )}

                <Link
                  href="/settings"
                  onClick={handleLinkClick}
                  className="flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-secondary transition-colors min-h-[44px]"
                >
                  <Settings className="w-5 h-5 flex-shrink-0" />
                  <span className="text-sm font-medium">Настройки</span>
                </Link>
              </nav>

              <Separator />

              {/* Sign Out Button */}
              <div className="px-6 py-4">
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-destructive/10 text-destructive transition-colors min-h-[44px]"
                >
                  <LogOut className="w-5 h-5 flex-shrink-0" />
                  <span className="text-sm font-medium">Выход</span>
                </button>
              </div>
            </>
          ) : (
            <div className="px-6 py-4">
              <Button
                asChild
                className="w-full gap-2 min-h-[44px]"
                onClick={handleLinkClick}
              >
                <Link href="/auth/signin">
                  <LogIn className="w-5 h-5" />
                  Войти
                </Link>
              </Button>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
