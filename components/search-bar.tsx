"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function SearchBar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [searchValue, setSearchValue] = useState("");
  const [isPending, startTransition] = useTransition();

  // Initialize search value from URL
  useEffect(() => {
    const search = searchParams.get("search");
    if (search) {
      setSearchValue(search);
    }
  }, [searchParams]);

  const handleSearch = (value: string) => {
    setSearchValue(value);

    // Only search on homepage
    if (pathname !== "/") {
      return;
    }

    startTransition(() => {
      const params = new URLSearchParams(searchParams);
      
      if (value.trim()) {
        params.set("search", value.trim());
        params.delete("page"); // Reset to first page
      } else {
        params.delete("search");
        params.delete("page");
      }

      const queryString = params.toString();
      const newUrl = queryString ? `/?${queryString}` : "/";
      
      router.push(newUrl);
    });
  };

  const handleClear = () => {
    setSearchValue("");
    
    if (pathname === "/") {
      startTransition(() => {
        router.push("/");
      });
    }
  };

  // Only show on homepage
  if (pathname !== "/") {
    return null;
  }

  return (
    <div className="relative w-full max-w-md">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
      <Input
        type="text"
        placeholder="Поиск статей..."
        value={searchValue}
        onChange={(e) => handleSearch(e.target.value)}
        className="pl-10 pr-10"
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
  );
}
