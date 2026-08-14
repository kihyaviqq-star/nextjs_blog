"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Search,
  Sparkles,
  Download,
  BookOpen,
  FolderTree,
  Moon,
  Sun,
  LayoutDashboard,
  ArrowRight,
  Loader2,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SearchResultItem {
  id: string;
  slug: string;
  title?: string;
  name?: string;
  excerpt?: string;
  shortDesc?: string;
  pricing?: string;
  category?: { name: string };
  icon?: string | null;
}

interface SearchResults {
  posts: SearchResultItem[];
  aiTools: SearchResultItem[];
  software: SearchResultItem[];
  categories: SearchResultItem[];
}

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SearchResults>({
    posts: [],
    aiTools: [],
    software: [],
    categories: [],
  });

  const router = useRouter();
  const { theme, setTheme } = useTheme();

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Debounced search
  useEffect(() => {
    if (!query.trim() || query.length < 2) {
      setResults({ posts: [], aiTools: [], software: [], categories: [] });
      setLoading(false);
      return;
    }

    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search/global?q=${encodeURIComponent(query)}`);
        if (res.ok) {
          const data = await res.json();
          setResults(data);
        }
      } catch (e) {
        console.error("Command palette search error:", e);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSelect = useCallback(
    (url: string) => {
      setOpen(false);
      setQuery("");
      router.push(url);
    },
    [router]
  );

  const hasResults =
    results.posts.length > 0 ||
    results.aiTools.length > 0 ||
    results.software.length > 0 ||
    results.categories.length > 0;

  return (
    <>
      {/* Trigger button rendered in header */}
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-normal text-muted-foreground bg-secondary/50 hover:bg-secondary border border-border/50 hover:border-border transition-all duration-150 cursor-pointer"
        aria-label="Поиск по сайту"
      >
        <Search className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Поиск...</span>
        <kbd className="pointer-events-none hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border border-border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="p-0 max-w-xl overflow-hidden border-border/80 bg-background/95 backdrop-blur-xl shadow-2xl rounded-2xl sm:rounded-2xl top-[25%] translate-y-[-25%]">
          <DialogTitle className="sr-only">Командная панель и глобальный поиск</DialogTitle>

          {/* Search Input Box */}
          <div className="flex items-center px-4 border-b border-border/60">
            <Search className="w-5 h-5 text-muted-foreground shrink-0 mr-3" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Поиск статей, нейросетей, софта, категорий..."
              className="w-full py-4 text-base bg-transparent border-none outline-none focus:ring-0 placeholder:text-muted-foreground/60 text-foreground"
              autoFocus
            />
            {loading && <Loader2 className="w-4 h-4 text-primary animate-spin shrink-0 ml-2" />}
            {query && (
              <button
                onClick={() => setQuery("")}
                className="p-1 text-muted-foreground hover:text-foreground rounded-md transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Search Results / Navigation Area */}
          <div className="max-h-[60vh] overflow-y-auto p-2 space-y-4">
            {/* Quick Actions (when query is empty) */}
            {!query.trim() && (
              <div className="space-y-1">
                <div className="px-3 py-1.5 text-xs font-semibold text-muted-foreground tracking-wider uppercase">
                  Быстрый переход
                </div>
                <button
                  onClick={() => handleSelect("/")}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm hover:bg-accent/60 transition-colors text-left group"
                >
                  <div className="flex items-center gap-2.5">
                    <BookOpen className="w-4 h-4 text-blue-500" />
                    <span>Главная & Блог</span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 transition-all" />
                </button>
                <button
                  onClick={() => handleSelect("/tools")}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm hover:bg-accent/60 transition-colors text-left group"
                >
                  <div className="flex items-center gap-2.5">
                    <Sparkles className="w-4 h-4 text-purple-500" />
                    <span>Каталог нейросетей & ИИ</span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 transition-all" />
                </button>
                <button
                  onClick={() => handleSelect("/software")}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm hover:bg-accent/60 transition-colors text-left group"
                >
                  <div className="flex items-center gap-2.5">
                    <Download className="w-4 h-4 text-emerald-500" />
                    <span>Каталог программ & ПО</span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 transition-all" />
                </button>
                <button
                  onClick={() => handleSelect("/dashboard")}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm hover:bg-accent/60 transition-colors text-left group"
                >
                  <div className="flex items-center gap-2.5">
                    <LayoutDashboard className="w-4 h-4 text-amber-500" />
                    <span>Панель управления (Dashboard)</span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 transition-all" />
                </button>
                <button
                  onClick={() => {
                    setTheme(theme === "dark" ? "light" : "dark");
                    setOpen(false);
                  }}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm hover:bg-accent/60 transition-colors text-left group"
                >
                  <div className="flex items-center gap-2.5">
                    {theme === "dark" ? (
                      <Sun className="w-4 h-4 text-amber-400" />
                    ) : (
                      <Moon className="w-4 h-4 text-indigo-400" />
                    )}
                    <span>
                      Переключить тему ({theme === "dark" ? "Светлая" : "Темная"})
                    </span>
                  </div>
                  <kbd className="text-[10px] px-1.5 py-0.5 rounded border border-border bg-muted text-muted-foreground">
                    Тема
                  </kbd>
                </button>
              </div>
            )}

            {/* Articles Results */}
            {results.posts.length > 0 && (
              <div className="space-y-1">
                <div className="px-3 py-1 text-xs font-semibold text-muted-foreground tracking-wider uppercase flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5" /> Статьи ({results.posts.length})
                </div>
                {results.posts.map((post) => (
                  <button
                    key={post.id}
                    onClick={() => handleSelect(`/${post.slug}`)}
                    className="w-full flex items-start gap-3 px-3 py-2 rounded-lg text-sm hover:bg-accent/60 transition-colors text-left group"
                  >
                    <div className="mt-0.5 shrink-0 w-2 h-2 rounded-full bg-primary" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-foreground group-hover:text-primary transition-colors truncate">
                        {post.title}
                      </div>
                      {post.excerpt && (
                        <div className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                          {post.excerpt}
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* AI Tools Results */}
            {results.aiTools.length > 0 && (
              <div className="space-y-1">
                <div className="px-3 py-1 text-xs font-semibold text-muted-foreground tracking-wider uppercase flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-purple-400" /> Нейросети & ИИ ({results.aiTools.length})
                </div>
                {results.aiTools.map((tool) => (
                  <button
                    key={tool.id}
                    onClick={() => handleSelect(`/tools/${tool.slug}`)}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm hover:bg-accent/60 transition-colors text-left group"
                  >
                    <div className="flex-1 min-w-0 pr-2">
                      <div className="font-medium text-foreground group-hover:text-purple-400 transition-colors truncate">
                        {tool.name}
                      </div>
                      {tool.shortDesc && (
                        <div className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                          {tool.shortDesc}
                        </div>
                      )}
                    </div>
                    {tool.pricing && (
                      <span className="shrink-0 text-[11px] px-2 py-0.5 rounded-full bg-secondary text-foreground/80 font-medium">
                        {tool.pricing}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}

            {/* Software Results */}
            {results.software.length > 0 && (
              <div className="space-y-1">
                <div className="px-3 py-1 text-xs font-semibold text-muted-foreground tracking-wider uppercase flex items-center gap-1.5">
                  <Download className="w-3.5 h-3.5 text-emerald-400" /> Программы & Софт ({results.software.length})
                </div>
                {results.software.map((sw) => (
                  <button
                    key={sw.id}
                    onClick={() => handleSelect(`/software/${sw.slug}`)}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm hover:bg-accent/60 transition-colors text-left group"
                  >
                    <div className="flex-1 min-w-0 pr-2">
                      <div className="font-medium text-foreground group-hover:text-emerald-400 transition-colors truncate">
                        {sw.name}
                      </div>
                      {sw.shortDesc && (
                        <div className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                          {sw.shortDesc}
                        </div>
                      )}
                    </div>
                    {sw.pricing && (
                      <span className="shrink-0 text-[11px] px-2 py-0.5 rounded-full bg-secondary text-foreground/80 font-medium">
                        {sw.pricing}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}

            {/* Categories Results */}
            {results.categories.length > 0 && (
              <div className="space-y-1">
                <div className="px-3 py-1 text-xs font-semibold text-muted-foreground tracking-wider uppercase flex items-center gap-1.5">
                  <FolderTree className="w-3.5 h-3.5" /> Категории
                </div>
                <div className="grid grid-cols-2 gap-1.5 px-1">
                  {results.categories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => handleSelect(`/tools?category=${cat.slug}`)}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium bg-secondary/40 hover:bg-secondary text-foreground transition-colors text-left"
                    >
                      <FolderTree className="w-3.5 h-3.5 text-primary" />
                      <span className="truncate">{cat.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* No results message */}
            {query.trim().length >= 2 && !loading && !hasResults && (
              <div className="py-8 text-center text-sm text-muted-foreground">
                По запросу «<span className="text-foreground font-medium">{query}</span>» ничего не найдено.
              </div>
            )}
          </div>

          {/* Footer bar */}
          <div className="px-4 py-2 bg-muted/40 border-t border-border/50 text-[11px] text-muted-foreground flex items-center justify-between">
            <span>Используйте стрелки и Enter для перехода</span>
            <kbd className="px-1 py-0.5 rounded border border-border bg-background">ESC</kbd>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
