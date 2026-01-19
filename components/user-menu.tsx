"use client";

import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { LogOut, User, Settings, ChevronDown, FileText, Users, LayoutDashboard } from "lucide-react";

export function UserMenu() {
  const { data: session } = useSession();

  if (!session?.user) {
    return null;
  }

  const userRole = (session.user as any).role;
  const username = (session.user as any).username;
  const avatarUrl = (session.user as any).avatarUrl;
  
  // Role label mapping
  const roleLabel = userRole === "ADMIN" 
    ? "Главный редактор" 
    : userRole === "EDITOR" 
      ? "Редактор" 
      : "Пользователь";
  
  // Permission checks
  const isAdmin = userRole === "ADMIN";
  const canManageContent = userRole === "ADMIN" || userRole === "EDITOR";

  // Generate profile link - use username if available, fallback to name
  const profileLink = username 
    ? `/${username}` 
    : session.user.name 
      ? `/${session.user.name.toLowerCase().replace(/\s+/g, "-")}` 
      : "/settings"; // Fallback to settings if no username

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="flex items-center gap-2 px-3 py-1.5 h-auto"
        >
          {avatarUrl ? (
            <Image 
              src={avatarUrl} 
              alt={session.user.name || "User"} 
              width={32}
              height={32}
              className="w-8 h-8 rounded-full object-cover"
              style={{ width: "2rem", height: "2rem" }}
              unoptimized={avatarUrl?.startsWith('http') || avatarUrl?.startsWith('/uploads/')}
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <User className="w-4 h-4 text-white" />
            </div>
          )}
          <div className="hidden md:flex flex-col items-start">
            <span className="text-sm font-medium">{session.user.name}</span>
            <span className="text-xs text-muted-foreground">{roleLabel}</span>
          </div>
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel asChild>
          <Link 
            href={profileLink} 
            className="flex flex-col space-y-1 cursor-pointer hover:bg-accent rounded-sm transition-colors px-2 py-1.5"
          >
            <p className="text-sm font-medium leading-none">{session.user.name}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {roleLabel}
            </p>
          </Link>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/settings" className="cursor-pointer">
            <User className="mr-2 h-4 w-4" />
            <span>Настройки</span>
          </Link>
        </DropdownMenuItem>
        {canManageContent && (
          <>
            <DropdownMenuItem asChild>
              <Link href="/dashboard" className="cursor-pointer">
                <LayoutDashboard className="mr-2 h-4 w-4" />
                <span>Дашборд</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/dashboard/articles" className="cursor-pointer">
                <FileText className="mr-2 h-4 w-4" />
                <span>Статьи</span>
              </Link>
            </DropdownMenuItem>
          </>
        )}
        {isAdmin && (
          <>
            <DropdownMenuItem asChild>
              <Link href="/dashboard/users" className="cursor-pointer">
                <Users className="mr-2 h-4 w-4" />
                <span>Пользователи</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/dashboard/settings" className="cursor-pointer">
                <Settings className="mr-2 h-4 w-4" />
                <span>Настройки сайта</span>
              </Link>
            </DropdownMenuItem>
          </>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="cursor-pointer text-red-600 focus:text-red-600"
          onClick={() => signOut({ callbackUrl: "/" })}
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>Выход</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
