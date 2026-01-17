"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { HeaderClientWrapper } from "@/components/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, X, Image as ImageIcon, Plus } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  getNewsAction, 
  generateArticleAction,
  generateArticleFromUrlAction,
  generateImageAction,
  publishArticleAction 
} from "./actions";
import { NewsItem as NewsItemType, RSSSource } from "@/lib/news-fetcher";
import { GeneratedArticle } from "@/lib/ai-client";
import { Sparkles, Loader2, CheckCircle2, ExternalLink, Settings, Globe, Trash2, Plus as PlusIcon } from "lucide-react";
import { toast } from "sonner";
import dynamic from "next/dynamic";
import type { OutputData } from "@editorjs/editorjs";
import { generateSlug } from "@/lib/slug";

const EditorWrapper = dynamic(() => import("@/components/editor/editor-wrapper"), {
  ssr: false,
  loading: () => (
    <div className="min-h-[400px] flex items-center justify-center border border-border rounded-lg bg-secondary/20">
      <div className="text-center space-y-4">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="text-sm text-muted-foreground">Загрузка редактора...</p>
      </div>
    </div>
  ),
});
import { Switch } from "@/components/ui/switch";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface NewsItem extends NewsItemType {
  id: string;
}

const STORAGE_KEY_SOURCES = 'generator-enabled-sources';

export default function GeneratorPage() {
  const router = useRouter();
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState<string | null>(null);
  const [generatedArticle, setGeneratedArticle] = useState<GeneratedArticle | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null);
  const [generatingImage, setGeneratingImage] = useState(false);
  const [newTag, setNewTag] = useState("");
  const [slug, setSlug] = useState("");
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const [sources, setSources] = useState<RSSSource[]>([]);
  const [loadingSources, setLoadingSources] = useState(true);
  const [enabledSources, setEnabledSources] = useState<string[]>([]);
  const [parsingUrl, setParsingUrl] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const [newSourceName, setNewSourceName] = useState("");
  const [newSourceUrl, setNewSourceUrl] = useState("");
  const [addingSource, setAddingSource] = useState(false);
  const [showAddSource, setShowAddSource] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [sourceToDelete, setSourceToDelete] = useState<{ id: string; name: string } | null>(null);
  const [deletingSource, setDeletingSource] = useState(false);
  const editorDataRef = useRef<OutputData | null>(null);
  const editorHolderId = useRef(`editor-${Date.now()}`);
  const [editorKey, setEditorKey] = useState(0); // Key to force re-initialization
  
  // Infinite scroll
  const [visibleNewsCount, setVisibleNewsCount] = useState(10);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isLoadingMore && visibleNewsCount < news.length) {
          setIsLoadingMore(true);
          // Artificial delay to show loader
          setTimeout(() => {
            setVisibleNewsCount((prev) => Math.min(prev + 10, news.length));
            setIsLoadingMore(false);
          }, 1000);
        }
      },
      { 
        root: scrollRef.current,
        threshold: 0.1,
        rootMargin: "100px" // Start loading before reaching the bottom
      }
    );

    const currentRef = loadMoreRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [news.length, loading, visibleNewsCount, isLoadingMore]); // Added dependencies

  useEffect(() => {
    loadSources();
  }, []);

  useEffect(() => {
    if (sources.length > 0) {
      // Load saved enabled sources from localStorage or default to all enabled
      const saved = typeof window !== 'undefined' 
        ? localStorage.getItem(STORAGE_KEY_SOURCES)
        : null;
      
      if (saved) {
        let savedIds: string[] = [];
        try {
          savedIds = JSON.parse(saved) || [];
        } catch (error) {
          console.error('[GeneratorPage] Error parsing saved sources from localStorage:', error);
          savedIds = [];
        }
        // Filter to only include sources that exist
        const validIds = savedIds.filter((id: string) => 
          sources.some(s => s.id === id)
        );
        setEnabledSources(validIds.length > 0 ? validIds : sources.filter(s => s.enabled !== false).map(s => s.id));
      } else {
        // Default to all enabled sources
        setEnabledSources(sources.filter(s => s.enabled !== false).map(s => s.id));
      }
    }
  }, [sources]);

  useEffect(() => {
    if (enabledSources.length > 0 && !loadingSources && !loading) {
      loadNews();
    } else if (enabledSources.length === 0 && !loadingSources) {
      setNews([]);
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabledSources, loadingSources]); // loadNews вызывается внутри, избегаем зацикливания

  useEffect(() => {
    // Save enabled sources to localStorage
    if (typeof window !== 'undefined' && enabledSources.length > 0) {
      localStorage.setItem(STORAGE_KEY_SOURCES, JSON.stringify(enabledSources));
    }
  }, [enabledSources]);

  // Автогенерация slug при изменении title
  useEffect(() => {
    if (generatedArticle?.title && !slugManuallyEdited) {
      const generatedSlug = generateSlug(generatedArticle.title);
      setSlug(generatedSlug);
    }
  }, [generatedArticle?.title, slugManuallyEdited]);

  const loadSources = async () => {
    setLoadingSources(true);
    try {
      const response = await fetch('/api/rss-sources');
      if (response.ok) {
        const data = await response.json();
        const loadedSources = data.sources || [];
        setSources(loadedSources);
        
        // Если источников нет, это нормально - не показываем ошибку
        // Ошибка показывается только при реальных проблемах (не 200 статус)
      } else {
        // Только при реальной ошибке (не 200) показываем сообщение
        const errorData = await response.json().catch(() => ({}));
        toast.error("Не удалось загрузить источники", {
          description: errorData.error || "Проверьте подключение к интернету"
        });
        // Устанавливаем пустой массив, чтобы не было ошибок дальше
        setSources([]);
      }
    } catch (error) {
      console.error('Error loading sources:', error);
      // Только при сетевой ошибке или исключении показываем сообщение
      toast.error("Ошибка загрузки источников", {
        description: "Проверьте подключение к интернету"
      });
      setSources([]);
    } finally {
      setLoadingSources(false);
    }
  };

  const loadNews = async () => {
    // Проверка на наличие источников
    if (sources.length === 0) {
      toast.info("Добавьте источники", {
        description: "Для начала добавьте источники RSS, чтобы загрузить новости"
      });
      return;
    }

    // Проверка на наличие включенных источников
    if (enabledSources.length === 0) {
      toast.info("Включите источники", {
        description: "Включите хотя бы один источник, чтобы загрузить новости"
      });
      return;
    }

    setLoading(true);
    setVisibleNewsCount(20); // Reset visible count
    console.log('Loading news with sources:', enabledSources);
    const result = await getNewsAction(enabledSources);
    if (result.success && result.data) {
      // Добавляем id к каждой новости
      setNews(result.data.map((item, index) => ({
        ...item,
        id: `news-${index}-${Date.now()}`
      })));
    } else {
      toast.error("Не удалось загрузить новости", {
        description: result.error || "Проверьте подключение к интернету"
      });
    }
    setLoading(false);
  };

  const toggleSource = async (sourceId: string) => {
    const source = sources.find(s => s.id === sourceId);
    if (!source) return;

    const newEnabled = !enabledSources.includes(sourceId);
    
    // Optimistically update UI
    setEnabledSources(prev => {
      if (prev.includes(sourceId)) {
        return prev.filter(id => id !== sourceId);
      } else {
        return [...prev, sourceId];
      }
    });

    // Update on server
    try {
      const response = await fetch(`/api/rss-sources/${sourceId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: newEnabled })
      });

      if (!response.ok) {
        // Revert on error
        setEnabledSources(prev => {
          if (newEnabled) {
            return prev.filter(id => id !== sourceId);
          } else {
            return [...prev, sourceId];
          }
        });
        toast.error("Не удалось обновить источник");
      } else {
        // Reload sources to get updated state
        await loadSources();
      }
    } catch (error) {
      // Revert on error
      setEnabledSources(prev => {
        if (newEnabled) {
          return prev.filter(id => id !== sourceId);
        } else {
          return [...prev, sourceId];
        }
      });
      toast.error("Ошибка обновления источника");
    }
  };

  const handleAddSource = async () => {
    if (!newSourceUrl.trim()) {
      toast.error("Введите URL сайта");
      return;
    }

    setAddingSource(true);
    try {
      toast.info("Поиск RSS ленты...", {
        description: "Это может занять несколько секунд"
      });

      const response = await fetch('/api/rss-sources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newSourceName.trim() || undefined, // Optional name
          url: newSourceUrl.trim()
        })
      });

      if (response.ok) {
        toast.success("Источник добавлен", {
          description: "RSS лента найдена и добавлена"
        });
        setNewSourceName("");
        setNewSourceUrl("");
        setShowAddSource(false);
        await loadSources();
        // Auto-enable new source
        const data = await response.json();
        if (data.source) {
          setEnabledSources(prev => [...prev, data.source.id]);
        }
      } else {
        const error = await response.json();
        toast.error(error.error || "Не удалось добавить источник");
      }
    } catch (error) {
      toast.error("Ошибка добавления источника");
    } finally {
      setAddingSource(false);
    }
  };

  const handleDeleteSourceClick = (sourceId: string) => {
    const source = sources.find(s => s.id === sourceId);
    if (!source) return;

    setSourceToDelete({ id: sourceId, name: source.name });
    setDeleteDialogOpen(true);
  };

  const handleDeleteSource = async () => {
    if (!sourceToDelete) return;

    setDeletingSource(true);
    try {
      const response = await fetch(`/api/rss-sources/${sourceToDelete.id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        toast.success("Источник удален");
        setEnabledSources(prev => prev.filter(id => id !== sourceToDelete.id));
        await loadSources();
        setDeleteDialogOpen(false);
        setSourceToDelete(null);
      } else {
        const error = await response.json();
        toast.error(error.error || "Не удалось удалить источник");
      }
    } catch (error) {
      toast.error("Ошибка удаления источника");
    } finally {
      setDeletingSource(false);
    }
  };

  const handleParseUrl = async () => {
    if (!urlInput.trim()) {
      toast.error("Введите URL");
      return;
    }

    setParsingUrl(true);
    setGeneratedArticle(null);
    editorDataRef.current = null;
    const newHolderId = `editor-${Date.now()}`;
    editorHolderId.current = newHolderId;
    setEditorKey(prev => prev + 1); // Force editor re-initialization

    try {
      const result = await generateArticleFromUrlAction(urlInput.trim());
      
      if (!result.success || !result.data) {
        throw new Error(result.error || "Ошибка генерации");
      }

      const article = result.data;
      
      // Ограничиваем количество тегов до 3 максимум
      if (article.tags && article.tags.length > 3) {
        article.tags = article.tags.slice(0, 3);
      }
      
      // Convert blocks to Editor.js format
      const editorData: OutputData = {
        blocks: article.blocks,
        time: Date.now(),
        version: "2.29.1"
      };
      editorDataRef.current = editorData;
      
      // Reset slug and manual edit flag when generating new article
      setSlugManuallyEdited(false);
      const generatedSlug = generateSlug(article.title);
      setSlug(generatedSlug);
      
      setGeneratedArticle(article);
      setUrlInput("");

      toast.success("Статья успешно сгенерирована из URL!");
    } catch (error: any) {
      toast.error("Ошибка парсинга URL", {
        description: error.message || "Попробуйте позже"
      });
    } finally {
      setParsingUrl(false);
    }
  };

  const handleGenerate = async (newsItem: NewsItem) => {
    setGenerating(newsItem.id);
    setSelectedNews(newsItem);
    setGeneratedArticle(null);
    editorDataRef.current = null;
    const newHolderId = `editor-${Date.now()}`;
    editorHolderId.current = newHolderId;
    setEditorKey(prev => prev + 1); // Force editor re-initialization

    try {
      // Генерируем статью
      const context = newsItem.snippet || newsItem.title || '';
      const articleResult = await generateArticleAction(newsItem.title, context);
      
      if (!articleResult.success || !articleResult.data) {
        throw new Error(articleResult.error || "Ошибка генерации");
      }

      const article = articleResult.data;
      
      // Ограничиваем количество тегов до 3 максимум
      if (article.tags && article.tags.length > 3) {
        article.tags = article.tags.slice(0, 3);
      }
      
      // Convert blocks to Editor.js format
      const editorData: OutputData = {
        blocks: article.blocks,
        time: Date.now(),
        version: "2.29.1"
      };
      editorDataRef.current = editorData;
      
      // Reset slug and manual edit flag when generating new article
      setSlugManuallyEdited(false);
      const generatedSlug = generateSlug(article.title);
      setSlug(generatedSlug);
      
      setGeneratedArticle(article);

      toast.success("Статья успешно сгенерирована!");
    } catch (error: any) {
      toast.error("Ошибка генерации", {
        description: error.message || "Попробуйте позже"
      });
    } finally {
      setGenerating(null);
    }
  };

  const handleGenerateImage = async () => {
    if (!generatedArticle) return;

    setGeneratingImage(true);
    try {
      const summary = generatedArticle.blocks
        .find(b => b.type === "paragraph")?.data?.text
        ?.substring(0, 200) || generatedArticle.title;

      const imageResult = await generateImageAction(generatedArticle.title, summary);
      
      if (imageResult.success && imageResult.imageUrl) {
        // Preserve current editor blocks when updating cover image
        const currentBlocks = editorDataRef.current?.blocks || generatedArticle.blocks || [];
        setGeneratedArticle({
          ...generatedArticle,
          coverImage: imageResult.imageUrl,
          blocks: currentBlocks
        });
        toast.success("Обложка успешно сгенерирована!");
      } else {
        throw new Error(imageResult.error || "Ошибка генерации обложки");
      }
    } catch (error: any) {
      toast.error("Ошибка генерации обложки", {
        description: error.message || "Попробуйте позже"
      });
    } finally {
      setGeneratingImage(false);
    }
  };

  const handleDeleteTag = (index: number) => {
    if (!generatedArticle) return;
    const newTags = generatedArticle.tags.filter((_, i) => i !== index);
    // Preserve current editor blocks when updating tags
    const currentBlocks = editorDataRef.current?.blocks || generatedArticle.blocks || [];
    setGeneratedArticle({ 
      ...generatedArticle, 
      tags: newTags,
      blocks: currentBlocks
    });
  };

  const handleAddTag = () => {
    if (!generatedArticle || !newTag.trim()) return;
    
    // Проверка на максимум 3 тега
    if (generatedArticle.tags.length >= 3) {
      toast.error("Максимум 3 тега");
      return;
    }
    
    const trimmedTag = newTag.trim();
    if (generatedArticle.tags.includes(trimmedTag)) {
      toast.error("Тег уже существует");
      return;
    }
    // Preserve current editor blocks when updating tags
    const currentBlocks = editorDataRef.current?.blocks || generatedArticle.blocks || [];
    setGeneratedArticle({
      ...generatedArticle,
      tags: [...generatedArticle.tags, trimmedTag],
      blocks: currentBlocks
    });
    setNewTag("");
  };

  const handleEditorChange = (data: OutputData) => {
    // Always update the ref first
    editorDataRef.current = data;
    
    // Update generatedArticle state to keep it in sync
    if (generatedArticle) {
      setGeneratedArticle({
        ...generatedArticle,
        blocks: data.blocks || []
      });
    }
  };

  const handleSlugChange = (value: string) => {
    setSlug(value);
    setSlugManuallyEdited(true);
  };

  const handlePublish = async () => {
    if (!generatedArticle) return;

    if (!slug.trim()) {
      toast.error("Заполните ссылку", {
        description: "Пожалуйста, введите ссылку (slug) для статьи"
      });
      return;
    }

    setPublishing(true);
    try {
      // Use current editor data if available
      const articleToPublish = editorDataRef.current
        ? {
            ...generatedArticle,
            blocks: editorDataRef.current.blocks,
            slug: slug.trim()
          }
        : {
            ...generatedArticle,
            slug: slug.trim()
          };

      const result = await publishArticleAction(articleToPublish);
      
      if (result.success) {
        toast.success("Статья успешно опубликована!");
        setTimeout(() => {
          router.push("/dashboard/articles");
        }, 1000);
      } else {
        throw new Error(result.error || "Ошибка публикации");
      }
    } catch (error: any) {
      toast.error("Ошибка публикации", {
        description: error.message || "Попробуйте позже"
      });
    } finally {
      setPublishing(false);
    }
  };

  return (
    <>
      <HeaderClientWrapper />
      
      {/* Back Button */}
      <div className="container mx-auto px-4 pt-6 pb-6 max-w-7xl">
        <Link href="/">
          <Button variant="outline" size="sm" className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Все новости
          </Button>
        </Link>
      </div>
      
      <main className="flex-1 container mx-auto px-4 pb-8 max-w-7xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Генератор статей ИИ</h1>
          <p className="text-muted-foreground">
            Выберите новость и сгенерируйте статью с помощью искусственного интеллекта
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Новости */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold">Последние новости</h2>
              <div className="flex gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2" disabled={loadingSources}>
                      <Settings className="w-4 h-4" />
                      Источники
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-80">
                    <DropdownMenuLabel>Управление источниками</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    
                    {/* List of sources */}
                    <div className="max-h-[300px] overflow-y-auto">
                      {loadingSources ? (
                        <div className="px-2 py-4 text-center text-sm text-muted-foreground">
                          <Loader2 className="w-4 h-4 animate-spin mx-auto mb-2" />
                          Загрузка...
                        </div>
                      ) : sources.length === 0 ? (
                        <div className="px-2 py-4 text-center text-sm text-muted-foreground">
                          Нет источников
                        </div>
                      ) : (
                        sources.map((source) => (
                          <div
                            key={source.id}
                            className="flex items-center justify-between px-2 py-1.5 hover:bg-accent rounded-sm group"
                          >
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <label
                                htmlFor={`source-${source.id}`}
                                className="text-sm font-medium cursor-pointer truncate"
                                title={source.name}
                              >
                                {source.name}
                              </label>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteSourceClick(source.id);
                                }}
                                className="opacity-0 group-hover:opacity-100 hover:text-red-500 hover:bg-red-500/20 dark:hover:text-red-400 dark:hover:bg-red-500/40 dark:hover:border-red-500/50 border border-transparent transition-all p-1 rounded"
                                title="Удалить источник"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            <Switch
                              id={`source-${source.id}`}
                              checked={enabledSources.includes(source.id)}
                              onCheckedChange={() => toggleSource(source.id)}
                            />
                          </div>
                        ))
                      )}
                    </div>

                    <DropdownMenuSeparator />

                    {/* Add new source form */}
                    {showAddSource ? (
                      <div className="px-2 py-2 space-y-2">
                        <div>
                          <Input
                            placeholder="URL"
                            value={newSourceUrl}
                            onChange={(e) => setNewSourceUrl(e.target.value)}
                            className="h-8 text-sm"
                            disabled={addingSource}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && !addingSource && newSourceUrl.trim()) {
                                handleAddSource();
                              }
                            }}
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            RSS лента будет найдена автоматически
                          </p>
                        </div>
                        <Input
                          placeholder="Название"
                          value={newSourceName}
                          onChange={(e) => setNewSourceName(e.target.value)}
                          className="h-8 text-sm"
                          disabled={addingSource}
                        />
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={handleAddSource}
                            disabled={addingSource || !newSourceUrl.trim()}
                            className="flex-1 h-8 text-xs"
                          >
                            {addingSource ? (
                              <>
                                <Loader2 className="w-3 h-3 animate-spin mr-1" />
                                Поиск...
                              </>
                            ) : (
                              <>
                                <PlusIcon className="w-3 h-3 mr-1" />
                                Добавить
                              </>
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setShowAddSource(false);
                              setNewSourceName("");
                              setNewSourceUrl("");
                            }}
                            disabled={addingSource}
                            className="h-8 text-xs"
                          >
                            Отмена
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="px-2 py-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setShowAddSource(true)}
                          className="w-full justify-start h-8 text-xs"
                        >
                          <PlusIcon className="w-3 h-3 mr-2" />
                          Добавить источник
                        </Button>
                      </div>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={loadNews}
                  disabled={loading}
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "Обновить"
                  )}
                </Button>
              </div>
            </div>

            {/* URL Parser Section */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Globe className="w-5 h-5" />
                  Парсинг по URL
                </CardTitle>
                <CardDescription>
                  Вставьте ссылку на статью для автоматической генерации
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex gap-2">
                  <Input
                    placeholder="Вставьте ссылку на статью..."
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !parsingUrl) {
                        handleParseUrl();
                      }
                    }}
                    disabled={parsingUrl}
                    className="flex-1"
                  />
                  <Button
                    onClick={handleParseUrl}
                    disabled={parsingUrl || !urlInput.trim()}
                    className="gap-2"
                  >
                    {parsingUrl ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Парсинг...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        Парсить
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="animate-pulse">
                    <CardHeader>
                      <div className="h-4 bg-secondary rounded w-3/4 mb-2" />
                      <div className="h-3 bg-secondary rounded w-1/2" />
                    </CardHeader>
                    <CardContent>
                      <div className="h-20 bg-secondary rounded" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : news.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  Новости не найдены
                </CardContent>
              </Card>
            ) : (
              <div ref={scrollRef} className="space-y-4 max-h-[800px] overflow-y-auto pr-2 custom-scrollbar">
                <div className="flex justify-between items-center text-sm text-muted-foreground px-1">
                  <span>Показано {Math.min(visibleNewsCount, news.length)} из {news.length}</span>
                </div>
                
                {news.slice(0, visibleNewsCount).map((item) => (
                  <Card key={item.id} className="hover:border-primary/50 transition-colors">
                    <CardHeader>
                      <CardTitle className="text-lg line-clamp-2">{item.title}</CardTitle>
                      <CardDescription className="flex items-center gap-2">
                        <span>{new Date(item.pubDate).toLocaleDateString('ru-RU')}</span>
                        {item.link && (
                          <a
                            href={item.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs hover:text-primary"
                          >
                            Источник: {(() => {
                              try {
                                if (!item.link) return '';
                                const url = new URL(item.link);
                                return url.hostname.replace(/^www\./, '');
                              } catch (e) {
                                return '';
                              }
                            })()} <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                        {item.snippet || 'Описание отсутствует'}
                      </p>
                      <Button
                        onClick={() => handleGenerate(item)}
                        disabled={generating === item.id}
                        className="w-full gap-2"
                        variant={selectedNews?.id === item.id ? "default" : "outline"}
                      >
                        {generating === item.id ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Генерация...
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-4 h-4" />
                            Сгенерировать статью
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
                
                {visibleNewsCount < news.length && (
                  <div ref={loadMoreRef} className="py-4 text-center text-muted-foreground flex flex-col items-center justify-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin text-primary" />
                    <span className="text-xs">Загрузка...</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Результат генерации */}
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold">Результат</h2>

            {!generatedArticle ? (
              <Card>
                <CardContent className="py-16 text-center">
                  <Sparkles className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">
                    Выберите новость и нажмите &quot;Сгенерировать статью&quot;
                  </p>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <CardTitle className="mb-2">{generatedArticle.title}</CardTitle>
                      <CardDescription>
                        Сгенерированная статья готова к публикации
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setGeneratedArticle(null);
                          setSelectedNews(null);
                          editorDataRef.current = null;
                          setSlug("");
                          setSlugManuallyEdited(false);
                          const newHolderId = `editor-${Date.now()}`;
                          editorHolderId.current = newHolderId;
                          setEditorKey(prev => prev + 1); // Force editor re-initialization
                        }}
                      >
                        Очистить
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Cover Image Section */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold">Обложка:</h3>
                      <Button
                        onClick={handleGenerateImage}
                        disabled={generatingImage}
                        variant="outline"
                        size="sm"
                        className="gap-2"
                      >
                        {generatingImage ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Генерация...
                          </>
                        ) : (
                          <>
                            <ImageIcon className="w-4 h-4" />
                            Сгенерировать обложку
                          </>
                        )}
                      </Button>
                    </div>
                    {generatedArticle.coverImage ? (
                      <div className="relative w-full aspect-video rounded-lg overflow-hidden border border-border">
                        <Image
                          src={generatedArticle.coverImage}
                          alt={generatedArticle.title}
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 100vw, 768px"
                          unoptimized={generatedArticle.coverImage?.startsWith('/') || generatedArticle.coverImage?.startsWith('http')}
                        />
                      </div>
                    ) : (
                      <div className="w-full aspect-video rounded-lg border border-dashed border-border flex items-center justify-center bg-secondary/30">
                        <p className="text-sm text-muted-foreground">
                          Обложка не сгенерирована
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Slug Section */}
                  <div>
                    <h3 className="font-semibold mb-2">Ссылка (Slug):</h3>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">domain.com/</span>
                        <Input
                          type="text"
                          value={slug}
                          onChange={(e) => {
                            // Client-side validation: only allow lowercase letters, numbers, and hyphens
                            const value = e.target.value;
                            const validated = value.replace(/[^a-z0-9-]/gi, '').toLowerCase();
                            handleSlugChange(validated);
                          }}
                          placeholder="article-slug"
                          className="flex-1 font-mono text-sm"
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Разрешены только строчные латинские буквы, цифры и дефисы
                      </p>
                    </div>
                  </div>

                  {/* Tags Section */}
                  <div>
                    <h3 className="font-semibold mb-2">Теги:</h3>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {generatedArticle.tags.map((tag, i) => (
                        <Badge
                          key={i}
                          variant="secondary"
                          className="gap-1 pr-1"
                        >
                          {tag}
                          <button
                            onClick={() => handleDeleteTag(i)}
                            className="ml-1 hover:bg-destructive/20 rounded-full p-0.5 transition-colors"
                            type="button"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <Input
                        placeholder={generatedArticle?.tags.length === 3 ? "Максимум 3 тега" : "Добавить тег (макс. 3)"}
                        value={newTag}
                        onChange={(e) => setNewTag(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleAddTag();
                          }
                        }}
                        className="flex-1"
                        disabled={(generatedArticle?.tags.length || 0) >= 3}
                      />
                      <Button
                        onClick={handleAddTag}
                        variant="outline"
                        size="sm"
                        className="gap-2"
                        disabled={!newTag.trim() || (generatedArticle?.tags.length || 0) >= 3}
                      >
                        <Plus className="w-4 h-4" />
                        Добавить
                      </Button>
                    </div>
                  </div>

                  {/* Editor.js Content Section */}
                  <div>
                    <h3 className="font-semibold mb-2">Содержимое:</h3>
                    <div className="border border-border rounded-lg p-4 bg-background min-h-[400px]">
                      <EditorWrapper
                        key={editorKey} // Force re-initialization when key changes
                        data={editorDataRef.current || {
                          blocks: generatedArticle.blocks || [],
                          time: Date.now(),
                          version: "2.29.1"
                        }}
                        onChange={handleEditorChange}
                        holder={editorHolderId.current}
                      />
                    </div>
                  </div>

                  <Button
                    onClick={handlePublish}
                    disabled={publishing}
                    className="w-full gap-2"
                    size="lg"
                  >
                    {publishing ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Публикация...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        Опубликовать статью
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>

      {/* Delete Source Confirmation Dialog */}
      <AlertDialog 
        open={deleteDialogOpen} 
        onOpenChange={(open) => {
          setDeleteDialogOpen(open);
          if (!open) {
            setSourceToDelete(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить источник?</AlertDialogTitle>
            <AlertDialogDescription>
              Вы уверены, что хотите удалить источник <strong>&quot;{sourceToDelete?.name}&quot;</strong>?
              <br />
              Это действие нельзя отменить.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletingSource}>Отмена</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteSource}
              disabled={deletingSource}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deletingSource ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Удаление...
                </>
              ) : (
                "Удалить"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
