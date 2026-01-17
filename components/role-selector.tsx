"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ChevronDown, Shield, Edit, User } from "lucide-react";
import { toast } from "sonner";

interface RoleSelectorProps {
  userId: string;
  currentRole: string;
}

export function RoleSelector({ userId, currentRole }: RoleSelectorProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const [isChanging, setIsChanging] = useState(false);

  // Check if this is the current user's own profile
  const currentUserId = (session?.user as any)?.id;
  const isOwnProfile = currentUserId === userId;
  const isAdminChangingOwnRole = isOwnProfile && currentRole === "ADMIN";

  const handleRoleChange = async (newRole: string) => {
    if (newRole === currentRole) return;

    // Prevent admin from changing their own role
    if (isAdminChangingOwnRole) {
      toast.error("Ошибка", {
        description: "Нельзя изменить собственную роль администратора",
      });
      return;
    }

    setIsChanging(true);
    try {
      const response = await fetch("/api/users/update-role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, role: newRole }),
      });

      if (response.ok) {
        toast.success("Роль изменена", {
          description: `Пользователю назначена роль: ${getRoleLabel(newRole)}`,
        });
        router.refresh();
      } else {
        const errorData = await response.json();
        toast.error("Ошибка", {
          description: errorData.error || "Не удалось изменить роль",
        });
      }
    } catch (error) {
      console.error("Error changing role:", error);
      toast.error("Ошибка", {
        description: "Произошла ошибка при изменении роли",
      });
    } finally {
      setIsChanging(false);
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "ADMIN":
        return "Администратор";
      case "EDITOR":
        return "Редактор";
      case "USER":
        return "Пользователь";
      default:
        return role;
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "ADMIN":
        return Shield;
      case "EDITOR":
        return Edit;
      case "USER":
        return User;
      default:
        return User;
    }
  };

  // If admin is trying to change their own role, disable the button
  if (isAdminChangingOwnRole) {
    return (
      <Button variant="ghost" size="sm" disabled className="gap-1" title="Нельзя изменить собственную роль администратора">
        Изменить
        <ChevronDown className="w-3 h-3" />
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" disabled={isChanging} className="gap-1">
          {isChanging ? "..." : "Изменить"}
          <ChevronDown className="w-3 h-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Изменить роль</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {["ADMIN", "EDITOR", "USER"].map((role) => {
          const Icon = getRoleIcon(role);
          const isActive = role === currentRole;
          return (
            <DropdownMenuItem
              key={role}
              onClick={() => handleRoleChange(role)}
              disabled={isActive || isChanging}
              className={isActive ? "bg-secondary" : ""}
            >
              <Icon className="w-4 h-4 mr-2" />
              <span>{getRoleLabel(role)}</span>
              {isActive && (
                <span className="ml-auto text-xs text-muted-foreground">✓</span>
              )}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
