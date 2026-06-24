"use client";

import { useTransition, useState, useEffect } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Search, Filter, Cpu, DollarSign, FileText } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

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

export function ToolsFilters({ categories, filterOptions }: { categories: Category[], filterOptions?: FilterOptions }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const currentCategory = searchParams.get("category") || "all";
  const currentSearch = searchParams.get("search") || "";
  const currentDeveloper = searchParams.get("developer") || "all";
  const currentPricing = searchParams.get("pricing") || "all";
  const currentLicense = searchParams.get("license") || "all";
  
  const currentFeaturesParam = searchParams.get("features");
  const currentFeatures = currentFeaturesParam ? currentFeaturesParam.split(',') : [];

  const [searchValue, setSearchValue] = useState(currentSearch);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Sync local state if URL changes externally
  useEffect(() => {
    setSearchValue(searchParams.get("search") || "");
  }, [searchParams]);

  const updateFilters = (paramsToUpdate: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    
    // Always reset page to 1 on filter change
    params.delete("page");

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
    <div className="w-full flex flex-col items-center">
      {/* Search Input */}
      <form onSubmit={handleSearchSubmit} className="w-full max-w-xl mb-6 relative group">
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

      {/* Main Categories */}
      {categories.length > 0 && (
        <div className="flex flex-wrap gap-2 justify-center items-center mb-6">
          <Button 
            variant={currentCategory === "all" ? "default" : "outline"} 
            className={`rounded-full shadow-sm font-medium transition-all ${
              currentCategory !== "all" ? "border-border/40 bg-secondary/30 hover:bg-secondary/60 text-foreground/80 hover:text-foreground" : ""
            }`}
            onClick={() => updateFilters({ category: "all" })}
            disabled={isPending}
          >
            Все категории
          </Button>
          {categories.map(cat => (
            <Button 
              key={cat.id} 
              variant={currentCategory === cat.slug ? "default" : "outline"} 
              className={`rounded-full shadow-sm transition-all ${
                currentCategory !== cat.slug ? "border-border/40 bg-secondary/30 hover:bg-secondary/60 text-foreground/80 hover:text-foreground" : ""
              }`}
              onClick={() => updateFilters({ category: cat.slug })}
              disabled={isPending}
            >
              {cat.icon && <span className="mr-2">{cat.icon}</span>} {cat.name}
            </Button>
          ))}
          
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="ml-2 rounded-full text-muted-foreground hover:text-foreground"
          >
            <Filter className="w-4 h-4 mr-2" />
            Фильтры
          </Button>
        </div>
      )}

      {/* Advanced Filters */}
      {showAdvanced && filterOptions && (
        <div className="w-full max-w-4xl bg-card border border-border/50 rounded-2xl p-6 shadow-sm mb-8 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            
            {/* Developer Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
                <Cpu className="w-4 h-4" /> Разработчик
              </label>
              <select 
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={currentDeveloper}
                onChange={(e) => updateFilters({ developer: e.target.value })}
                disabled={isPending}
              >
                <option value="all">Все производители</option>
                {filterOptions.developers.map(dev => (
                  <option key={dev} value={dev}>{dev}</option>
                ))}
              </select>
            </div>

            {/* Pricing Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
                <DollarSign className="w-4 h-4" /> Доступность
              </label>
              <select 
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={currentPricing}
                onChange={(e) => updateFilters({ pricing: e.target.value })}
                disabled={isPending}
              >
                <option value="all">Любая цена</option>
                {filterOptions.pricings.map(price => (
                  <option key={price} value={price}>{price}</option>
                ))}
              </select>
            </div>

            {/* License Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
                <FileText className="w-4 h-4" /> Лицензия
              </label>
              <select 
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={currentLicense}
                onChange={(e) => updateFilters({ license: e.target.value })}
                disabled={isPending}
              >
                <option value="all">Любая лицензия</option>
                {filterOptions.licenses.map(lic => (
                  <option key={lic} value={lic}>{lic}</option>
                ))}
              </select>
            </div>
            
          </div>

          {/* Features Toggle */}
          <div className="space-y-3 pt-4 border-t border-border/50">
            <label className="text-sm font-medium text-muted-foreground">Особенности и возможности:</label>
            <div className="flex flex-wrap gap-2">
              {FEATURE_LIST.map(feature => {
                const isActive = currentFeatures.includes(feature.id);
                return (
                  <button
                    key={feature.id}
                    onClick={() => toggleFeature(feature.id)}
                    disabled={isPending}
                    className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-all ${
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
    </div>
  );
}
