"use client";

import { useTransition, useState, useEffect } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Search, List as ListIcon, Grid as GridIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface Category {
  id: string;
  slug: string;
  name: string;
  icon: string | null;
}

export function SoftwareSidebar({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const currentCategory = searchParams.get("category") || "all";
  const currentSearch = searchParams.get("search") || "";
  const currentPlatform = searchParams.get("platform") || "all";
  const currentLicense = searchParams.get("license") || "all";
  const currentView = searchParams.get("view") || "list";
  
  const [searchValue, setSearchValue] = useState(currentSearch);

  useEffect(() => {
    setSearchValue(searchParams.get("search") || "");
  }, [searchParams]);

  const updateFilters = (paramsToUpdate: Record<string, string | undefined>) => {
    const params = new URLSearchParams(searchParams.toString());
    
    // Reset page to 1 on filter changes unless we explicitly pass page
    if (!paramsToUpdate.page && (paramsToUpdate.category !== undefined || paramsToUpdate.search !== undefined)) {
        params.delete("page");
    }

    Object.entries(paramsToUpdate).forEach(([key, value]) => {
      if (value === undefined || value === "all" || value === "") {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    });

    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    });
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateFilters({ search: searchValue });
  };

  return (
    <div className="w-full bg-card border border-border/40 rounded-3xl p-6 shadow-sm sticky top-6">
      <div className="mb-8">
        <h3 className="font-bold text-lg mb-4">Поиск программ</h3>
        <form onSubmit={handleSearchSubmit} className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <Input 
            type="search"
            placeholder="Найти софт..." 
            className="w-full pl-9 pr-4 py-5 text-sm rounded-xl bg-secondary/50 border-border/50 focus-visible:ring-primary shadow-sm"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
          />
          <button type="submit" className="hidden" />
        </form>
      </div>

      <div className="mb-8">
        <h3 className="font-bold text-lg mb-4">Вид каталога</h3>
        <div className="flex gap-2">
          <Button 
            variant={currentView === "list" ? "default" : "outline"} 
            size="sm"
            className="flex-1 rounded-xl shadow-sm"
            onClick={() => updateFilters({ view: "list" })}
            disabled={isPending}
          >
            <ListIcon className="w-4 h-4 mr-2" /> Список
          </Button>
          <Button 
            variant={currentView === "grid" ? "default" : "outline"} 
            size="sm"
            className="flex-1 rounded-xl shadow-sm"
            onClick={() => updateFilters({ view: "grid" })}
            disabled={isPending}
          >
            <GridIcon className="w-4 h-4 mr-2" /> Плитка
          </Button>
        </div>
      </div>

      <div className="mb-8">
        <h3 className="font-bold text-lg mb-4">Фильтры</h3>
        <div className="flex flex-col gap-3">
          <div>
            <label className="text-xs text-muted-foreground font-medium mb-1.5 block">ОС / Платформа</label>
            <select 
              className="w-full bg-secondary/50 border border-border/50 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary/50"
              value={currentPlatform}
              onChange={(e) => updateFilters({ platform: e.target.value })}
            >
              <option value="all">Любая</option>
              <option value="Windows">Windows</option>
              <option value="macOS">macOS</option>
              <option value="Linux">Linux</option>
              <option value="Android">Android</option>
              <option value="iOS">iOS</option>
              <option value="Web">Web-сервис</option>
            </select>
          </div>
          
          <div>
            <label className="text-xs text-muted-foreground font-medium mb-1.5 block">Тип лицензии</label>
            <select 
              className="w-full bg-secondary/50 border border-border/50 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary/50"
              value={currentLicense}
              onChange={(e) => updateFilters({ license: e.target.value })}
            >
              <option value="all">Любая</option>
              <option value="Free">Бесплатная (Free)</option>
              <option value="Trial">Условно-бесплатная (Trial)</option>
              <option value="Paid">Платная (Paid)</option>
            </select>
          </div>
        </div>
      </div>

      <div>
        <h3 className="font-bold text-lg mb-4">Категории</h3>
        <div className="flex flex-col gap-2">
          <button 
            onClick={() => updateFilters({ category: "all" })}
            className={`text-left px-4 py-2.5 rounded-xl transition-all font-medium text-sm ${
              currentCategory === "all" 
                ? "bg-primary text-primary-foreground shadow-sm" 
                : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
            }`}
          >
            Все категории
          </button>
          
          {categories.map(cat => (
            <button 
              key={cat.id}
              onClick={() => updateFilters({ category: cat.slug })}
              className={`text-left px-4 py-2.5 rounded-xl transition-all font-medium text-sm flex items-center ${
                currentCategory === cat.slug 
                  ? "bg-primary text-primary-foreground shadow-sm" 
                  : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
              }`}
            >
              <span className="mr-3 text-lg opacity-80">{cat.icon}</span> 
              {cat.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
