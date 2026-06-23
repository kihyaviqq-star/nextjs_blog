"use client";

import { useTransition, useState, useEffect } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface Category {
  id: string;
  slug: string;
  name: string;
  icon: string | null;
}

export function ToolsFilters({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const currentCategory = searchParams.get("category") || "all";
  const currentSearch = searchParams.get("search") || "";
  
  const [searchValue, setSearchValue] = useState(currentSearch);

  // Sync local state if URL changes externally
  useEffect(() => {
    setSearchValue(searchParams.get("search") || "");
  }, [searchParams]);

  const updateFilters = (newCategory?: string, newSearch?: string) => {
    const params = new URLSearchParams(searchParams.toString());
    
    if (newCategory !== undefined) {
      if (newCategory === "all") {
        params.delete("category");
      } else {
        params.set("category", newCategory);
      }
    }
    
    if (newSearch !== undefined) {
      if (!newSearch.trim()) {
        params.delete("search");
      } else {
        params.set("search", newSearch.trim());
      }
    }

    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    });
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateFilters(undefined, searchValue);
  };

  return (
    <div className="w-full flex flex-col items-center">
      {/* Search Input */}
      <form onSubmit={handleSearchSubmit} className="w-full max-w-xl mb-12 relative group">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
        <Input 
          type="search"
          placeholder="Поиск нейросети... (например: ChatGPT)" 
          className="w-full pl-12 pr-4 py-6 text-lg rounded-full bg-secondary/50 border-border/50 focus-visible:ring-primary shadow-sm"
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
        />
        <button type="submit" className="hidden" />
      </form>

      {/* Categories */}
      {categories.length > 0 && (
        <div className="flex flex-wrap gap-3 justify-center items-center">
          <Button 
            variant={currentCategory === "all" ? "default" : "outline"} 
            className={`rounded-full px-6 shadow-sm font-medium text-sm transition-all ${
              currentCategory !== "all" ? "border-border/40 bg-secondary/30 hover:bg-secondary/60 text-foreground/80 hover:text-foreground" : ""
            }`}
            onClick={() => updateFilters("all")}
            disabled={isPending}
          >
            Все категории
          </Button>
          {categories.map(cat => (
            <Button 
              key={cat.id} 
              variant={currentCategory === cat.slug ? "default" : "outline"} 
              className={`rounded-full px-5 shadow-sm transition-all ${
                currentCategory !== cat.slug ? "border-border/40 bg-secondary/30 hover:bg-secondary/60 text-foreground/80 hover:text-foreground" : ""
              }`}
              onClick={() => updateFilters(cat.slug)}
              disabled={isPending}
            >
              <span className="mr-2 text-lg">{cat.icon}</span> {cat.name}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}
