"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { ThemeToggle } from "@/components/theme-toggle";
import { UserMenu } from "@/components/user-menu";
import { MobileMenu } from "@/components/mobile-menu";
import { Button } from "@/components/ui/button";
import { PenSquare, LogIn } from "lucide-react";

interface HeaderClientProps {
  siteName: string;
  logoUrl: string | null;
}

export function HeaderClient({ siteName, logoUrl }: HeaderClientProps) {
  const { data: session, status } = useSession();
  const userRole = (session?.user as any)?.role;
  const canWrite = userRole === "ADMIN" || userRole === "EDITOR";

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo - always visible */}
          <Link 
            href="/" 
            className="flex items-center gap-2 hover:opacity-80 transition-opacity flex-shrink-0 z-10"
          >
            {logoUrl && (
              <img 
                src={logoUrl} 
                alt={siteName} 
                className="h-8 w-auto"
              />
            )}
            <span className="text-xl font-semibold">{siteName}</span>
          </Link>

          {/* Desktop actions - hidden on mobile */}
          <div className="hidden md:flex items-center gap-2 sm:gap-4 flex-shrink-0">
            {status === "loading" ? (
              <div className="w-20 h-8 bg-secondary/50 animate-pulse rounded-lg" />
            ) : session?.user ? (
              <>
                {canWrite && (
                  <>
                    <Button asChild size="sm" className="gap-2" variant="outline">
                      <Link href="/admin/generator">
                        <span className="hidden lg:inline">Генерация ИИ</span>
                        <span className="lg:hidden">ИИ</span>
                      </Link>
                    </Button>
                    <Button asChild size="sm" className="gap-2">
                      <Link href="/dashboard/articles/create">
                        <PenSquare className="w-4 h-4" />
                        <span className="hidden lg:inline">Написать статью</span>
                      </Link>
                    </Button>
                  </>
                )}
                <UserMenu />
              </>
            ) : (
              <Button asChild variant="outline" size="sm" className="gap-2">
                <Link href="/auth/signin">
                  <LogIn className="w-4 h-4" />
                  Войти
                </Link>
              </Button>
            )}
            <ThemeToggle />
          </div>

          {/* Mobile menu - visible on mobile */}
          <div className="flex md:hidden items-center gap-2 flex-shrink-0">
            <MobileMenu 
              session={session}
              status={status}
              canWrite={canWrite}
            />
          </div>
        </div>
      </div>
    </header>
  );
}
