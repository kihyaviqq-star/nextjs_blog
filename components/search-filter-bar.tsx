"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, X, Clock, TrendingUp, ChevronDown } from "lucide-react";
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

export function SearchFilterBar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchValue, setSearchValue] = useState("");
  const [sortBy, setSortBy] = useState<"newest" | "popular">("newest");
  const [isPending, startTransition] = useTransition();

  // Initialize from URL only once on mount
  const [initialized, setInitialized] = useState(false);
  
  useEffect(() => {
    if (!initialized) {
      const search = searchParams.get("search");
      const sort = searchParams.get("sort");
      
      if (search) {
        setSearchValue(search);
      }
      if (sort === "popular") {
        setSortBy("popular");
      }
      setInitialized(true);
    }
  }, [searchParams, initialized]);

  const updateURL = (search: string, sort: "newest" | "popular") => {
    startTransition(() => {
      const params = new URLSearchParams(searchParams);
      
      if (search.trim()) {
        params.set("search", search.trim());
      } else {
        params.delete("search");
      }

      if (sort === "popular") {
        params.set("sort", "popular");
      } else {
        params.delete("sort");
      }

      params.delete("page"); // Reset to first page

      const queryString = params.toString();
      const newUrl = queryString ? `/?${queryString}` : "/";
      
      router.push(newUrl);
    });
  };

  const handleSearch = (value: string) => {
    setSearchValue(value);
    updateURL(value, sortBy);
  };

  const handleSort = (sort: "newest" | "popular") => {
    setSortBy(sort);
    updateURL(searchValue, sort);
  };

  const handleClear = () => {
    setSearchValue("");
    updateURL("", sortBy);
  };

  return (
    <div className="flex flex-col sm:flex-row gap-4 items-center justify-center max-w-3xl mx-auto">
      {/* Search Input */}
      <div className="relative w-full sm:flex-1">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        <Input
          type="text"
          placeholder="Поиск статей..."
          value={searchValue}
          onChange={(e) => handleSearch(e.target.value)}
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

      {/* Sort Dropdown */}
      <div className="w-full sm:w-auto">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="default"
              className="gap-2 w-full sm:w-auto"
            >
              {sortBy === "newest" ? (
                <>
                  <Clock className="w-4 h-4" />
                  Последние
                </>
              ) : (
                <>
                  <TrendingUp className="w-4 h-4" />
                  Популярное
                </>
              )}
              <ChevronDown className="w-4 h-4 ml-auto" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuRadioGroup
              value={sortBy}
              onValueChange={(value) => handleSort(value as "newest" | "popular")}
            >
              <DropdownMenuRadioItem value="newest" className="gap-2 cursor-pointer">
                <Clock className="w-4 h-4" />
                Последние
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="popular" className="gap-2 cursor-pointer">
                <TrendingUp className="w-4 h-4" />
                Популярное
              </DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
