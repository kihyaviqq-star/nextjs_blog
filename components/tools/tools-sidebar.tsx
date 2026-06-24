"use client";

import { useTransition, useState, useEffect } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Search, List as ListIcon, Grid as GridIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CustomSelect } from "@/components/ui/custom-select";

interface Category {
  id: string;
  slug: string;
  name: string;
  icon: string | null;
}

interface FilterOptions {
  developers: string[];
  pricings: string[];
  licenses: string[];
}

export function ToolsSidebar({ categories, filterOptions }: { categories: Category[], filterOptions?: FilterOptions }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const currentCategory = searchParams.get("category") || "all";
  const currentSearch = searchParams.get("search") || "";
  const currentDeveloper = searchParams.get("developer") || "all";
  const currentPricing = searchParams.get("pricing") || "all";
  const currentLicense = searchParams.get("license") || "all";
  const currentView = searchParams.get("view") || "grid";
  
  const currentFeaturesParam = searchParams.get("features");
  const currentFeatures = currentFeaturesParam ? currentFeaturesParam.split(',') : [];

  const [searchValue, setSearchValue] = useState(currentSearch);

  useEffect(() => {
    setSearchValue(searchParams.get("search") || "");
  }, [searchParams]);

  const updateFilters = (paramsToUpdate: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    
    // Always reset page to 1 on filter change unless we explicitly change page/view
    if (!paramsToUpdate.page && !paramsToUpdate.view) {
        params.delete("page");
    }

    Object.entries(paramsToUpdate).forEach(([key, value]) => {
      if (value === null || value === "all" || value === "") {
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

  const toggleFeature = (feature: string) => {
    const newFeatures = currentFeatures.includes(feature)
      ? currentFeatures.filter(f => f !== feature)
      : [...currentFeatures, feature];
    
    updateFilters({ features: newFeatures.length > 0 ? newFeatures.join(',') : null });
  };

  const FEATURE_LIST = [
    { id: "Vision", label: "Поддержка изображений (Vision)" },
    { id: "Function Calling", label: "Вызов функций" },
    { id: "Web Search", label: "Поиск в интернете" },
    { id: "Code Execution", label: "Запуск кода" },
  ];

  return (
    <div className="w-full bg-card border border-border/40 rounded-3xl p-6 shadow-sm sticky top-6">
      <div className="mb-8">
        <h3 className="font-bold text-lg mb-4">Поиск нейросетей</h3>
        <form onSubmit={handleSearchSubmit} className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <Input 
            type="search"
            placeholder="Найти ИИ..." 
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

      {filterOptions && (
        <div className="mb-8">
          <h3 className="font-bold text-lg mb-4">Фильтры</h3>
          <div className="flex flex-col gap-4">
            
            <div>
              <label className="text-xs text-muted-foreground font-medium mb-1.5 block">Разработчик</label>
              <CustomSelect
                value={currentDeveloper}
                onChange={(value) => updateFilters({ developer: value })}
                options={[
                  { value: "all", label: "Все разработчики" },
                  ...filterOptions.developers.map(dev => ({ value: dev, label: dev }))
                ]}
              />
            </div>
            
            <div>
              <label className="text-xs text-muted-foreground font-medium mb-1.5 block">Доступность</label>
              <CustomSelect
                value={currentPricing}
                onChange={(value) => updateFilters({ pricing: value })}
                options={[
                  { value: "all", label: "Любая цена" },
                  ...filterOptions.pricings.map(price => ({ value: price, label: price }))
                ]}
              />
            </div>

            <div>
              <label className="text-xs text-muted-foreground font-medium mb-1.5 block">Лицензия</label>
              <CustomSelect
                value={currentLicense}
                onChange={(value) => updateFilters({ license: value })}
                options={[
                  { value: "all", label: "Любая лицензия" },
                  ...filterOptions.licenses.map(lic => ({ value: lic, label: lic }))
                ]}
              />
            </div>
          </div>

          <div className="mt-5">
            <label className="text-xs text-muted-foreground font-medium mb-2 block">Особенности и возможности</label>
            <div className="flex flex-col gap-2">
              {FEATURE_LIST.map(feature => {
                const isActive = currentFeatures.includes(feature.id);
                return (
                  <button
                    key={feature.id}
                    onClick={() => toggleFeature(feature.id)}
                    disabled={isPending}
                    className={`text-left px-3 py-2 text-xs font-medium rounded-xl border transition-all ${
                      isActive 
                        ? 'bg-primary text-primary-foreground border-primary shadow-sm' 
                        : 'bg-secondary/40 text-foreground/80 border-border/50 hover:bg-secondary/80 hover:border-border'
                    }`}
                  >
                    {feature.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

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
              className={`text-left flex items-center px-4 py-2.5 rounded-xl transition-all font-medium text-sm ${
                currentCategory === cat.slug 
                  ? "bg-primary text-primary-foreground shadow-sm" 
                  : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
              }`}
            >
              {cat.icon && <span className="mr-2 text-lg">{cat.icon}</span>}
              {cat.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
