"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, X, Clock, TrendingUp } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

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

      {/* Sort Buttons */}
      <div className="flex gap-2 w-full sm:w-auto">
        <Button
          variant="outline"
          size="default"
          onClick={() => handleSort("newest")}
          className={`gap-2 flex-1 sm:flex-initial ${
            sortBy === "newest"
              ? "border-primary border-2 bg-secondary/50"
              : "border-border"
          }`}
        >
          <Clock className="w-4 h-4" />
          Последние
        </Button>
        <Button
          variant="outline"
          size="default"
          onClick={() => handleSort("popular")}
          className={`gap-2 flex-1 sm:flex-initial ${
            sortBy === "popular"
              ? "border-primary border-2 bg-secondary/50"
              : "border-border"
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          Популярное
        </Button>
      </div>
    </div>
  );
}
