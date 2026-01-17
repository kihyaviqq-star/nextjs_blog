"use client";

import { useState, useMemo, useEffect } from "react";
import { Search, X, ChevronDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu";

type UserRole = "ALL" | "USER" | "EDITOR" | "ADMIN";

interface User {
  id: string;
  name: string | null;
  username: string | null;
  email: string;
  role: string;
}

interface UsersFilterBarProps {
  users: User[];
  onFilteredUsersChange: (filteredUsers: User[]) => void;
}

export function UsersFilterBar({ users, onFilteredUsersChange }: UsersFilterBarProps) {
  const [searchValue, setSearchValue] = useState("");
  const [roleFilter, setRoleFilter] = useState<UserRole>("ALL");

  // Filter users based on search and role
  const filteredUsers = useMemo(() => {
    let result = [...users];

    // Filter by role
    if (roleFilter !== "ALL") {
      result = result.filter((user) => user.role === roleFilter);
    }

    // Filter by search (email, name, username)
    if (searchValue.trim()) {
      const searchLower = searchValue.toLowerCase().trim();
      result = result.filter((user) => {
        const email = user.email?.toLowerCase() || "";
        const name = user.name?.toLowerCase() || "";
        const username = user.username?.toLowerCase() || "";
        
        return (
          email.includes(searchLower) ||
          name.includes(searchLower) ||
          username.includes(searchLower)
        );
      });
    }

    return result;
  }, [users, searchValue, roleFilter]);

  // Notify parent component of filtered users
  useEffect(() => {
    onFilteredUsersChange(filteredUsers);
  }, [filteredUsers, onFilteredUsersChange]);

  const handleClear = () => {
    setSearchValue("");
  };

  const getRoleLabel = (role: UserRole) => {
    switch (role) {
      case "ALL":
        return "Все роли";
      case "USER":
        return "Пользователь";
      case "EDITOR":
        return "Редактор";
      case "ADMIN":
        return "Администратор";
      default:
        return "Все роли";
    }
  };

  return (
    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
      {/* Search Input */}
      <div className="relative flex-1 w-full sm:w-auto min-w-[200px]">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        <Input
          type="text"
          placeholder="Поиск по почте, имени, логину..."
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          className="pl-10 pr-10 hover:bg-secondary/50 transition-colors focus:outline-none focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 border-border"
        />
        {searchValue && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0 hover:bg-transparent"
          >
            <X className="w-4 h-4 text-muted-foreground hover:text-foreground" />
          </Button>
        )}
      </div>

      {/* Role Filter Dropdown */}
      <div className="w-full sm:w-auto">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="default"
              className="gap-2 w-full sm:w-auto"
            >
              {getRoleLabel(roleFilter)}
              <ChevronDown className="w-4 h-4 ml-auto" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuRadioGroup
              value={roleFilter}
              onValueChange={(value) => setRoleFilter(value as UserRole)}
            >
              <DropdownMenuRadioItem value="ALL" className="cursor-pointer">
                Все роли
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="USER" className="cursor-pointer">
                Пользователь
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="EDITOR" className="cursor-pointer">
                Редактор
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="ADMIN" className="cursor-pointer">
                Администратор
              </DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
